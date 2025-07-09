
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import SearchFilters from '@/components/SearchFilters';
import { searchPapers } from '@/services/paperSearch';
import EnhancedAddToListButton from '@/components/EnhancedAddToListButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, Users, Book, FileText, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RecentSearches from '@/components/RecentSearches';
import AdvancedFiltersPanel from '@/components/AdvancedFiltersPanel';
import PaperSummaryModal from '@/components/PaperSummaryModal';

export interface SearchFilters {
  startYear?: number;
  endYear?: number;
  hasFulltext?: boolean;
  openAccess?: boolean;
  fieldOfStudy?: string;
  author?: string;
  journal?: string;
  [key: string]: any;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  open_access: boolean;
  pdf_url?: string;
  doi?: string;
  cited_by_count?: number;
  external_id?: string;
}

interface OpenAlexSearchResponse {
  results: Paper[];
  meta: {
    count: number;
    total: number;
  };
}

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);

  const perPage = 20;

  useEffect(() => {
    const savedFilters = localStorage.getItem('searchFilters');
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('searchFilters', JSON.stringify(filters));
  }, [filters]);

  const saveSearchToHistory = async (searchQuery: string, resultsCount: number) => {
    if (!user) return;

    try {
      await supabase
        .from('search_history')
        .insert({
          search_query: searchQuery,
          user_id: user.id,
          results_count: resultsCount,
          filters_applied: filters as any,
        });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const handleSearch = async (searchQuery: string = query, page: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const searchFilters = {
        page,
        perPage,
        filters
      };
      
      const response = await searchPapers(searchQuery, searchFilters);
      
      setPapers(response.results || []);
      setTotalResults(response.meta?.total || 0);
      setCurrentPage(page);

      if (page === 1) {
        await saveSearchToHistory(searchQuery, response.meta?.total || 0);
      }
      
      setSearchParams({ q: searchQuery });
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to search papers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (query) {
      handleSearch(query, 1);
    }
  };

  const clearFilters = () => {
    setFilters({});
    localStorage.removeItem('searchFilters');
    if (query) {
      handleSearch(query, 1);
    }
  };

  const handlePageChange = (page: number) => {
    handleSearch(query, page);
  };

  const handleSummarizePaper = (paper: Paper) => {
    setSelectedPaper(paper);
    setShowSummaryModal(true);
  };

  const totalPages = Math.ceil(totalResults / perPage);
  const hasActiveFilters = Object.keys(filters).some(key => filters[key] !== undefined && filters[key] !== '');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              ScholarMate
            </h1>
            <p className="text-xl text-gray-600">
              Your AI-powered research companion
            </p>
          </div>

          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search academic papers..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={() => handleSearch()}
                disabled={isLoading || !query.trim()}
                className="whitespace-nowrap"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Advanced Filters
              </Button>
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Active filters:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="flex items-center gap-1"
                >
                  <X className="h-3 w-3" />
                  Clear all
                </Button>
              </div>
            )}

            {showAdvancedFilters && (
              <AdvancedFiltersPanel
                filters={filters}
                onFiltersChange={handleFilterChange}
                onClose={() => setShowAdvancedFilters(false)}
              />
            )}
          </div>

          {!query && <RecentSearches onSearchSelect={setQuery} />}

          {papers.length > 0 && (
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {papers.length} of {totalResults.toLocaleString()} results
              </p>
            </div>
          )}

          <div className="space-y-6">
            {papers.map((paper) => (
              <Card key={paper.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg leading-tight">
                      <a
                        href={`/paper/${paper.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {paper.title}
                      </a>
                    </CardTitle>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSummarizePaper(paper)}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Summarize
                      </Button>
                      {user && (
                        <EnhancedAddToListButton 
                          paper={{
                            id: paper.id,
                            title: paper.title,
                            authors: paper.authors,
                            abstract: paper.abstract,
                            publication_year: paper.publication_year,
                            journal: paper.journal,
                            external_id: paper.external_id || paper.id
                          }} 
                        />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {paper.authors.slice(0, 3).join(', ')}
                        {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                      </div>
                      {paper.publication_year && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {paper.publication_year}
                        </div>
                      )}
                      {paper.journal && (
                        <div className="flex items-center gap-1">
                          <Book className="h-4 w-4" />
                          {paper.journal}
                        </div>
                      )}
                    </div>
                    
                    {paper.abstract && (
                      <p className="text-gray-700 text-sm line-clamp-3">
                        {paper.abstract}
                      </p>
                    )}
                    
                    <div className="flex gap-2">
                      {paper.open_access && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Open Access
                        </Badge>
                      )}
                      {paper.cited_by_count && (
                        <Badge variant="outline">
                          Cited {paper.cited_by_count} times
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {papers.length > 0 && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <span className="flex items-center px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedPaper && (
        <PaperSummaryModal
          paper={selectedPaper}
          isOpen={showSummaryModal}
          onClose={() => {
            setShowSummaryModal(false);
            setSelectedPaper(null);
          }}
        />
      )}
    </div>
  );
};

export default Home;
