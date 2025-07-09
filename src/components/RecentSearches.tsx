
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Trash2 } from 'lucide-react';
import { useSearchHistory } from '@/hooks/useSearchHistory';
import { formatDistanceToNow } from 'date-fns';

interface RecentSearchesProps {
  onSearchSelect: (query: string, filters: any) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onSearchSelect }) => {
  const { searchHistory, loading, clearSearchHistory } = useSearchHistory();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (searchHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Searches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">No recent searches yet. Start searching to see your history here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Recent Searches
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearchHistory}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {searchHistory.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onSearchSelect(search.search_query, search.filters_applied)}
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{search.search_query}</p>
                <p className="text-xs text-gray-500">
                  {search.results_count} results • {formatDistanceToNow(new Date(search.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentSearches;
