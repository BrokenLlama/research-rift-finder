
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface SearchHistoryEntry {
  id: string;
  search_query: string;
  filters_applied: any;
  results_count: number;
  created_at: string;
}

export const useSearchHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSearchHistory();
    }
  }, [user]);

  const fetchSearchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSearchHistory(data || []);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = async (query: string, filters: any = {}, resultsCount: number = 0) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .insert({
          user_id: user.id,
          search_query: query,
          filters_applied: filters,
          results_count: resultsCount,
        });

      if (error) throw error;
      await fetchSearchHistory(); // Refresh the list
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  const clearSearchHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setSearchHistory([]);
      toast({
        title: "Success",
        description: "Search history cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing search history:', error);
      toast({
        title: "Error",
        description: "Failed to clear search history.",
        variant: "destructive",
      });
    }
  };

  return {
    searchHistory,
    loading,
    saveSearch,
    clearSearchHistory,
    refreshHistory: fetchSearchHistory,
  };
};
