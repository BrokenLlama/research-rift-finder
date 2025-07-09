
import React, { useState, useEffect } from 'react';
import { Search, FileText, BookOpen, MessageSquare } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import RecentSearches from '@/components/RecentSearches';
import EnhancedAddToListButton from '@/components/EnhancedAddToListButton';
import PaperSummaryModal from '@/components/PaperSummaryModal';
import AdvancedFiltersPanel from '@/components/AdvancedFiltersPanel';
import { openAlexService, OpenAlexPaper } from '@/services/openAlexService';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface SearchFilters {
  dateRange: {
    from: string;
    to: string;
  };
  hasPdf: boolean | null;
  authorName: string;
  journal: string;
  fieldOfStudy: string[];
}

const Home = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenAlexPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPaper, setSelectedPaper] = useState<OpenAlexPaper | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    dateRange: { from: '', to: '' },
    hasPdf: null,
    authorName: '',
    journal: '',
    fieldOfStudy: [],
  });

  const resultsPerPage = 10;

  // Load saved search state from localStorage
  useEffect(() => {
    const savedQuery = localStorage.getItem('scholarmate_search_query');
    const savedFilters = localStorage.getItem('scholarmate_search_filters');
    
    if (savedQuery) {
      setSearchQuery(savedQuery);
    }
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (error) {
        console.error('Error parsing saved filters:', error);
      }
    }
    
    // Auto-search if there's a saved query
    if (savedQuery) {
      handleSearch(savedQuery, savedFilters ? JSON.parse(savedFilters) : filters);
    }
  }, []);

  // Save search state to localStorage
  useEffect(() => {
    if (searchQuery) {
      localStorage.setItem('scholarmate_search_query', searchQuery);
    }
    localStorage.setItem('scholarmate_search_filters', JSON.stringify(filters));
  }, [searchQuery, filters]);

  const saveSearchHistory = async (query: string, resultsCount: number) => {
    if (!user) return;

    try {
      await supabase.from('search_history').insert({
        user_id: user.id,
        search_query: query,
        results_count: resultsCount,
        filters_applied: filters,
      });
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const handleSearch = async (query = searchQuery, searchFilters = filters, page = 1) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setCurrentPage(page);
    
    try {
      const result = await openAlexService.searchPapers(query, {
        page,
        perPage: resultsPerPage,
        filters: searchFilters,
      });

      setSearchResults(result.papers);
      setTotalResults(result.total);
      
      if (user && page === 1) {
        await saveSearchHistory(query, result.total);
      }
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

  const handlePageChange = (page: number) => {
    handleSearch(searchQuery, filters, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePaperClick = (paper: OpenAlexPaper) => {
    const encodedPaperId = encodeURIComponent(paper.id);
    navigate(`/paper/${encodedPaperId}/openalex`);
  };

  const handleSummarizePaper = (paper: OpenAlexPaper) => {
    setSelectedPaper(paper);
    setIsSummaryModalOpen(true);
  };

  const handleFiltersChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (searchQuery.trim()) {
      handleSearch(searchQuery, newFilters, 1);
    }
  };

  const formatAuthors = (authors: Array<{ display_name: string }>) => {
    if (authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.map(a => a.display_name).join(', ');
    return `${authors.slice(0, 3).map(a => a.display_name).join(', ')} +${authors.length - 3} more`;
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Discover Academic Research
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Search millions of research papers and organize your findings
          </p>
        </div>

        {/* Search Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search for research papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="text-lg py-3"
              />
            </div>
            <Button 
              onClick={() => handleSearch()}
              size="lg"
              disabled={isLoading}
            >
              <Search className="h-5 w-5 mr-2" />
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <div className="flex justify-center">
            <AdvancedFiltersPanel
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isOpen={isFiltersOpen}
              onOpenChange={setIsFiltersOpen}
            />
          </div>
        </div>

        {/* Recent Searches */}
        {user && !searchResults.length && !isLoading && (
          <div className="max-w-4xl mx-auto mb-8">
            <RecentSearches onSearchSelect={setSearchQuery} />
          </div>
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">
                Search Results ({totalResults.toLocaleString()} papers found)
              </h2>
            </div>

            <div className="grid gap-6 mb-8">
              {searchResults.map((paper) => (
                <Card key={paper.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <CardTitle 
                          className="text-lg leading-tight mb-2 hover:text-blue-600 cursor-pointer"
                          onClick={() => handlePaperClick(paper)}
                        >
                          {paper.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            {formatAuthors(paper.authors)}
                          </span>
                          <span>{paper.publication_year}</span>
                          {(paper.primary_location?.source?.display_name || paper.host_venue?.display_name) && (
                            <span className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1" />
                              {paper.primary_location?.source?.display_name || paper.host_venue?.display_name}
                            </span>
                          )}
                          <span>{paper.cited_by_count} citations</span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {paper.open_access?.is_oa && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Open Access
                            </Badge>
                          )}
                          {paper.best_oa_location?.pdf_url && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              PDF Available
                            </Badge>
                          )}
                          <Badge variant="secondary">OpenAlex</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {paper.abstract && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                        {paper.abstract.length > 300 
                          ? `${paper.abstract.substring(0, 300)}...` 
                          : paper.abstract
                        }
                      </p>
                    )}
                    <div className="flex gap-2 flex-wrap">
                      <EnhancedAddToListButton 
                        paper={{
                          id: crypto.randomUUID(),
                          title: paper.title,
                          authors: paper.authors.map(a => a.display_name),
                          abstract: paper.abstract,
                          publication_year: paper.publication_year,
                          journal: paper.primary_location?.source?.display_name || paper.host_venue?.display_name,
                          external_id: paper.id
                        }} 
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSummarizePaper(paper)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Summarize
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                        className={currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {searchQuery && !isLoading && searchResults.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No papers found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters</p>
          </div>
        )}
      </div>

      {/* Paper Summary Modal */}
      <PaperSummaryModal
        paper={selectedPaper ? {
          id: selectedPaper.id,
          title: selectedPaper.title,
          authors: selectedPaper.authors.map(a => a.display_name),
          abstract: selectedPaper.abstract,
          publication_year: selectedPaper.publication_year,
          journal: selectedPaper.primary_location?.source?.display_name || selectedPaper.host_venue?.display_name,
          external_id: selectedPaper.id
        } : null}
        isOpen={isSummaryModalOpen}
        onClose={() => {
          setIsSummaryModalOpen(false);
          setSelectedPaper(null);
        }}
      />
    </div>
  );
};

export default Home;
