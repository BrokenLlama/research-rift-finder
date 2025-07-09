
import React, { useState, useEffect } from 'react';
import { Plus, FileText, MessageSquare, Trash2, Edit2, Download } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import LiteratureReviewGenerator from '@/components/LiteratureReviewGenerator';

interface PaperList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  paper_count: number;
  literature_review: string | null;
}

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
}

const MyLists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [lists, setLists] = useState<PaperList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<PaperList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [listPapers, setListPapers] = useState<{ [key: string]: Paper[] }>({});

  useEffect(() => {
    if (user) {
      fetchLists();
    }
  }, [user]);

  const fetchLists = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Fetch lists with paper counts
      const { data: listsData, error: listsError } = await supabase
        .from('paper_lists')
        .select(`
          id,
          name,
          description,
          created_at,
          literature_review,
          papers(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (listsError) throw listsError;

      // Transform the data to include paper count
      const transformedLists: PaperList[] = (listsData || []).map(list => ({
        id: list.id,
        name: list.name,
        description: list.description,
        created_at: list.created_at,
        literature_review: list.literature_review,
        paper_count: list.papers?.[0]?.count || 0,
      }));

      setLists(transformedLists);

      // Fetch papers for each list to get accurate counts
      for (const list of transformedLists) {
        const { data: papersData, error: papersError } = await supabase
          .from('papers')
          .select('*')
          .eq('list_id', list.id);

        if (!papersError && papersData) {
          const papers: Paper[] = papersData.map(paper => ({
            id: paper.id,
            title: paper.title,
            authors: Array.isArray(paper.authors) ? paper.authors as string[] : [],
            abstract: paper.abstract,
            publication_year: paper.publication_year,
            journal: paper.journal,
          }));
          
          setListPapers(prev => ({
            ...prev,
            [list.id]: papers
          }));

          // Update the paper count in the list
          setLists(prevLists => 
            prevLists.map(l => 
              l.id === list.id 
                ? { ...l, paper_count: papers.length }
                : l
            )
          );
        }
      }

    } catch (error) {
      console.error('Error fetching lists:', error);
      toast({
        title: "Error",
        description: "Failed to load your lists.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createList = async () => {
    if (!user || !newListName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('paper_lists')
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;

      const newList: PaperList = {
        id: data.id,
        name: data.name,
        description: data.description,
        created_at: data.created_at,
        literature_review: data.literature_review,
        paper_count: 0,
      };

      setLists(prev => [newList, ...prev]);
      setNewListName('');
      setNewListDescription('');
      setIsCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "List created successfully!",
      });

    } catch (error) {
      console.error('Error creating list:', error);
      toast({
        title: "Error",
        description: "Failed to create list.",
        variant: "destructive",
      });
    }
  };

  const updateList = async () => {
    if (!editingList || !newListName.trim()) return;

    try {
      const { error } = await supabase
        .from('paper_lists')
        .update({
          name: newListName.trim(),
          description: newListDescription.trim() || null,
        })
        .eq('id', editingList.id);

      if (error) throw error;

      setLists(prev => 
        prev.map(list => 
          list.id === editingList.id 
            ? { ...list, name: newListName.trim(), description: newListDescription.trim() || null }
            : list
        )
      );

      setIsEditDialogOpen(false);
      setEditingList(null);
      setNewListName('');
      setNewListDescription('');

      toast({
        title: "Success",
        description: "List updated successfully!",
      });

    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: "Error",
        description: "Failed to update list.",
        variant: "destructive",
      });
    }
  };

  const deleteList = async (listId: string) => {
    try {
      const { error } = await supabase
        .from('paper_lists')
        .delete()
        .eq('id', listId);

      if (error) throw error;

      setLists(prev => prev.filter(list => list.id !== listId));
      setListPapers(prev => {
        const newPapers = { ...prev };
        delete newPapers[listId];
        return newPapers;
      });

      toast({
        title: "Success",
        description: "List deleted successfully!",
      });

    } catch (error) {
      console.error('Error deleting list:', error);
      toast({
        title: "Error",
        description: "Failed to delete list.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (list: PaperList) => {
    setEditingList(list);
    setNewListName(list.name);
    setNewListDescription(list.description || '');
    setIsEditDialogOpen(true);
  };

  const handleChatWithList = (list: PaperList) => {
    navigate(`/research-chat?listId=${list.id}&listName=${encodeURIComponent(list.name)}`);
  };

  const handleViewList = (list: PaperList) => {
    navigate(`/list/${list.id}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Please sign in to view your lists.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4">Loading your lists...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Lists</h1>
            <p className="text-gray-600 mt-2">Organize and manage your research papers</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <div className="space-y-4">
                <div>
                  <label htmlFor="list-name" className="block text-sm font-medium mb-2">
                    List Name *
                  </label>
                  <Input
                    id="list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name"
                  />
                </div>
                <div>
                  <label htmlFor="list-description" className="block text-sm font-medium mb-2">
                    Description (optional)
                  </label>
                  <Textarea
                    id="list-description"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Enter list description"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createList} disabled={!newListName.trim()}>
                    Create List
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No lists yet</h3>
            <p className="text-gray-500 mb-6">Create your first list to start organizing papers</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First List
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card key={list.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{list.name}</CardTitle>
                      {list.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {list.description}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(list)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete List</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{list.name}"? This will also delete all papers in this list. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteList(list.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>{list.paper_count} papers</span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Created: {new Date(list.created_at).toLocaleDateString()}
                    </div>

                    <div className="space-y-3">
                      {/* Literature Review Generator */}
                      <LiteratureReviewGenerator
                        listId={list.id}
                        listName={list.name}
                        papers={listPapers[list.id] || []}
                        onReviewGenerated={(review) => {
                          setLists(prev => 
                            prev.map(l => 
                              l.id === list.id 
                                ? { ...l, literature_review: review }
                                : l
                            )
                          );
                        }}
                      />

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewList(list)}
                          className="flex-1"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChatWithList(list)}
                          className="flex-1"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit List Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-list-name" className="block text-sm font-medium mb-2">
                  List Name *
                </label>
                <Input
                  id="edit-list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name"
                />
              </div>
              <div>
                <label htmlFor="edit-list-description" className="block text-sm font-medium mb-2">
                  Description (optional)
                </label>
                <Textarea
                  id="edit-list-description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Enter list description"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={updateList} disabled={!newListName.trim()}>
                  Update List
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MyLists;
