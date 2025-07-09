
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, ExternalLink } from 'lucide-react';
import { searchPapers } from '@/services/paperSearch';
import EnhancedAddToListButton from '@/components/EnhancedAddToListButton';
import RecentSearches from '@/components/RecentSearches';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { useAuth } from '@/hooks/useAuth';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  publication_year?: number;
  journal?: string;
  url?: string;
}

const Home = () => {
  const { user } = useAuth();
  const { saveSearch } = useSearchHistory();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load search state from localStorage on component mount
  useEffect(() => {
    const savedSearch = localStorage.getItem('lastSearch');
    if (savedSearch) {
      try {
        const { query: savedQuery, results: savedResults } = JSON.parse(savedSearch);
        if (savedQuery && savedResults) {
          setQuery(savedQuery);
          setResults(savedResults);
          setHasSearched(true);
        }
      } catch (error) {
        console.error('Error loading saved search:', error);
      }
    }
  }, []);

  // Save search state to localStorage whenever results change
  useEffect(() => {
    if (hasSearched && query && results.length > 0) {
      localStorage.setItem('lastSearch', JSON.stringify({ query, results }));
    }
  }, [query, results, hasSearched]);

  const handleSearch = async (searchQuery: string = query, filters: any = {}) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setHasSearched(true);
    
    // Update query if different from current
    if (searchQuery !== query) {
      setQuery(searchQuery);
    }

    try {
      const searchResults = await searchPapers(searchQuery);
      setResults(searchResults);
      
      // Save search to history if user is logged in
      if (user) {
        await saveSearch(searchQuery, filters, searchResults.length);
      }
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSelect = (selectedQuery: string, filters: any) => {
    handleSearch(selectedQuery, filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Research Paper Search
            </h1>
            <p className="text-xl text-gray-600">
              Discover and organize academic papers with AI-powered insights
            </p>
          </div>

          <div className="mb-8">
            <div className="flex space-x-2">
              <Input
                type="text"
                placeholder="Search for research papers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSearch()}
                disabled={loading || !query.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {/* Recent Searches Section - Only show if user is logged in */}
          {user && (
            <div className="mb-8">
              <RecentSearches onSearchSelect={handleSearchSelect} />
            </div>
          )}

          {/* Search Results */}
          {hasSearched && (
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="p-6">
                        <div className="h-6 bg-gray-200 rounded mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : results.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">
                      Search Results ({results.length})
                    </h2>
                  </div>
                  {results.map((paper) => (
                    <Card key={paper.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg leading-tight mb-2">
                            {paper.title}
                          </CardTitle>
                          <div className="flex space-x-2 ml-4">
                            <EnhancedAddToListButton paper={paper} />
                            {paper.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(paper.url, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex flex-wrap gap-2">
                            {paper.authors.slice(0, 5).map((author, index) => (
                              <Badge key={index} variant="secondary">
                                {author}
                              </Badge>
                            ))}
                            {paper.authors.length > 5 && (
                              <Badge variant="secondary">
                                +{paper.authors.length - 5} more
                              </Badge>
                            )}
                          </div>
                          
                          {paper.abstract && (
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {paper.abstract.length > 300
                                ? `${paper.abstract.slice(0, 300)}...`
                                : paper.abstract}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {paper.publication_year && (
                              <span>Year: {paper.publication_year}</span>
                            )}
                            {paper.journal && (
                              <span>Journal: {paper.journal}</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-500">
                      No papers found for "{query}". Try different keywords or check your spelling.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!hasSearched && !user && (
            <Card>
              <CardContent className="text-center py-12">
                <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">Start Your Research Journey</h3>
                <p className="text-gray-600 mb-4">
                  Search for academic papers and organize them into collections
                </p>
                <p className="text-sm text-gray-500">
                  Sign in to save your searches and create paper lists
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
