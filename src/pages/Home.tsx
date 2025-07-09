
import React, { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, Users, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import EnhancedAddToListButton from '@/components/EnhancedAddToListButton';
import RecentSearches from '@/components/RecentSearches';
import { useSearchHistory } from '@/hooks/useSearchHistory';

// Mock paper search function - replace with actual implementation
const mockSearchPapers = async (query: string, filters: any = {}) => {
  // This is a mock implementation - replace with actual API call
  const mockPapers = [
    {
      id: '1',
      title: 'Machine Learning Applications in Healthcare',
      authors: ['John Doe', 'Jane Smith'],
      abstract: 'This paper explores the various applications of machine learning in healthcare...',
      publication_year: 2023,
      journal: 'Nature Medicine',
      external_id: 'arxiv-123456'
    },
    {
      id: '2',
      title: 'Climate Change and Its Impact on Biodiversity',
      authors: ['Alice Johnson', 'Bob Wilson'],
      abstract: 'An analysis of how climate change affects global biodiversity patterns...',
      publication_year: 2023,
      journal: 'Science',
      external_id: 'doi-789012'
    }
  ];
  
  return mockPapers.filter(paper => 
    paper.title.toLowerCase().includes(query.toLowerCase()) ||
    paper.abstract.toLowerCase().includes(query.toLowerCase())
  );
};

const Home = () => {
  const { user } = useAuth();
  const { saveSearch } = useSearchHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});

  // Load last search from localStorage on component mount
  useEffect(() => {
    const lastSearch = localStorage.getItem('lastSearchQuery');
    const lastResults = localStorage.getItem('lastSearchResults');
    
    if (lastSearch) {
      setSearchQuery(lastSearch);
    }
    
    if (lastResults) {
      try {
        setSearchResults(JSON.parse(lastResults));
      } catch (error) {
        console.error('Error parsing last search results:', error);
      }
    }
  }, []);

  // Save search state to localStorage whenever it changes
  useEffect(() => {
    if (searchQuery) {
      localStorage.setItem('lastSearchQuery', searchQuery);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (searchResults.length > 0) {
      localStorage.setItem('lastSearchResults', JSON.stringify(searchResults));
    }
  }, [searchResults]);

  const handleSearch = async (query?: string, filters?: any) => {
    const searchTerm = query || searchQuery;
    const searchFilters = filters || selectedFilters;
    
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const results = await mockSearchPapers(searchTerm, searchFilters);
      setSearchResults(results);
      
      // Save search to history if user is logged in
      if (user) {
        await saveSearch(searchTerm, searchFilters, results.length);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecentSearchClick = (query: string, filters: any) => {
    setSearchQuery(query);
    setSelectedFilters(filters);
    handleSearch(query, filters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Research Paper Discovery
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Search, organize, and chat with academic papers using AI-powered tools
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Papers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input
                placeholder="Enter keywords, authors, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={() => handleSearch()}
                disabled={isLoading || !searchQuery.trim()}
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Searches Section - Only show if user is logged in */}
        {user && (
          <RecentSearches onSearchSelect={handleRecentSearchClick} />
        )}

        {/* Search Results */}
        {searchResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({searchResults.length} papers found)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {searchResults.map((paper) => (
                  <div key={paper.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-blue-600 hover:text-blue-800">
                        {paper.title}
                      </h3>
                      {user && <EnhancedAddToListButton paper={paper} />}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {paper.authors.join(', ')}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {paper.publication_year}
                      </div>
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-1" />
                        {paper.journal}
                      </div>
                    </div>
                    
                    <p className="text-gray-700 mb-2">
                      {paper.abstract}
                    </p>
                    
                    <Badge variant="secondary">
                      {paper.external_id}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Overview */}
        {searchResults.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Search className="h-5 w-5 mr-2 text-blue-600" />
                  Smart Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Find relevant papers using advanced search algorithms and filters
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
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
