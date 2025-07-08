import React, { useState } from 'react';
import { Search, BookOpen, Users, Calendar, FileText, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
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

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savedPapers, setSavedPapers] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  React.useEffect(() => {
    const stored = localStorage.getItem('scholarmate_saved_papers');
    if (stored) {
      const savedPapersData = JSON.parse(stored);
      setSavedPapers(savedPapersData.map((paper: any) => paper.id));
    }
  }, []);

  const searchPapers = async () => {
    if (!searchTerm.trim()) {
      toast({
        title: "Search term required",
        description: "Please enter a research topic to search for papers.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.openalex.org/works?search=${encodeURIComponent(searchTerm)}&per_page=10&select=id,title,authorships,publication_year,primary_location,abstract_inverted_index`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }

      const data = await response.json();
      
      const formattedPapers = data.results.map((paper: any) => ({
        id: paper.id,
        title: paper.title || 'No title available',
        authors: paper.authorships?.map((auth: any) => ({ 
          display_name: auth.author?.display_name || 'Unknown Author' 
        })) || [],
        publication_year: paper.publication_year || 'Unknown',
        journal: paper.primary_location?.source?.display_name || 'Unknown Journal',
        abstract: paper.abstract_inverted_index ? reconstructAbstract(paper.abstract_inverted_index) : null
      }));

      setPapers(formattedPapers);
      
      if (formattedPapers.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms or using different keywords.",
        });
      }
    } catch (error) {
      console.error('Error searching papers:', error);
      toast({
        title: "Search failed",
        description: "Unable to search for papers. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const reconstructAbstract = (invertedIndex: any): string => {
    if (!invertedIndex) return '';
    
    const words: string[] = [];
    Object.entries(invertedIndex).forEach(([word, positions]: [string, any]) => {
      if (Array.isArray(positions)) {
        positions.forEach((pos: number) => {
          words[pos] = word;
        });
      }
    });
    
    return words.filter(Boolean).join(' ');
  };

  const handleSavePaper = (paper: Paper) => {
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
      savedAt: new Date().toISOString()
    };

    const updatedSaved = [...existingSaved, paperToSave];
    localStorage.setItem('scholarmate_saved_papers', JSON.stringify(updatedSaved));
    setSavedPapers([...savedPapers, paper.id]);
    
    toast({
      title: "Paper saved",
      description: "Added to your saved papers collection.",
    });
  };

  const handleSummarizePaper = (paper: Paper) => {
    navigate('/summarize', { state: { paper } });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPapers();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-blue-600 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              ScholarMate
            </h1>
          </div>
          <p className="text-xl text-blue-600 font-medium">Your AI Research Buddy</p>
          <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
            Discover academic papers and get AI-powered summaries to accelerate your research
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter your research topic (e.g., machine learning, climate change, neuroscience)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={searchPapers}
                  disabled={isLoading}
                  className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    'Find Papers'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {papers.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Search Results ({papers.length} papers found)
            </h2>
            <div className="space-y-6">
              {papers.map((paper) => (
                <Card key={paper.id} className="shadow-md hover:shadow-lg transition-shadow border-0 bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                          {paper.title}
                        </h3>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">
                              {paper.authors.length > 0 
                                ? paper.authors.slice(0, 3).map(author => author.display_name).join(', ')
                                + (paper.authors.length > 3 ? ` and ${paper.authors.length - 3} more` : '')
                                : 'Authors not available'
                              }
                            </span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">{paper.publication_year}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="text-sm">{paper.journal}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="lg:ml-6 flex flex-col gap-2">
                        <Button
                          onClick={() => handleSavePaper(paper)}
                          disabled={savedPapers.includes(paper.id)}
                          variant="outline"
                          className="w-full lg:w-auto"
                        >
                          <Heart className={`h-4 w-4 mr-2 ${savedPapers.includes(paper.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          {savedPapers.includes(paper.id) ? 'Saved' : 'Save Paper'}
                        </Button>
                        
                        <Button
                          onClick={() => handleSummarizePaper(paper)}
                          className="w-full lg:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-2 transition-colors"
                          disabled={!paper.abstract}
                        >
                          {paper.abstract ? 'Summarize Paper' : 'No Abstract Available'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {papers.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              Ready to explore academic research?
            </h3>
            <p className="text-gray-400">
              Enter a research topic above to discover relevant academic papers
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
