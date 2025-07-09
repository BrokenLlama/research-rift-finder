
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, BookmarkPlus, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PaperList {
  id: string;
  name: string;
  description?: string;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  publication_year?: number;
  journal?: string;
}

interface EnhancedAddToListButtonProps {
  paper: Paper;
  onListUpdate?: () => void;
}

const EnhancedAddToListButton: React.FC<EnhancedAddToListButtonProps> = ({ 
  paper, 
  onListUpdate 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lists, setLists] = useState<PaperList[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [addedToLists, setAddedToLists] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchUserLists();
      checkPaperInLists();
    }
  }, [user, paper.id]);

  const fetchUserLists = async () => {
    try {
      const { data, error } = await supabase
        .from('paper_lists')
        .select('id, name, description')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLists(data || []);
    } catch (error) {
      console.error('Error fetching lists:', error);
    }
  };

  const checkPaperInLists = async () => {
    try {
      const { data, error } = await supabase
        .from('papers')
        .select('list_id')
        .eq('title', paper.title)
        .in('list_id', lists.map(list => list.id));

      if (error) throw error;
      
      const listIds = new Set(data?.map(p => p.list_id) || []);
      setAddedToLists(listIds);
    } catch (error) {
      console.error('Error checking paper in lists:', error);
    }
  };

  const addToList = async (listId: string) => {
    if (!user) return;

    setLoading(true);
    try {
      // Check if paper already exists in this list
      const { data: existing } = await supabase
        .from('papers')
        .select('id')
        .eq('list_id', listId)
        .eq('title', paper.title)
        .single();

      if (existing) {
        toast({
          title: "Already Added",
          description: "This paper is already in the selected list.",
        });
        return;
      }

      const { error } = await supabase
        .from('papers')
        .insert({
          list_id: listId,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          publication_year: paper.publication_year,
          journal: paper.journal,
        });

      if (error) throw error;

      setAddedToLists(prev => new Set(prev).add(listId));
      
      toast({
        title: "Success",
        description: "Paper added to list successfully!",
      });

      if (onListUpdate) {
        onListUpdate();
      }
    } catch (error) {
      console.error('Error adding to list:', error);
      toast({
        title: "Error",
        description: "Failed to add paper to list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewList = async () => {
    if (!user || !newListName.trim()) return;

    setLoading(true);
    try {
      const { data: newList, error: listError } = await supabase
        .from('paper_lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        })
        .select()
        .single();

      if (listError) throw listError;

      // Add the paper to the new list
      const { error: paperError } = await supabase
        .from('papers')
        .insert({
          list_id: newList.id,
          title: paper.title,
          authors: paper.authors,
          abstract: paper.abstract,
          publication_year: paper.publication_year,
          journal: paper.journal,
        });

      if (paperError) throw paperError;

      // Update local state
      setLists(prev => [newList, ...prev]);
      setAddedToLists(prev => new Set(prev).add(newList.id));
      
      setNewListName('');
      setNewListDescription('');
      setShowCreateDialog(false);
      
      toast({
        title: "Success",
        description: `Created "${newList.name}" and added paper successfully!`,
      });

      if (onListUpdate) {
        onListUpdate();
      }
    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Error",
        description: "Failed to create list.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className="flex items-center"
          >
            <BookmarkPlus className="h-4 w-4 mr-1" />
            Add to List
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {lists.length > 0 ? (
            <>
              {lists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  onClick={() => addToList(list.id)}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{list.name}</span>
                  {addedToLists.has(list.id) && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <DropdownMenuItem disabled>
              <span className="text-gray-500">No lists yet</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New List
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
            <DialogDescription>
              Create a new list and add this paper to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Enter list name..."
              />
            </div>
            <div>
              <Label htmlFor="listDescription">Description (Optional)</Label>
              <Textarea
                id="listDescription"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="Enter description..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={createNewList}
              disabled={!newListName.trim() || loading}
            >
              Create & Add Paper
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedAddToListButton;
