
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  summary: any;
}

export const useResearchChat = (listId: string | null, listName: string | null) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && listId) {
      initializeChat();
    }
  }, [user, listId]);

  const initializeChat = async () => {
    try {
      // Fetch papers from the selected list
      const { data: papersData, error: papersError } = await supabase
        .from('papers')
        .select('*')
        .eq('list_id', listId);

      if (papersError) {
        toast({
          title: "Error",
          description: "Failed to load papers for chat.",
          variant: "destructive",
        });
        return;
      }

      const typedPapers: Paper[] = (papersData || []).map(paper => ({
        id: paper.id,
        title: paper.title,
        authors: Array.isArray(paper.authors) ? paper.authors as string[] : [],
        abstract: paper.abstract,
        publication_year: paper.publication_year,
        journal: paper.journal,
        summary: paper.summary,
      }));
      setPapers(typedPapers);

      // Create or get existing chat session
      let currentSessionId = sessionId;
      
      if (!currentSessionId) {
        const { data: existingSession, error: sessionError } = await supabase
          .from('chat_sessions')
          .select('id')
          .eq('user_id', user?.id)
          .eq('list_id', listId)
          .maybeSingle();

        if (existingSession) {
          currentSessionId = existingSession.id;
        } else {
          const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: user?.id,
              list_id: listId,
              name: `Chat with ${listName || 'Papers'}`,
            })
            .select('id')
            .single();

          if (createError) {
            toast({
              title: "Error",
              description: "Failed to create chat session.",
              variant: "destructive",
            });
            return;
          }

          currentSessionId = newSession.id;
        }

        setSessionId(currentSessionId);
      }

      // Load existing messages
      if (currentSessionId) {
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true });

        if (messagesError) {
          console.error('Error loading messages:', messagesError);
        } else {
          const typedMessages: Message[] = (messagesData || []).map(msg => ({
            id: msg.id,
            role: (msg.role === 'user' || msg.role === 'assistant') ? msg.role : 'user',
            content: msg.content,
            created_at: msg.created_at || new Date().toISOString(),
          }));
          setMessages(typedMessages);
        }
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || !sessionId || isLoading) return;

    setIsLoading(true);

    try {
      // Save user message to database
      const { data: savedMessage, error: saveError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: messageContent,
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      const typedUserMessage: Message = {
        id: savedMessage.id,
        role: 'user',
        content: savedMessage.content,
        created_at: savedMessage.created_at || new Date().toISOString(),
      };

      const updatedMessages = [...messages, typedUserMessage];
      setMessages(updatedMessages);

      // Prepare messages for API
      const chatMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call Groq edge function
      const response = await supabase.functions.invoke('groq-chat', {
        body: {
          messages: chatMessages,
          papers: papers,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const { message: assistantResponse } = response.data;

      // Save assistant message
      const { data: assistantMessage, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'assistant',
          content: assistantResponse,
        })
        .select()
        .single();

      if (assistantError) {
        throw assistantError;
      }

      const typedAssistantMessage: Message = {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        created_at: assistantMessage.created_at || new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, typedAssistantMessage];
      setMessages(finalMessages);

      // Update the session
      await supabase
        .from('chat_sessions')
        .update({ 
          updated_at: new Date().toISOString(),
          name: `Chat about ${papers.length} papers`
        })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSession = async () => {
    if (!listId || !user) return;
    
    // Create a new chat session
    const { data: newSession, error } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: user.id,
        list_id: listId,
        name: `New Chat with ${listName || 'Papers'}`,
      })
      .select('id')
      .single();

    if (!error && newSession) {
      setSessionId(newSession.id);
      setMessages([]);
    }
  };

  return {
    messages,
    papers,
    isLoading,
    sendMessage,
    createNewSession,
  };
};
