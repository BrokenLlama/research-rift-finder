
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
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

const ResearchChat = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const listId = searchParams.get('listId');
  const listName = searchParams.get('listName');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

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

      setPapers(papersData || []);

      // Create or get existing chat session
      const { data: existingSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user?.id)
        .eq('list_id', listId)
        .single();

      let currentSessionId;

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

      // Load existing messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error loading messages:', messagesError);
      } else {
        setMessages(messagesData || []);
      }

    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId || isLoading) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      // Save user message
      const { data: savedMessage, error: saveError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          role: 'user',
          content: userMessage,
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }

      // Add user message to UI immediately
      setMessages(prev => [...prev, savedMessage]);

      // Prepare messages for API
      const chatMessages = [...messages, savedMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call our edge function for chat completion
      const response = await supabase.functions.invoke('chat-completion', {
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

      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Please sign in to use the research chat.</p>
        </div>
      </div>
    );
  }

  if (!listId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Research Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Select a paper list to start chatting with your research papers.
              </p>
              <p className="text-sm text-gray-500">
                Go to "My Lists" and click "Chat" on any list to start a conversation.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bot className="h-5 w-5 mr-2 text-blue-600" />
              Chat with {listName || 'Your Papers'} ({papers.length} papers)
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>Ask me anything about your selected papers!</p>
                    <p className="text-sm mt-2">
                      I can help analyze, summarize, and answer questions based on the {papers.length} papers in this list.
                    </p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        {message.role === 'assistant' && (
                          <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User className="h-4 w-4 mt-1 flex-shrink-0" />
                        )}
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <Bot className="h-4 w-4" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <form onSubmit={sendMessage} className="flex space-x-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ask a question about your papers..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResearchChat;
