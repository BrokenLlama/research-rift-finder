
import React, { useState } from 'react';
import { Search, BookOpen, Users, Calendar, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import AddToListButton from '@/components/AddToListButton';
import { openAlexService, semanticScholarService, PaperResult, SearchFilters } from '@/services/paperSearch';

const Home = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [papers, setPapers] = useState<PaperResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState<'openalex' | 'semantic_scholar'>('openalex');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const { toast } = useToast();

  React.useEffect(() => {
    // Load trending/latest papers on initial load
    loadTrendingPapers();
  }, []);

  const loadTrendingPapers = async () => {
    setIsLoading(true);
    try {
      const response = await openAlexService.search('', undefined, {});
      setPapers(response.results);
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Error loading trending papers:', error);
      toast({
        title: "Error",
        description: "Failed to load trending papers.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchPapers = async (loadMore: boolean = false) => {
    if (!loadMore && !searchTerm.trim()) {
      await loadTrendingPapers();
      return;
    }

    setIsLoading(true);
    try {
      const service = source === 'openalex' ? openAlexService : semanticScholarService;
      const cursor = loadMore ? nextCursor : undefined;
      const offset = source === 'semantic_scholar' && loadMore ? parseInt(nextCursor || '0') : 0;
      
      const response = source === 'openalex' 
        ? await service.search(searchTerm, cursor, filters)
        : await (service as any).search(searchTerm, offset, filters);
      
      if (loadMore) {
        setPapers(prev => [...prev, ...response.results]);
      } else {
        setPapers(response.results);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      
      if (!loadMore && response.results.length === 0) {
        toast({
          title: "No results found",
          description: "Try adjusting your search terms or filters.",
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchPapers();
    }
  };

  const updateYearRangeFilter = (field: 'from' | 'to', value: string) => {
    const numValue = parseInt(value) || undefined;
    setFilters(prev => ({
      ...prev,
      yearRange: {
        ...prev.yearRange,
        [field]: numValue
      }
    }));
  };

  const updateStringFilter = (key: 'author' | 'fieldOfStudy', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
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
            Discover academic papers from multiple sources and get AI-powered insights
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              {/* Main Search */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Enter your research topic (leave empty for trending papers)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="pl-10 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                  
                  {/* Source Selection */}
                  <div className="w-full sm:w-48">
                    <Select value={source} onValueChange={(value: 'openalex' | 'semantic_scholar') => setSource(value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openalex">OpenAlex</SelectItem>
                        <SelectItem value="semantic_scholar">Semantic Scholar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button
                    onClick={() => searchPapers()}
                    disabled={isLoading}
                    className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Searching...
                      </>
                    ) : (
                      'Search Papers'
                    )}
                  </Button>
                </div>

                {/* Filters Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year Range
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="From"
                          value={filters.yearRange?.from || ''}
                          onChange={(e) => updateYearRangeFilter('from', e.target.value)}
                          className="h-9"
                        />
                        <Input
                          type="number"
                          placeholder="To"
                          value={filters.yearRange?.to || ''}
                          onChange={(e) => updateYearRangeFilter('to', e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Author Name
                      </label>
                      <Input
                        placeholder="e.g., John Smith"
                        value={filters.author || ''}
                        onChange={(e) => updateStringFilter('author', e.target.value)}
                        className="h-9"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Field of Study
                      </label>
                      <Input
                        placeholder="e.g., Computer Science"
                        value={filters.fieldOfStudy || ''}
                        onChange={(e) => updateStringFilter('fieldOfStudy', e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {papers.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {searchTerm ? `Search Results (${papers.length} papers found)` : `Latest Papers (${papers.length} papers)`}
              <span className="text-sm font-normal text-gray-500 ml-2">
                from {source === 'openalex' ? 'OpenAlex' : 'Semantic Scholar'}
              </span>
            </h2>
            <div className="space-y-6">
              {papers.map((paper) => (
                <Card key={`${paper.source}-${paper.id}`} className="shadow-md hover:shadow-lg transition-shadow border-0 bg-white/90 backdrop-blur-sm">
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

                        {paper.abstract && (
                          <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                            {paper.abstract}
                          </p>
                        )}
                      </div>
                      
                      <div className="lg:ml-6 flex flex-col gap-2">
                        <AddToListButton 
                          paper={{
                            title: paper.title,
                            authors: paper.authors.map(a => a.display_name),
                            abstract: paper.abstract,
                            publication_year: paper.publication_year,
                            journal: paper.journal,
                            external_id: paper.external_id
                          }} 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  onClick={() => searchPapers(true)}
                  disabled={isLoading}
                  variant="outline"
                  size="lg"
                >
                  {isLoading ? 'Loading...' : 'Load More Papers'}
                </Button>
              </div>
            )}
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
