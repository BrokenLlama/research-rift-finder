
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  created_at: string;
}

interface PaperList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

const ListDetails = () => {
  const { listId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState<PaperList | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && listId) {
      fetchListAndPapers();
    }
  }, [user, listId]);

  const fetchListAndPapers = async () => {
    try {
      // Fetch list details
      const { data: listData, error: listError } = await supabase
        .from('paper_lists')
        .select('*')
        .eq('id', listId)
        .single();

      if (listError) {
        toast({
          title: "Error",
          description: "Failed to fetch list details.",
          variant: "destructive",
        });
        return;
      }

      setList(listData);

      // Fetch papers in this list
      const { data: papersData, error: papersError } = await supabase
        .from('papers')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: false });

      if (papersError) {
        toast({
          title: "Error",
          description: "Failed to fetch papers.",
          variant: "destructive",
        });
      } else {
        setPapers(papersData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const removePaper = async (paperId: string) => {
    try {
      const { error } = await supabase
        .from('papers')
        .delete()
        .eq('id', paperId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove paper.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Paper removed from list.",
        });
        fetchListAndPapers();
      }
    } catch (error) {
      console.error('Error removing paper:', error);
    }
  };

  const startChat = () => {
    if (list) {
      navigate(`/research-chat?listId=${list.id}&listName=${encodeURIComponent(list.name)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">List not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/my-lists')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lists
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{list.name}</h1>
              {list.description && (
                <p className="text-gray-600 mt-2">{list.description}</p>
              )}
            </div>
          </div>
          <Button onClick={startChat}>
            <MessageCircle className="h-4 w-4 mr-2" />
            Start Chat
          </Button>
        </div>

        {papers.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No papers yet</h2>
            <p className="text-gray-500">Search for papers and add them to this list!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <Card key={paper.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{paper.title}</CardTitle>
                      <div className="text-sm text-gray-600 space-y-1">
                        {paper.authors && paper.authors.length > 0 && (
                          <p><strong>Authors:</strong> {paper.authors.join(', ')}</p>
                        )}
                        {paper.publication_year && (
                          <p><strong>Year:</strong> {paper.publication_year}</p>
                        )}
                        {paper.journal && (
                          <p><strong>Journal:</strong> {paper.journal}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePaper(paper.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                {paper.abstract && (
                  <CardContent>
                    <p className="text-sm text-gray-700">{paper.abstract}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListDetails;
