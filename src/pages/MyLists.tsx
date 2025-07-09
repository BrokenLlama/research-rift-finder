
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface PaperList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  paper_count?: number;
}

const MyLists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lists, setLists] = useState<PaperList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLists();
    }
  }, [user]);

  const fetchLists = async () => {
    try {
      const { data, error } = await supabase
        .from('paper_lists')
        .select(`
          *,
          papers(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to fetch your lists.",
          variant: "destructive",
        });
      } else {
        const listsWithCount = data.map(list => ({
          ...list,
          paper_count: list.papers?.length || 0
        }));
        setLists(listsWithCount);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const { error } = await supabase
        .from('paper_lists')
        .insert({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
          user_id: user?.id,
        });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to create list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "List created successfully!",
        });
        setNewListName('');
        setNewListDescription('');
        setIsDialogOpen(false);
        fetchLists();
      }
    } catch (error) {
      console.error('Error creating list:', error);
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('paper_lists')
        .delete()
        .eq('id', listId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "List deleted successfully!",
        });
        fetchLists();
      }
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const startChat = (listId: string, listName: string) => {
    navigate(`/research-chat?listId=${listId}&listName=${encodeURIComponent(listName)}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your lists...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Lists</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
              </DialogHeader>
              <form onSubmit={createList} className="space-y-4">
                <div>
                  <Label htmlFor="listName">List Name</Label>
                  <Input
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Climate Change, Machine Learning"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="listDescription">Description (optional)</Label>
                  <Textarea
                    id="listDescription"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Brief description of this list..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Create List
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">No lists yet</h2>
            <p className="text-gray-500 mb-4">Create your first list to start organizing papers!</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{list.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {list.paper_count} papers
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteList(list.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {list.description && (
                    <p className="text-sm text-gray-600 mb-4">{list.description}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/list/${list.id}`)}
                      className="flex-1"
                    >
                      View Papers
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => startChat(list.id, list.name)}
                      className="flex-1"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLists;
