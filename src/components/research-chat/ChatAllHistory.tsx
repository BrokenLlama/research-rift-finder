
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

interface ChatHistoryEntry {
  id: string;
  title: string;
  messages: any[];
  updated_at: string;
}

interface ChatAllHistoryProps {
  chatHistory: ChatHistoryEntry[];
}

const ChatAllHistory: React.FC<ChatAllHistoryProps> = ({ chatHistory }) => {
  if (chatHistory.length === 0) return null;

  return (
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
  );
};

export default ChatAllHistory;
