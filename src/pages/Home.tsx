
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Calendar, Users, FileText, Eye } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AddToListButton from '@/components/AddToListButton';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  publication_year?: number;
  journal?: string;
  citations_count?: number;
  external_id: string;
  source: 'openalex' | 'semantic_scholar';
}

interface SearchFilters {
  query: string;
  year_from: string;
  year_to: string;
  journal: string;
  author: string;
  sort: 'relevance' | 'citation_count' | 'publication_date';
}

const Home = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    year_from: '',
    year_to: '',
    journal: '',
    author: '',
    sort: 'relevance'
  });

  // Mock data for demonstration
  const mockPapers: Paper[] = [
    {
      id: '1',
      title: 'Climate Change Impact on Global Biodiversity: A Comprehensive Analysis',
      authors: ['Dr. Jane Smith', 'Prof. Michael Johnson'],
      abstract: 'This study examines the multifaceted impacts of climate change on global biodiversity patterns...',
      publication_year: 2023,
      journal: 'Nature Climate Change',
      citations_count: 142,
      external_id: 'openalex_123',
      source: 'openalex'
    },
    {
      id: '2',
      title: 'Machine Learning Applications in Medical Diagnosis',
      authors: ['Dr. Sarah Chen', 'Prof. David Wilson'],
      abstract: 'Recent advances in machine learning have revolutionized medical diagnosis capabilities...',
      publication_year: 2024,
      journal: 'Journal of Medical AI',
      citations_count: 89,
      external_id: 'semantic_456',
      source: 'semantic_scholar'
    }
  ];

  const updateStringFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = async () => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      setPapers(mockPapers);
      setIsLoading(false);
    }, 1000);
  };

  const resetFilters = () => {
    setFilters({
      query: '',
      year_from: '',
      year_to: '',
      journal: '',
      author: '',
      sort: 'relevance'
    });
  };

  const handleViewDetails = (paper: Paper) => {
    navigate(`/paper/${paper.source}/${paper.external_id}`);
  };

  useEffect(() => {
    // Load initial papers on component mount
    handleSearch();
  }, []);

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
              Discover, organize, and chat with academic papers from multiple sources
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
                  className="flex-1"
                />
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button onClick={handleSearch} disabled={isLoading}>
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
                    <label className="block text-sm font-medium mb-1">Journal</label>
                    <Input
                      placeholder="Journal name"
                      value={filters.journal}
                      onChange={(e) => updateStringFilter('journal', e.target.value)}
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort By</label>
                    <Select value={filters.sort} onValueChange={(value: 'relevance' | 'citation_count' | 'publication_date') => setFilters(prev => ({ ...prev, sort: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="citation_count">Citation Count</SelectItem>
                        <SelectItem value="publication_date">Publication Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" onClick={resetFilters} className="w-full">
                      Reset Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

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
                    Search Results ({papers.length})
                  </h2>
                </div>
                {papers.map((paper) => (
                  <Card key={paper.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {paper.title}
                          </h3>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              <span>{paper.authors.join(', ')}</span>
                            </div>
                            
                            {paper.publication_year && (
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{paper.publication_year}</span>
                              </div>
                            )}
                            
                            {paper.journal && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                <span>{paper.journal}</span>
                              </div>
                            )}
                          </div>

                          {paper.abstract && (
                            <p className="text-gray-700 text-sm line-clamp-3 mb-4">
                              {paper.abstract}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">
                                {paper.source === 'openalex' ? 'OpenAlex' : 'Semantic Scholar'}
                              </Badge>
                              {paper.citations_count && (
                                <Badge variant="outline">
                                  {paper.citations_count} citations
                                </Badge>
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
                                  authors: paper.authors,
                                  abstract: paper.abstract,
                                  publication_year: paper.publication_year,
                                  journal: paper.journal,
                                  external_id: paper.external_id
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
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
