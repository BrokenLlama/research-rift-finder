
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, RotateCcw, FileText, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SavedPaper {
  id: string;
  title: string;
  authors: Array<{ display_name: string }>;
  publication_year: number;
  journal?: string;
  abstract?: string;
  summary?: {
    objective: string;
    methodology: string;
    findings: string;
    limitations: string;
  };
}

const ResearchChat = () => {
  const [chatPapers, setChatPapers] = useState<SavedPaper[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const storedPapers = localStorage.getItem('scholarmate_chat_papers');
    if (storedPapers) {
      setChatPapers(JSON.parse(storedPapers));
    } else {
      navigate('/saved-papers');
    }

    const storedMessages = localStorage.getItem('scholarmate_chat_history');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveMessageToHistory = (newMessages: ChatMessage[]) => {
    setMessages(newMessages);
    localStorage.setItem('scholarmate_chat_history', JSON.stringify(newMessages));
  };

  const generateAIResponse = async (userQuestion: string): Promise<string> => {
    // Create context from papers
    const papersContext = chatPapers.map(paper => {
      let context = `Paper: "${paper.title}" by ${paper.authors.map(a => a.display_name).join(', ')} (${paper.publication_year})\n`;
      
      if (paper.abstract) {
        context += `Abstract: ${paper.abstract}\n`;
      }
      
      if (paper.summary) {
        context += `Summary:\n`;
        context += `- Objective: ${paper.summary.objective}\n`;
        context += `- Methodology: ${paper.summary.methodology}\n`;
        context += `- Findings: ${paper.summary.findings}\n`;
        context += `- Limitations: ${paper.summary.limitations}\n`;
      }
      
      return context;
    }).join('\n---\n');

    const systemMessage = "You are an academic research assistant. You can only use the abstracts and summaries of the saved papers to answer the user's questions. If the answer is not in the papers, say 'I don't have enough information from the papers you saved.'";
    
    const prompt = `${systemMessage}\n\nPapers Context:\n${papersContext}\n\nUser Question: ${userQuestion}\n\nPlease provide a helpful response based only on the information from these papers.`;

    // For demo purposes, we'll simulate an AI response
    // In a real implementation, you would call an LLM API like OpenRouter or Hugging Face
    return simulateAIResponse(userQuestion, papersContext);
  };

  const simulateAIResponse = async (question: string, context: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple keyword-based responses for demo
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('methodology') || lowerQuestion.includes('method')) {
      return "Based on the papers you've saved, the methodologies mentioned include systematic research approaches and evidence-based evaluation techniques. However, for more specific methodological details, I would need more comprehensive information from the full papers.";
    }
    
    if (lowerQuestion.includes('finding') || lowerQuestion.includes('result')) {
      return "The papers you've saved mention significant insights and measurable outcomes that contribute to their respective fields. The key findings reveal important discoveries that provide new perspectives for future research and practical applications.";
    }
    
    if (lowerQuestion.includes('limitation')) {
      return "The papers acknowledge certain constraints and suggest areas for future research. They identify opportunities for extended investigation and broader scope in future studies.";
    }
    
    if (lowerQuestion.includes('objective') || lowerQuestion.includes('goal')) {
      return "The research objectives in your saved papers focus on advancing knowledge in their respective domains through comprehensive analysis and evidence-based findings. They aim to investigate and analyze key aspects of their subject matter.";
    }
    
    return "I don't have enough information from the papers you saved to provide a specific answer to your question. Could you try asking about the methodology, findings, objectives, or limitations mentioned in the papers?";
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    saveMessageToHistory(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const aiResponse = await generateAIResponse(inputMessage);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      saveMessageToHistory([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error generating AI response:', error);
      toast({
        title: "Error",
        description: "Failed to generate response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem('scholarmate_chat_history');
    toast({
      title: "Chat cleared",
      description: "All messages have been removed.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate('/saved-papers')}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 mr-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Saved Papers
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Research Chat</h1>
                <p className="text-gray-600">
                  Ask questions about your {chatPapers.length} selected paper{chatPapers.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              onClick={handleClearChat}
              disabled={messages.length === 0}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>

          {/* Selected Papers Info */}
          <Card className="mb-6 border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                Selected Papers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chatPapers.map((paper, index) => (
                  <div key={paper.id} className="text-sm">
                    <span className="font-medium">{index + 1}.</span> {paper.title}
                    <span className="text-gray-500 ml-2">({paper.publication_year})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Chat Messages */}
          <Card className="mb-4 border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="h-96 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>Start a conversation by asking questions about your saved papers!</p>
                    <p className="text-sm mt-2">
                      Try asking about methodology, findings, objectives, or limitations.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="bg-indigo-100 p-2 rounded-full">
                          <Bot className="h-4 w-4 text-indigo-600" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      {message.role === 'user' && (
                        <div className="bg-blue-100 p-2 rounded-full">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 p-2 rounded-full">
                      <Bot className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span className="text-sm text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Ask a question about your saved papers..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResearchChat;
