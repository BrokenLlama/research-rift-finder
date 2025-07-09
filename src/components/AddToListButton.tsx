
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  onListUpdate?: () => void;
}

const AddToListButton = ({ paper, onListUpdate }: AddToListButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<PaperList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);

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

  const createNewListAndAddPaper = async () => {
    if (!user || !newListName.trim()) return;
    
    setIsCreatingList(true);
    try {
      const { data: newList, error: createError } = await supabase
        .from('paper_lists')
        .insert({
          name: newListName.trim(),
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      await addPaperToList(newList.id, newList.name);
      
      await fetchLists();
      
      setShowCreateDialog(false);
      setNewListName('');
      
      if (onListUpdate) {
        onListUpdate();
      }
      
    } catch (error) {
      console.error('Error creating list and adding paper:', error);
      toast({
        title: "Error",
        description: "Failed to create list and add paper.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingList(false);
    }
  };

  const addPaperToList = async (listId: string, listName: string) => {
    if (!user) return;
    
    try {
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
    }
  };

  const handleAddToList = async (listId: string, listName: string) => {
    setIsLoading(true);
    await addPaperToList(listId, listName);
    setIsLoading(false);
  };

  const handleCreateNewList = () => {
    setShowCreateDialog(true);
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" disabled={isLoading}>
            <Plus className="h-4 w-4 mr-2" />
            Add to List
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleCreateNewList}>
            <Plus className="h-4 w-4 mr-2" />
            ➕ Create New List
          </DropdownMenuItem>
          {lists.length === 0 ? (
            <DropdownMenuItem disabled>
              No existing lists
            </DropdownMenuItem>
          ) : (
            lists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                onClick={() => handleAddToList(list.id, list.name)}
              >
                {list.name}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="e.g., Climate Change, Machine Learning"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    createNewListAndAddPaper();
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={createNewListAndAddPaper}
                disabled={!newListName.trim() || isCreatingList}
                className="flex-1"
              >
                {isCreatingList ? 'Creating...' : 'Create and Add Paper'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                disabled={isCreatingList}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddToListButton;
