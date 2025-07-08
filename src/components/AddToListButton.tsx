
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaperList {
  id: string;
  name: string;
}

interface Paper {
  title: string;
  authors: string[];
  abstract?: string;
  publication_year?: number;
  journal?: string;
  external_id?: string;
}

interface AddToListButtonProps {
  paper: Paper;
}

const AddToListButton = ({ paper }: AddToListButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<PaperList[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLists();
    }
  }, [user]);

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('paper_lists')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching lists:', error);
      } else {
        setLists(data || []);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const addToList = async (listId: string, listName: string) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Check if paper already exists in this list
      const { data: existingPaper, error: checkError } = await supabase
        .from('papers')
        .select('id')
        .eq('list_id', listId)
        .eq('title', paper.title)
        .eq('authors', JSON.stringify(paper.authors))
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPaper) {
        toast({
          title: "Already added",
          description: `This paper is already in "${listName}".`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('papers')
        .insert({
          list_id: listId,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract || null,
          publication_year: paper.publication_year || null,
          journal: paper.journal || null,
          external_id: paper.external_id || null,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add paper to list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: `Paper added to "${listName}".`,
        });
      }
    } catch (error) {
      console.error('Error adding paper to list:', error);
      toast({
        title: "Error",
        description: "Failed to add paper to list.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" disabled={isLoading}>
          <Plus className="h-4 w-4 mr-2" />
          Add to List
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {lists.length === 0 ? (
          <DropdownMenuItem disabled>
            No lists available. Create a list first.
          </DropdownMenuItem>
        ) : (
          lists.map((list) => (
            <DropdownMenuItem
              key={list.id}
              onClick={() => addToList(list.id, list.name)}
            >
              {list.name}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AddToListButton;
