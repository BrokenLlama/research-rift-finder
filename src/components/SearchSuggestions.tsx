import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, Search, BookOpen, Users, Calendar } from 'lucide-react';

interface SearchSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({ onSuggestionClick }) => {
  const popularSearches = [
    'machine learning',
    'artificial intelligence',
    'climate change',
    'cancer treatment',
    'quantum computing',
    'renewable energy',
    'covid-19',
    'blockchain technology'
  ];

  const searchTips = [
    {
      icon: <Search className="h-4 w-4" />,
      title: 'Use specific terms',
      description: 'Instead of "AI", try "artificial intelligence" or "machine learning"'
    },
    {
      icon: <BookOpen className="h-4 w-4" />,
      title: 'Search in quotes',
      description: 'Use "deep learning" to find exact phrases'
    },
    {
      icon: <Users className="h-4 w-4" />,
      title: 'Author search',
      description: 'Try searching for specific researchers or authors'
    },
    {
      icon: <Calendar className="h-4 w-4" />,
      title: 'Use date filters',
      description: 'Filter by publication year for recent research'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Popular Searches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Popular Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((search) => (
              <Badge
                key={search}
                variant="outline"
                className="cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors"
                onClick={() => onSuggestionClick(search)}
              >
                {search}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
            Search Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchTips.map((tip, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="text-gray-500 mt-0.5">
                  {tip.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{tip.title}</h4>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Search Examples */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Search Examples</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Find recent papers on a topic:</p>
              <p className="text-sm text-gray-600">Search: "machine learning" + Use year filter: 2020-2024</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Find papers by a specific author:</p>
              <p className="text-sm text-gray-600">Search: "Yann LeCun" + Use author filter</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Find papers in a specific journal:</p>
              <p className="text-sm text-gray-600">Search: "deep learning" + Use journal filter: "Nature"</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SearchSuggestions; 