
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import PlagiarismChecker from '@/components/PlagiarismChecker';
import { useChatHistory } from '@/hooks/useChatHistory';

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
  const [showPlagiarismChecker, setShowPlagiarismChecker] = useState(false);
  
  const { currentChat, createNewChat, updateChatMessages, chatHistory } = useChatHistory(listId || undefined);

  useEffect(() => {
    if (user && listId) {
      initializeChat();
    }
  }, [user, listId, currentChat]);

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

      // Load existing messages if we have a current chat
      if (currentChat && currentChat.messages) {
        const chatMessages: Message[] = currentChat.messages.map((msg, index) => ({
          id: `msg-${index}`,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          created_at: new Date().toISOString(),
        }));
        setMessages(chatMessages);
      } else if (currentSessionId) {
        // Load messages from chat_messages table
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

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !sessionId || isLoading) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      // Save user message to database
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

      // Update chat history in both tables
      if (currentChat) {
        const historyMessages = finalMessages.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        await updateChatMessages(currentChat.id, historyMessages);
      }

      // Also update the session
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

  const handleChatSelect = (chatMessages: any[]) => {
    const convertedMessages: Message[] = chatMessages.map((msg, index) => ({
      id: `history-${index}`,
      role: msg.role,
      content: msg.content,
      created_at: new Date().toISOString(),
    }));
    setMessages(convertedMessages);
  };

  const handleNewChat = async () => {
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
      setNewMessage('');
      
      // Also create in chat_history
      await createNewChat(listId, `New Chat with ${listName || 'Papers'}`);
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
              <div className="space-y-6">
                <p className="text-gray-600 mb-4">
                  Select a paper list to start chatting with your research papers, or view your chat history below.
                </p>
                
                {/* Show all chat history when no list is selected */}
                {chatHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Your Recent Chats</h3>
                    <div className="space-y-3">
                      {chatHistory.map((chat) => (
                        <Card key={chat.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium">{chat.title}</h4>
                                <p className="text-sm text-gray-500 mt-1">
                                  {Array.isArray(chat.messages) ? chat.messages.length : 0} messages
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Updated: {new Date(chat.updated_at).toLocaleDateString()}
                                </p>
                              </div>
                              <MessageCircle className="h-5 w-5 text-gray-400" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-sm text-gray-500">
                  Go to "My Lists" and click "Chat" on any list to start a conversation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
          {/* Chat History Sidebar */}
          <div className="lg:col-span-1">
            <ChatHistorySidebar
              listId={listId}
              listName={listName || 'Papers'}
              onChatSelect={handleChatSelect}
              onNewChat={handleNewChat}
            />
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot className="h-5 w-5 mr-2 text-blue-600" />
                    Chat with {listName || 'Your Papers'} ({papers.length} papers) - Powered by Groq
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPlagiarismChecker(!showPlagiarismChecker)}
                  >
                    Plagiarism Checker
                  </Button>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Plagiarism Checker */}
                {showPlagiarismChecker && (
                  <div className="mb-4">
                    <PlagiarismChecker />
                  </div>
                )}

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
      </div>
    </div>
  );
};

export default ResearchChat;
