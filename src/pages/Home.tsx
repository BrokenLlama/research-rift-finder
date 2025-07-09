
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, Users, FileText, Eye, ExternalLink } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddToListButton from '@/components/AddToListButton';
import { semanticScholarService, PaperResult } from '@/services/paperSearch';

interface SearchFilters {
  query: string;
  year_from: string;
  year_to: string;
  author: string;
  sort: 'relevance' | 'citation_count' | 'publication_date';
}

const Home = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PaperResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [paginationOffset, setPaginationOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    year_from: '',
    year_to: '',
    author: '',
    sort: 'relevance'
  });

  const updateStringFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async (resetResults: boolean = true) => {
    if (!filters.query.trim()) {
      setError('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const searchOffset = resetResults ? 0 : paginationOffset;
    
    try {
      const searchFilters = {
        ...(filters.year_from && filters.year_to && {
          yearRange: {
            from: parseInt(filters.year_from),
            to: parseInt(filters.year_to)
          }
        }),
        ...(filters.author && { author: filters.author })
      };

      const response = await semanticScholarService.search(
        filters.query,
        searchOffset,
        20,
        searchFilters
      );

      if (resetResults) {
        setPapers(response.results);
        setPaginationOffset(20);
      } else {
        setPapers(prev => [...prev, ...response.results]);
        setPaginationOffset(prev => prev + 20);
      }
      
      setHasMore(response.hasMore);
      setTotalResults(response.total);
      
      if (response.results.length === 0 && resetResults) {
        setError('No papers found for your search.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Something went wrong. Please try again later.');
      if (resetResults) {
        setPapers([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      await handleSearch(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      year_from: '',
      year_to: '',
      author: '',
      sort: 'relevance'
    });
    setPapers([]);
    setPaginationOffset(0);
    setHasMore(false);
    setTotalResults(0);
    setError(null);
  };

  const handleViewDetails = (paper: PaperResult) => {
    navigate(`/paper/semantic_scholar/${paper.id}`);
  };

  const formatAuthors = (authors: Array<{ name: string }>) => {
    if (authors.length <= 3) {
      return authors.map(a => a.name).join(', ');
    }
    return authors.slice(0, 3).map(a => a.name).join(', ') + ' et al.';
  };

  const truncateAbstract = (abstract: string | undefined, limit: number = 250) => {
    if (!abstract) return '';
    return abstract.length > limit ? abstract.substring(0, limit) + '...' : abstract;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ScholarMate Research Hub
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover, organize, and chat with academic papers from Semantic Scholar
            </p>
          </div>

          {/* Search Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="h-5 w-5 mr-2" />
                Search Academic Papers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter keywords, topics, or paper titles..."
                  value={filters.query}
                  onChange={(e) => updateStringFilter('query', e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="flex-1"
                />
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button onClick={() => handleSearch()} disabled={isLoading}>
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">Year From</label>
                    <Input
                      type="number"
                      placeholder="e.g., 2020"
                      value={filters.year_from}
                      onChange={(e) => updateStringFilter('year_from', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Year To</label>
                    <Input
                      type="number"
                      placeholder="e.g., 2024"
                      value={filters.year_to}
                      onChange={(e) => updateStringFilter('year_to', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Author</label>
                    <Input
                      placeholder="Author name"
                      value={filters.author}
                      onChange={(e) => updateStringFilter('author', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-1">
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      Clear Results
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error Message */}
          {error && (
            <Card className="mb-8 border-red-200">
              <CardContent className="p-4">
                <p className="text-red-600 text-center">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Searching for papers...</p>
              </div>
            ) : papers.length > 0 ? (
              <>
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    Search Results ({totalResults.toLocaleString()})
                  </h2>
                </div>
                {papers.map((paper, index) => (
                  <Card key={`${paper.id}-${index}`} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-start gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 flex-1">
                              {paper.url ? (
                                <a 
                                  href={paper.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-blue-600 transition-colors"
                                >
                                  {paper.title}
                                </a>
                              ) : (
                                paper.title
                              )}
                            </h3>
                            {paper.url && (
                              <ExternalLink className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {paper.authors.length > 0 && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1 flex-shrink-0" />
                                <span>{formatAuthors(paper.authors)}</span>
                              </div>
                            )}
                            
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{paper.year}</span>
                            </div>
                            
                            {paper.journal && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                <span>{paper.journal}</span>
                              </div>
                            )}
                          </div>

                          {paper.abstract && (
                            <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                              {truncateAbstract(paper.abstract)}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">Semantic Scholar</Badge>
                              {paper.externalIds?.DOI && (
                                <Badge variant="outline">DOI</Badge>
                              )}
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(paper)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                              <AddToListButton 
                                paper={{
                                  title: paper.title,
                                  authors: paper.authors.map(a => a.name),
                                  abstract: paper.abstract,
                                  publication_year: paper.year,
                                  journal: paper.journal,
                                  external_id: paper.id
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center py-6">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                      variant="outline"
                      size="lg"
                    >
                      {isLoadingMore ? 'Loading...' : 'Load More Papers'}
                    </Button>
                  </div>
                )}
              </>
            ) : !isLoading && filters.query.trim() && (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No papers found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search terms or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
