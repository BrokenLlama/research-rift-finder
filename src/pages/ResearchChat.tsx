
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, MessageCircle, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useNavigate } from 'react-router-dom';

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

interface PaperList {
  id: string;
  name: string;
  description: string | null;
  paper_count: number;
}

const ResearchChat = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const listId = searchParams.get('listId');
  const listName = searchParams.get('listName');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [userLists, setUserLists] = useState<PaperList[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  
  const { currentChat, createNewChat, updateChatMessages, loading: chatHistoryLoading } = useChatHistory(listId || undefined);

  useEffect(() => {
    if (user) {
      if (listId) {
        initializeChat();
      } else {
        fetchUserLists();
      }
    }
  }, [user, listId]);

  // Load messages when currentChat changes
  useEffect(() => {
    if (currentChat) {
      const convertedMessages: Message[] = currentChat.messages.map((msg, index) => ({
        id: `chat-${currentChat.id}-${index}`,
        role: msg.role,
        content: msg.content,
        created_at: new Date().toISOString(),
      }));
      setMessages(convertedMessages);
    } else {
      setMessages([]);
    }
  }, [currentChat]);

  const fetchUserLists = async () => {
    if (!user) return;
    
    setLoadingLists(true);
    try {
      // Get all lists with paper counts
      const { data: listsData, error: listsError } = await supabase
        .from('paper_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listsError) {
        toast({
          title: "Error",
          description: "Failed to fetch your lists.",
          variant: "destructive",
        });
        return;
      }

      // Get paper counts for each list
      const listsWithCount = await Promise.all(
        listsData.map(async (list) => {
          const { count, error: countError } = await supabase
            .from('papers')
            .select('*', { count: 'exact', head: true })
            .eq('list_id', list.id);

          if (countError) {
            console.error('Error getting count for list:', list.id, countError);
            return { ...list, paper_count: 0 };
          }

          return { ...list, paper_count: count || 0 };
        })
      );

      setUserLists(listsWithCount);
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setLoadingLists(false);
    }
  };

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

      // Cast the papers data to match our interface
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

    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    try {
      // Ensure we have a current chat
      let chatToUse = currentChat;
      if (!chatToUse && listId) {
        chatToUse = await createNewChat(listId, `Chat with ${listName || 'Papers'}`);
      }

      if (!chatToUse) {
        throw new Error('Failed to create or get chat session');
      }

      // Add user message to UI immediately
      const userMessageObj: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: userMessage,
        created_at: new Date().toISOString(),
      };

      const updatedMessages = [...messages, userMessageObj];
      setMessages(updatedMessages);

      // Prepare messages for API
      const chatMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Call our Groq edge function
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

      // Add assistant message to UI
      const assistantMessageObj: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantResponse,
        created_at: new Date().toISOString(),
      };

      const finalMessages = [...updatedMessages, assistantMessageObj];
      setMessages(finalMessages);

      // Update chat history in database
      const historyMessages = finalMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      await updateChatMessages(chatToUse.id, historyMessages);

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
    if (listId) {
      const newChat = await createNewChat(listId, `Chat with ${listName || 'Papers'}`);
      if (newChat) {
        setMessages([]);
        setNewMessage('');
      }
    }
  };

  const startChatWithList = (list: PaperList) => {
    navigate(`/research-chat?listId=${list.id}&listName=${encodeURIComponent(list.name)}`);
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Research Chat</h1>
            <p className="text-xl text-gray-600">
              Choose a paper list to start chatting with your research papers
            </p>
          </div>

          {loadingLists ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading your lists...</p>
            </div>
          ) : userLists.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Lists Available</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  You don't have any paper lists yet. Create a list first to start chatting.
                </p>
                <Button onClick={() => navigate('/my-lists')}>
                  Go to My Lists
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {userLists.map((list) => (
                <Card key={list.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => startChatWithList(list)}>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      {list.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {list.description && (
                      <p className="text-sm text-gray-600 mb-4">{list.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {list.paper_count} papers
                      </span>
                      <Button size="sm" className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-600" />
                  Chat with {listName || 'Your Papers'} ({papers.length} papers) - Powered by Groq
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 pr-4 mb-4">
                  <div className="space-y-4">
                    {messages.length === 0 && !chatHistoryLoading && (
                      <div className="text-center text-gray-500 py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>Ask me anything about your selected papers!</p>
                        <p className="text-sm mt-2">
                          I can help analyze, summarize, and answer questions based on the {papers.length} papers in this list.
                        </p>
                      </div>
                    )}
                    
                    {chatHistoryLoading && (
                      <div className="text-center text-gray-500 py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p>Loading chat history...</p>
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
                    disabled={isLoading || chatHistoryLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !newMessage.trim() || chatHistoryLoading}>
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
