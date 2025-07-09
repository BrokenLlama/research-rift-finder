
import React from 'react';
import { Bot } from 'lucide-react';

interface EmptyStateProps {
  paperCount: number;
}

const EmptyState: React.FC<EmptyStateProps> = ({ paperCount }) => {
  return (
    <div className="text-center text-gray-500 py-8">
      <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <p>Ask me anything about your selected papers!</p>
      <p className="text-sm mt-2">
        I can help analyze, summarize, and answer questions based on the {paperCount} papers in this list.
      </p>
    </div>
  );
};

export default EmptyState;
