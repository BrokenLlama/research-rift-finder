
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, MessageCircle, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

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
  savedAt: string;
}

const SavedPapers = () => {
  const [savedPapers, setSavedPapers] = useState<SavedPaper[]>([]);
  const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('scholarmate_saved_papers');
    if (stored) {
      setSavedPapers(JSON.parse(stored));
    }
  }, []);

  const handleSelectPaper = (paperId: string, checked: boolean) => {
    if (checked) {
      setSelectedPapers([...selectedPapers, paperId]);
    } else {
      setSelectedPapers(selectedPapers.filter(id => id !== paperId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedPapers(savedPapers.map(paper => paper.id));
    } else {
      setSelectedPapers([]);
    }
  };

  const handleStartChat = () => {
    if (selectedPapers.length === 0) {
      toast({
        title: "No papers selected",
        description: "Please select at least one paper to start chatting.",
        variant: "destructive"
      });
      return;
    }

    const selectedPaperData = savedPapers.filter(paper => 
      selectedPapers.includes(paper.id)
    );
    
    localStorage.setItem('scholarmate_chat_papers', JSON.stringify(selectedPaperData));
    navigate('/research-chat');
  };

  const handleDeletePaper = (paperId: string) => {
    const updatedPapers = savedPapers.filter(paper => paper.id !== paperId);
    setSavedPapers(updatedPapers);
    localStorage.setItem('scholarmate_saved_papers', JSON.stringify(updatedPapers));
    setSelectedPapers(selectedPapers.filter(id => id !== paperId));
    
    toast({
      title: "Paper removed",
      description: "The paper has been removed from your saved list.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Papers</h1>
              <p className="text-gray-600">
                Select papers to start a research chat session
              </p>
            </div>
            
            {savedPapers.length > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedPapers.length === savedPapers.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All
                  </label>
                </div>
                
                <Button
                  onClick={handleStartChat}
                  disabled={selectedPapers.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Start Chat ({selectedPapers.length})
                </Button>
              </div>
            )}
          </div>

          {savedPapers.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-500 mb-2">
                No saved papers yet
              </h3>
              <p className="text-gray-400 mb-6">
                Save papers from your search results to start building your research collection
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
              >
                Search for Papers
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPapers.map((paper) => (
                <Card key={paper.id} className="shadow-md hover:shadow-lg transition-shadow border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        id={`paper-${paper.id}`}
                        checked={selectedPapers.includes(paper.id)}
                        onCheckedChange={(checked) => handleSelectPaper(paper.id, checked as boolean)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                          {paper.title}
                        </h3>
                        
                        <div className="space-y-1 mb-3 text-sm text-gray-600">
                          <p>
                            <strong>Authors:</strong> {paper.authors.map(author => author.display_name).join(', ')}
                          </p>
                          <p>
                            <strong>Year:</strong> {paper.publication_year} • <strong>Journal:</strong> {paper.journal}
                          </p>
                          <p className="text-xs text-gray-500">
                            Saved on {new Date(paper.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {paper.summary && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700 font-medium mb-1">
                              <Check className="h-3 w-3 inline mr-1" />
                              AI Summary Available
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePaper(paper.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPapers;
