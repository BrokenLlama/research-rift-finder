
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AuthForm from '@/components/AuthForm';
import Navigation from '@/components/Navigation';
import AddToListButton from '@/components/AddToListButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, Users, Calendar, Building } from 'lucide-react';

// Mock data for demonstration
const mockPapers = [
  {
    title: "Climate Change Impacts on Global Agriculture: A Comprehensive Review",
    authors: ["Smith, J.", "Johnson, A.", "Brown, K."],
    abstract: "This comprehensive review examines the multifaceted impacts of climate change on global agricultural systems. We analyze temperature variations, precipitation patterns, and extreme weather events affecting crop yields across different regions. The study synthesizes data from over 200 research papers published between 2010-2023, revealing significant challenges for food security. Key findings include a 15% average decline in wheat yields in drought-prone areas and adaptation strategies employed by farmers worldwide.",
    publication_year: 2023,
    journal: "Environmental Science & Policy",
    external_id: "10.1016/j.envsci.2023.01.001"
  },
  {
    title: "Machine Learning Applications in Medical Diagnosis: Current State and Future Prospects",
    authors: ["Chen, L.", "Rodriguez, M.", "Patel, S."],
    abstract: "Machine learning has revolutionized medical diagnosis across multiple specialties. This paper reviews current applications including image recognition in radiology, pattern recognition in pathology, and predictive modeling for patient outcomes. We examine 150 peer-reviewed studies and present case studies demonstrating accuracy improvements of 20-30% over traditional diagnostic methods. The review also discusses ethical considerations, regulatory challenges, and future research directions in AI-assisted healthcare.",
    publication_year: 2023,
    journal: "Journal of Medical Internet Research",
    external_id: "10.2196/medical.2023.45678"
  },
  {
    title: "Behavioral Psychology in Digital Age: How Technology Shapes Human Interaction",
    authors: ["Wilson, R.", "Davis, T.", "Lee, H."],
    abstract: "The digital revolution has fundamentally altered human behavioral patterns and social interactions. This study investigates psychological changes associated with increased screen time, social media usage, and virtual communication. Through longitudinal studies involving 5,000 participants over 3 years, we document shifts in attention spans, empathy levels, and relationship formation patterns. The research highlights both positive and negative psychological impacts of digital technology adoption.",
    publication_year: 2022,
    journal: "Psychological Science",
    external_id: "10.1177/psyc.2022.12345"
  }
];

const Index = () => {
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(mockPapers);
  const [isSearching, setIsSearching] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    // Simulate API call delay
    setTimeout(() => {
      // For demo purposes, filter mock data based on search query
      const filtered = mockPapers.filter(paper =>
        paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.abstract.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paper.authors.some(author => author.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setSearchResults(filtered);
      setIsSearching(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to ScholarMate
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover, organize, and chat with academic papers using AI
          </p>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search for academic papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-lg py-3"
              />
              <Button type="submit" size="lg" disabled={isSearching}>
                <Search className="h-5 w-5 mr-2" />
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </form>
        </div>

        {/* Search Results */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Papers'}
          </h2>
          
          {isSearching ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching academic databases...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No papers found</h3>
              <p className="text-gray-500">Try adjusting your search terms</p>
            </div>
          ) : (
            <div className="space-y-6">
              {searchResults.map((paper, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{paper.title}</CardTitle>
                        <CardDescription className="flex items-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {paper.authors.join(', ')}
                          </span>
                          {paper.publication_year && (
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {paper.publication_year}
                            </span>
                          )}
                          {paper.journal && (
                            <span className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {paper.journal}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <AddToListButton paper={paper} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{paper.abstract}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
