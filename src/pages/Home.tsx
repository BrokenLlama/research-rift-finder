import React, { useState, useEffect, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Users, Calendar, ExternalLink, FileText, Clock, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import EnhancedAddToListButton from '@/components/EnhancedAddToListButton';
import RecentSearches from '@/components/RecentSearches';
import SearchFilters from '@/components/SearchFilters';
import SearchSuggestions from '@/components/SearchSuggestions';
import HighlightedText from '@/components/HighlightedText';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { openAlexService, OpenAlexFilters, OpenAlexPaper } from '@/services/openAlexService';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

// --- Inline Recent Searches List for Dropdown ---
// Helper function to render recent searches inline
const InlineRecentSearches = ({ searchHistory, loading, clearSearchHistory, onSearchSelect }: any) => {
  if (loading) {
    return (
      <div className="py-3 px-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-200/60 rounded animate-pulse mb-2" />
        ))}
      </div>
    );
  }
  if (!searchHistory || searchHistory.length === 0) {
    return (
      <div className="py-3 px-4 text-gray-500 text-sm">No recent searches yet. Start searching to see your history here!</div>
    );
  }
  return (
    <div className="py-2 px-2">
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="flex items-center text-sm font-semibold text-gray-700">
          <Clock className="h-4 w-4 mr-2" /> Recent Searches
        </div>
        <button
          onClick={clearSearchHistory}
          className="text-xs text-red-600 hover:text-red-700 flex items-center px-2 py-1 rounded hover:bg-red-50 transition"
        >
          <Trash2 className="h-3 w-3 mr-1" /> Clear
        </button>
      </div>
      <div className="space-y-1">
        {searchHistory.map((search: any) => (
          <div
            key={search.id}
            className="flex items-center justify-between p-2 bg-white/60 hover:bg-blue-50/80 cursor-pointer rounded transition-colors"
            onClick={() => onSearchSelect(search.search_query, search.filters_applied)}
          >
            <div className="flex-1">
              <p className="font-medium text-xs text-gray-900">{search.search_query}</p>
              <p className="text-[11px] text-gray-500">
                {search.results_count} results • {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Home = () => {
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  const {
    saveSearch,
    searchHistory,
    loading: searchHistoryLoading,
    clearSearchHistory
  } = useSearchHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OpenAlexPaper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<OpenAlexFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [perPage] = useState(25);
  const [searchBarFocused, setSearchBarFocused] = useState(false);
  const searchBarRef = useRef<HTMLInputElement>(null);
  const recentSearchesTimeout = useRef<NodeJS.Timeout | null>(null);
  const recentSearchesContainerRef = useRef<HTMLDivElement>(null);

  // Load last search from localStorage on component mount
  useEffect(() => {
    const lastSearch = localStorage.getItem('lastSearchQuery');
    const lastFilters = localStorage.getItem('lastSearchFilters');
    const lastResults = localStorage.getItem('lastSearchResults');
    if (lastSearch) {
      setSearchQuery(lastSearch);
    }
    if (lastFilters) {
      try {
        setFilters(JSON.parse(lastFilters));
      } catch (error) {
        console.error('Error parsing last search filters:', error);
      }
    }
    if (lastResults) {
      try {
        const parsedResults = JSON.parse(lastResults);
        setSearchResults(parsedResults.results || []);
        setTotalResults(parsedResults.total || 0);
        setCurrentPage(parsedResults.page || 1);
      } catch (error) {
        console.error('Error parsing last search results:', error);
      }
    }
  }, []);

  // Save search state to localStorage
  useEffect(() => {
    if (searchQuery) {
      localStorage.setItem('lastSearchQuery', searchQuery);
    }
  }, [searchQuery]);
  useEffect(() => {
    localStorage.setItem('lastSearchFilters', JSON.stringify(filters));
  }, [filters]);
  useEffect(() => {
    if (searchResults.length > 0) {
      localStorage.setItem('lastSearchResults', JSON.stringify({
        results: searchResults,
        total: totalResults,
        page: currentPage
      }));
    }
  }, [searchResults, totalResults, currentPage]);
  const handleSearch = async (query?: string, searchFilters?: OpenAlexFilters, page?: number) => {
    const searchTerm = query || searchQuery;
    const searchPage = page || 1;
    const appliedFilters = searchFilters || filters;
    
    if (!searchTerm.trim()) {
      console.log('Search term is empty, skipping search');
      return;
    }
    
    console.log('Searching for:', searchTerm, 'with filters:', appliedFilters);
    setIsLoading(true);
    
    try {
      const response = await openAlexService.searchPapers(searchTerm, searchPage, perPage, appliedFilters);
      console.log('Search results:', response.results.length, 'papers found');
      
      setSearchResults(response.results);
      setTotalResults(response.meta.count);
      setCurrentPage(searchPage);

      // Save search to history if user is logged in
      if (user) {
        await saveSearch(searchTerm, appliedFilters, response.results.length);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setTotalResults(0);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePageChange = (page: number) => {
    handleSearch(searchQuery, filters, page);
  };
  const handleFiltersChange = (newFilters: OpenAlexFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    if (searchQuery.trim()) {
      handleSearch(searchQuery, newFilters, 1);
    }
  };
  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
    if (searchQuery.trim()) {
      handleSearch(searchQuery, {}, 1);
    }
  };
  const handleRecentSearchClick = (query: string, searchFilters: any) => {
    setSearchQuery(query);
    setFilters(searchFilters);
    setCurrentPage(1);
    handleSearch(query, searchFilters, 1);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setCurrentPage(1);
    handleSearch(suggestion, filters, 1);
  };

  // Extract search terms for highlighting
  const getSearchTerms = (): string[] => {
    if (!searchQuery.trim()) return [];
    
    // Split the search query into individual terms
    const terms = searchQuery
      .split(/\s+/)
      .map(term => term.trim())
      .filter(term => term.length > 0);
    
    // Also include the full query as a phrase
    const allTerms = [...terms];
    if (terms.length > 1) {
      allTerms.unshift(searchQuery.trim());
    }
    
    return allTerms;
  };
  const handlePaperClick = (paper: OpenAlexPaper) => {
    // Navigate to paper details page
    navigate(`/paper/openalex/${encodeURIComponent(paper.id)}`);
  };
  const totalPages = Math.ceil(totalResults / perPage);

  // --- Focus/Blur Handlers for Search Bar ---
  const handleSearchBarFocus = () => {
    if (recentSearchesTimeout.current) {
      clearTimeout(recentSearchesTimeout.current);
    }
    setSearchBarFocused(true);
  };
  const handleSearchBarBlur = () => {
    // Delay hiding to allow click on dropdown
    recentSearchesTimeout.current = setTimeout(() => {
      setSearchBarFocused(false);
    }, 120);
  };
  // --- Handle click inside RecentSearches to prevent blur ---
  const handleRecentSearchesMouseDown = (e: React.MouseEvent) => {
    // Prevent blur when clicking inside the dropdown
    e.preventDefault();
  };

  return <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-bold text-gray-900 mb-4 text-4xl">
            Research Paper Discovery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Search, organize, and chat with academic papers using AI-powered tools
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 relative">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Papers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Input
                  ref={searchBarRef}
                  placeholder="Enter keywords, topics, or research questions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleSearch()}
                  className="w-full"
                  onFocus={handleSearchBarFocus}
                  onBlur={handleSearchBarBlur}
                  aria-label="Search papers"
                  autoComplete="off"
                />
                {/* Recent Searches Dropdown - perfectly aligned to input */}
                {user && searchBarFocused && (
                  <div
                    ref={recentSearchesContainerRef}
                    onMouseDown={handleRecentSearchesMouseDown}
                    className="absolute left-0 top-full z-20 w-full mt-1 rounded-lg shadow-lg border border-gray-200 bg-white/80 backdrop-blur-sm"
                    style={{ minWidth: '0', maxWidth: '100%' }}
                  >
                    <InlineRecentSearches
                      searchHistory={searchHistory}
                      loading={searchHistoryLoading}
                      clearSearchHistory={clearSearchHistory}
                      onSearchSelect={handleRecentSearchClick}
                    />
                  </div>
                )}
              </div>
              <Button onClick={() => handleSearch()} disabled={isLoading || !searchQuery.trim()}>
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <ErrorBoundary>
          <SearchFilters filters={filters} onFiltersChange={handleFiltersChange} onClearFilters={handleClearFilters} />
        </ErrorBoundary>

        {/* Search Results */}
        {searchResults.length > 0 && <>
            <Card>
              <CardHeader>
                <CardTitle>
                  Search Results ({totalResults.toLocaleString()} papers found)
                  {currentPage > 1 && <span className="text-sm font-normal text-gray-600 ml-2">
                      - Page {currentPage} of {totalPages}
                    </span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {searchResults.map(paper => {
                    const searchTerms = getSearchTerms();
                    return (
                      <div key={paper.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => handlePaperClick(paper)}>
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800 leading-tight">
                            <HighlightedText 
                              text={paper.title} 
                              searchTerms={searchTerms}
                            />
                          </h3>
                          {user && <div onClick={e => e.stopPropagation()}>
                              <EnhancedAddToListButton paper={{
                        id: paper.id,
                        title: paper.title,
                        authors: paper.authors.map(a => a.display_name),
                        abstract: paper.abstract,
                        publication_year: paper.publication_year,
                        journal: paper.primary_location?.source?.display_name || paper.host_venue?.display_name || ''
                      }} />
                            </div>}
                        </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>
                            {paper.authors.slice(0, 3).map((a, index) => (
                              <span key={a.id || index}>
                                <HighlightedText 
                                  text={a.display_name} 
                                  searchTerms={searchTerms}
                                />
                                {index < Math.min(3, paper.authors.length) - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {paper.publication_year}
                        </div>
                        {(paper.primary_location?.source?.display_name || paper.host_venue?.display_name) && <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-1" />
                            <HighlightedText 
                              text={paper.primary_location?.source?.display_name || paper.host_venue?.display_name || ''} 
                              searchTerms={searchTerms}
                            />
                          </div>}
                        <div className="flex items-center">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {paper.cited_by_count} citations
                          </span>
                        </div>
                      </div>
                      
                      {paper.abstract && <p className="text-gray-700 mb-3 line-clamp-3">
                          <HighlightedText 
                            text={paper.abstract} 
                            searchTerms={searchTerms}
                            maxLength={300}
                          />
                        </p>}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {paper.concepts?.slice(0, 3).map(concept => <Badge key={concept.display_name} variant="secondary" className="text-xs">
                            {concept.display_name}
                          </Badge>)}
                        {paper.open_access?.is_oa && <Badge variant="outline" className="text-green-600 border-green-600">
                            Open Access
                          </Badge>}
                        {paper.open_access?.is_oa && <Badge variant="outline" className="text-blue-600 border-blue-600">
                            PDF Available
                          </Badge>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {paper.doi && <Badge variant="outline" className="text-xs">
                              DOI: {paper.doi.replace('https://doi.org/', '')}
                            </Badge>}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {paper.best_oa_location?.pdf_url && <Button variant="outline" size="sm" onClick={e => {
                      e.stopPropagation();
                      window.open(paper.best_oa_location?.pdf_url, '_blank');
                    }}>
                              <FileText className="h-4 w-4 mr-1" />
                              View PDF
                            </Button>}
                          <Button variant="ghost" size="sm" onClick={e => {
                      e.stopPropagation();
                      handlePaperClick(paper);
                    }}>
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && <div className="mt-6 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && <PaginationItem>
                        <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} className="cursor-pointer" />
                      </PaginationItem>}
                    
                    {Array.from({
                length: Math.min(5, totalPages)
              }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return <PaginationItem key={pageNum}>
                          <PaginationLink onClick={() => handlePageChange(pageNum)} isActive={currentPage === pageNum} className="cursor-pointer">
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>;
              })}
                    
                    {currentPage < totalPages && <PaginationItem>
                        <PaginationNext onClick={() => handlePageChange(currentPage + 1)} className="cursor-pointer" />
                      </PaginationItem>}
                  </PaginationContent>
                </Pagination>
              </div>}
          </>}

        {/* Search Suggestions - Show when no search has been performed */}
        {searchResults.length === 0 && !isLoading && !searchQuery && (
          <SearchSuggestions onSuggestionClick={handleSuggestionClick} />
        )}

        {/* Features Overview - Show when search has been performed but no results */}
        {searchResults.length === 0 && !isLoading && searchQuery && <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-600" />
                  Smart Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Find relevant papers using OpenAlex database with advanced search and filters
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                  Organize Lists
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Create custom lists to organize papers by topic, project, or research area
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  AI Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Chat with your papers using AI to get insights, summaries, and answers
                </p>
              </CardContent>
            </Card>
          </div>}
      </div>
    </div>;
};
export default Home;