
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Plus, Trash2, FileText } from 'lucide-react';
import { useChatHistory } from '@/hooks/useChatHistory';
import { formatDistanceToNow } from 'date-fns';

interface ChatHistorySidebarProps {
  listId: string;
  listName: string;
  onChatSelect: (messages: any[]) => void;
  onNewChat: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  listId,
  listName,
  onChatSelect,
  onNewChat,
}) => {
  const { chatHistory, currentChat, loading, loadChat, deleteChat, createNewChat } = useChatHistory(listId);

  const handleNewChat = async () => {
    const newChat = await createNewChat(listId, `Chat with ${listName}`);
    if (newChat) {
      onNewChat();
    }
  };

  const handleChatSelect = (chat: any) => {
    loadChat(chat);
    onChatSelect(chat.messages || []);
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Past Chats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <MessageCircle className="h-4 w-4 mr-2" />
            Chat History
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pt-0">
        <ScrollArea className="h-full">
          {chatHistory.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">No chat history yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNewChat}
                className="mt-2"
              >
                Start New Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    currentChat?.id === chat.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => handleChatSelect(chat)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        <FileText className="h-3 w-3 mr-1 text-gray-400" />
                        <p className="font-medium text-sm truncate">{chat.title}</p>
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        {Array.isArray(chat.messages) ? chat.messages.length : 0} messages
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ChatHistorySidebar;
