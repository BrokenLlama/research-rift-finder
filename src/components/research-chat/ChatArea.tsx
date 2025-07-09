
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatMessage from './ChatMessage';
import LoadingIndicator from './LoadingIndicator';
import EmptyState from './EmptyState';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ChatAreaProps {
  messages: Message[];
  isLoading: boolean;
  paperCount: number;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, isLoading, paperCount }) => {
  return (
    <ScrollArea className="flex-1 pr-4 mb-4">
      <div className="space-y-4">
        {messages.length === 0 && (
          <EmptyState paperCount={paperCount} />
        )}
        
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isLoading && <LoadingIndicator />}
      </div>
    </ScrollArea>
  );
};

export default ChatArea;
