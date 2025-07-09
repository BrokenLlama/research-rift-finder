
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot } from 'lucide-react';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';
import PlagiarismChecker from '@/components/PlagiarismChecker';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useResearchChat } from '@/hooks/useResearchChat';
import ChatArea from '@/components/research-chat/ChatArea';
import ChatInput from '@/components/research-chat/ChatInput';
import ChatAllHistory from '@/components/research-chat/ChatAllHistory';

const ResearchChat = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const listId = searchParams.get('listId');
  const listName = searchParams.get('listName');
  
  const [newMessage, setNewMessage] = useState('');
  const [showPlagiarismChecker, setShowPlagiarismChecker] = useState(false);
  
  const { chatHistory } = useChatHistory(listId || undefined);
  const { messages, papers, isLoading, sendMessage, createNewSession } = useResearchChat(listId, listName);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    await sendMessage(newMessage);
    setNewMessage('');
  };

  const handleChatSelect = (chatMessages: any[]) => {
    // This functionality is now handled by the useResearchChat hook
    console.log('Selected chat messages:', chatMessages);
  };

  const handleNewChat = async () => {
    await createNewSession();
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
                
                <ChatAllHistory chatHistory={chatHistory} />
                
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

                <ChatArea 
                  messages={messages}
                  isLoading={isLoading}
                  paperCount={papers.length}
                />
                
                <ChatInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSubmit={handleSendMessage}
                  disabled={isLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchChat;
