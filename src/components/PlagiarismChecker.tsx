
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlagiarismResult {
  similarity: number;
  sources: Array<{
    url: string;
    title: string;
    similarity: number;
  }>;
}

const PlagiarismChecker: React.FC = () => {
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<PlagiarismResult | null>(null);

  const checkPlagiarism = async () => {
    if (!text.trim()) {
      toast({
        title: "No Text",
        description: "Please enter some text to check for plagiarism.",
        variant: "destructive",
      });
      return;
    }

    if (text.length < 50) {
      toast({
        title: "Text Too Short",
        description: "Please enter at least 50 characters for accurate plagiarism detection.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    
    try {
      // Simulate plagiarism check with mock data
      // In a real implementation, you would integrate with a plagiarism detection API
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const mockResult: PlagiarismResult = {
        similarity: Math.floor(Math.random() * 30) + 5, // 5-35% similarity
        sources: [
          {
            url: 'https://example-journal.com/article/123',
            title: 'Similar Research Paper on Climate Change',
            similarity: 15,
          },
          {
            url: 'https://scholar.google.com/citations?view_op=view_citation&hl=en&user=abc123',
            title: 'Academic Paper on Machine Learning',
            similarity: 8,
          },
          {
            url: 'https://arxiv.org/abs/2021.12345',
            title: 'ArXiv Preprint on Neural Networks',
            similarity: 5,
          },
        ],
      };

      setResult(mockResult);

      if (mockResult.similarity > 25) {
        toast({
          title: "High Similarity Detected",
          description: `${mockResult.similarity}% similarity found. Please review the sources.`,
          variant: "destructive",
        });
      } else if (mockResult.similarity > 15) {
        toast({
          title: "Moderate Similarity",
          description: `${mockResult.similarity}% similarity found. Consider reviewing.`,
        });
      } else {
        toast({
          title: "Low Similarity",
          description: `${mockResult.similarity}% similarity - looks good!`,
        });
      }

    } catch (error) {
      console.error('Error checking plagiarism:', error);
      toast({
        title: "Error",
        description: "Failed to check for plagiarism. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getSimilarityColor = (similarity: number) => {
    if (similarity > 25) return 'text-red-600';
    if (similarity > 15) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getSimilarityIcon = (similarity: number) => {
    if (similarity > 25) return <AlertTriangle className="h-5 w-5 text-red-600" />;
    if (similarity > 15) return <Shield className="h-5 w-5 text-yellow-600" />;
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="h-5 w-5 mr-2" />
          Plagiarism Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="Paste your text here to check for plagiarism..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-32"
          />
          <p className="text-xs text-gray-500 mt-1">
            {text.length} characters (minimum 50 required)
          </p>
        </div>

        <Button
          onClick={checkPlagiarism}
          disabled={isChecking || text.length < 50}
          className="w-full"
        >
          {isChecking ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Checking for Plagiarism...
            </>
          ) : (
            'Check for Plagiarism'
          )}
        </Button>

        {result && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getSimilarityIcon(result.similarity)}
                    <span className={`ml-2 font-semibold ${getSimilarityColor(result.similarity)}`}>
                      {result.similarity}% Similarity Detected
                    </span>
                  </div>
                </div>

                <Progress 
                  value={result.similarity} 
                  className="w-full" 
                />

                {result.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Similar Sources Found:</h4>
                    <div className="space-y-2">
                      {result.sources.map((source, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{source.title}</p>
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-xs break-all"
                              >
                                {source.url}
                              </a>
                            </div>
                            <span className={`text-sm font-medium ${getSimilarityColor(source.similarity)}`}>
                              {source.similarity}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                  <strong>Note:</strong> This is a demo plagiarism checker. For production use, 
                  integrate with services like Copyleaks, PlagiarismCheck.org, or similar APIs 
                  for accurate plagiarism detection.
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default PlagiarismChecker;
