import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Target, Beaker, TrendingUp, AlertTriangle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface Paper {
  id: string;
  title: string;
  authors: Array<{ display_name: string }>;
  publication_year: number;
  journal?: string;
  abstract?: string;
}

interface Summary {
  objective: string;
  methodology: string;
  findings: string;
  limitations: string;
}

const Summarize = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (location.state?.paper) {
      setPaper(location.state.paper);
      checkIfSaved(location.state.paper.id);
    } else {
      navigate('/');
    }
  }, [location.state, navigate]);

  const checkIfSaved = (paperId: string) => {
    const stored = localStorage.getItem('scholarmate_saved_papers');
    if (stored) {
      const savedPapers = JSON.parse(stored);
      setIsSaved(savedPapers.some((saved: any) => saved.id === paperId));
    }
  };

  const handleSavePaper = () => {
    if (!paper) return;
    
    const stored = localStorage.getItem('scholarmate_saved_papers');
    const existingSaved = stored ? JSON.parse(stored) : [];
    
    if (existingSaved.some((saved: any) => saved.id === paper.id)) {
      toast({
        title: "Already saved",
        description: "This paper is already in your saved list.",
      });
      return;
    }

    const paperToSave = {
      ...paper,
      summary: summary,
      savedAt: new Date().toISOString()
    };

    const updatedSaved = [...existingSaved, paperToSave];
    localStorage.setItem('scholarmate_saved_papers', JSON.stringify(updatedSaved));
    setIsSaved(true);
    
    toast({
      title: "Paper saved",
      description: "Added to your saved papers collection with summary.",
    });
  };

  const summarizeAbstract = async () => {
    if (!paper?.abstract) {
      toast({
        title: "No abstract available",
        description: "This paper doesn't have an abstract to summarize.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const mockSummary = await generateMockSummary(paper.abstract);
      setSummary(mockSummary);
      
      toast({
        title: "Summary generated!",
        description: "AI has successfully analyzed the abstract.",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Summarization failed",
        description: "Unable to generate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSummary = async (abstract: string): Promise<Summary> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const words = abstract.toLowerCase();
    
    return {
      objective: words.includes('study') || words.includes('research') || words.includes('investigate')
        ? "This research aims to investigate and analyze key aspects of the subject matter, contributing to the broader understanding of the field through systematic examination."
        : "The primary objective focuses on advancing knowledge in the research domain through comprehensive analysis and evidence-based findings.",
      
      methodology: words.includes('method') || words.includes('approach') || words.includes('analysis')
        ? "The study employs rigorous research methodologies including systematic data collection, statistical analysis, and evidence-based evaluation techniques."
        : "The research utilizes established scientific methods and analytical frameworks to ensure reliable and valid results.",
      
      findings: words.includes('result') || words.includes('significant') || words.includes('show')
        ? "The research reveals significant insights and measurable outcomes that contribute valuable evidence to the field of study."
        : "Key discoveries and important results provide new perspectives and actionable insights for future research and practical applications.",
      
      limitations: words.includes('limit') || words.includes('future') || words.includes('further')
        ? "The study acknowledges certain constraints and suggests areas for future research to expand upon these findings."
        : "While comprehensive, the research identifies opportunities for extended investigation and broader scope in future studies."
    };
  };

  if (!paper) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Loading paper details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Search
        </Button>

        {/* Paper Details */}
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm mb-8">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex-1">
                  {paper.title}
                </CardTitle>
                <Button
                  onClick={handleSavePaper}
                  disabled={isSaved}
                  variant="outline"
                  className="ml-4"
                >
                  <Heart className={`h-4 w-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  {isSaved ? 'Saved' : 'Save Paper'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-4">
                <span>
                  <strong>Authors:</strong> {paper.authors.map(author => author.display_name).join(', ')}
                </span>
                <span>
                  <strong>Year:</strong> {paper.publication_year}
                </span>
                <span>
                  <strong>Journal:</strong> {paper.journal}
                </span>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Abstract</h3>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <p className="text-gray-700 leading-relaxed">
                    {paper.abstract || 'No abstract available for this paper.'}
                  </p>
                </div>
              </div>

              <div className="text-center">
                <Button
                  onClick={summarizeAbstract}
                  disabled={isLoading || !paper.abstract}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-8 py-3 text-lg transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing Abstract...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Summarize Abstract
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AI Summary */}
          {summary && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                AI-Generated Summary
              </h2>
              
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg font-semibold text-blue-700">
                      <Target className="h-5 w-5 mr-2" />
                      Research Objective
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{summary.objective}</p>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg font-semibold text-green-700">
                      <Beaker className="h-5 w-5 mr-2" />
                      Methodology
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{summary.methodology}</p>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg font-semibold text-purple-700">
                      <TrendingUp className="h-5 w-5 mr-2" />
                      Key Findings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{summary.findings}</p>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0 bg-white/90 backdrop-blur-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center text-lg font-semibold text-orange-700">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      Limitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{summary.limitations}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Summarize;
