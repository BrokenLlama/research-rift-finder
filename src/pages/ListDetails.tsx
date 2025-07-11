
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, ArrowLeft, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal?: string;
  created_at: string;
  concepts?: any[];
  external_id?: string;
}

interface PaperList {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

// Helper functions for citation formats
function toBibTeX(paper: Paper, index: number): string {
  const authors = paper.authors && paper.authors.length > 0 ? paper.authors.join(' and ') : 'Unknown';
  const year = paper.publication_year ? `  year = {${paper.publication_year}},\n` : '';
  const journal = paper.journal ? `  journal = {${paper.journal}},\n` : '';
  return `@article{paper${index},\n  title = {${paper.title}},\n  author = {${authors}},\n${year}${journal}}\n`;
}
function toRIS(paper: Paper): string {
  const authors = paper.authors && paper.authors.length > 0
    ? paper.authors.map(a => `AU  - ${a}`).join('\n')
    : 'AU  - Unknown';
  return [
    'TY  - JOUR',
    `TI  - ${paper.title}`,
    authors,
    paper.journal ? `JO  - ${paper.journal}` : '',
    paper.publication_year ? `PY  - ${paper.publication_year}` : '',
    'ER  -'
  ].filter(Boolean).join('\n') + '\n';
}
function toAPA(paper: Paper): string {
  const authors = paper.authors && paper.authors.length > 0
    ? paper.authors.join(', ')
    : 'Unknown';
  return `${authors} (${paper.publication_year || 'n.d.'}). ${paper.title}. ${paper.journal || ''}`;
}

// ExportCitations component
function ExportCitations({ papers, listName, defaultFormat = 'bibtex' }: {
  papers: Paper[];
  listName: string;
  defaultFormat?: 'bibtex' | 'ris' | 'apa';
}) {
  const [citationFormat, setCitationFormat] = useState<'bibtex' | 'ris' | 'apa'>(defaultFormat);
  const [open, setOpen] = useState(false);
  const formatLabels = {
    bibtex: 'BibTeX (.bib)',
    ris: 'RIS (.ris)',
    apa: 'APA (plain text)'
  };

  function toBibTeX(paper: Paper, index: number): string {
    const authors = paper.authors && paper.authors.length > 0 ? paper.authors.join(' and ') : 'Unknown';
    const year = paper.publication_year ? `  year = {${paper.publication_year}},\n` : '';
    const journal = paper.journal ? `  journal = {${paper.journal}},\n` : '';
    return `@article{paper${index},\n  title = {${paper.title}},\n  author = {${authors}},\n${year}${journal}}\n`;
  }
  function toRIS(paper: Paper): string {
    const authors = paper.authors && paper.authors.length > 0
      ? paper.authors.map(a => `AU  - ${a}`).join('\n')
      : 'AU  - Unknown';
    return [
      'TY  - JOUR',
      `TI  - ${paper.title}`,
      authors,
      paper.journal ? `JO  - ${paper.journal}` : '',
      paper.publication_year ? `PY  - ${paper.publication_year}` : '',
      'ER  -'
    ].filter(Boolean).join('\n') + '\n';
  }
  function toAPA(paper: Paper): string {
    const authors = paper.authors && paper.authors.length > 0
      ? paper.authors.join(', ')
      : 'Unknown';
    return `${authors} (${paper.publication_year || 'n.d.'}). ${paper.title}. ${paper.journal || ''}`;
  }

  const handleExportCitations = (format: 'bibtex' | 'ris' | 'apa' = citationFormat) => {
    if (!papers || papers.length === 0) return;
    let content = '';
    let ext = 'txt';
    if (format === 'bibtex') {
      content = papers.map(toBibTeX).join('\n');
      ext = 'bib';
    } else if (format === 'ris') {
      content = papers.map(toRIS).join('\n');
      ext = 'ris';
    } else if (format === 'apa') {
      content = papers.map(toAPA).join('\n\n');
      ext = 'txt';
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `${listName || 'my-list'}-citations.${ext}`);
  };

  return (
    <div className="flex items-center gap-0">
      <Button onClick={() => handleExportCitations()} variant="outline" className="rounded-r-none">
        Export Citations
      </Button>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="rounded-l-none px-2" aria-label="Select citation format">
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[160px]">
          {(['bibtex', 'ris', 'apa'] as const).map((format) => (
            <DropdownMenuItem
              key={format}
              onSelect={() => {
                setCitationFormat(format);
                setOpen(false);
                handleExportCitations(format);
              }}
              className={
                format === citationFormat ? 'font-semibold text-blue-600' : ''
              }
            >
              {formatLabels[format]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Add OpenAlex recommendation fetch helper
async function fetchRecommendedPapers(conceptIds: string[], excludeIds: string[], count = 5) {
  if (!conceptIds.length) return [];
  const filter = `concepts.id:${conceptIds.join(',')}`;
  const url = `https://api.openalex.org/works?filter=${filter}&per-page=${count * 2}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  // Filter out already-in-list papers by external_id
  return (data.results || []).filter((p: any) => !excludeIds.includes(p.id)).slice(0, count);
}

const ListDetails = () => {
  const { listId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [list, setList] = useState<PaperList | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState<string | null>(null);

  // Helper to extract top concept IDs from current papers
  function getTopConceptIds(papers: any[], topN = 3): string[] {
    const freq: Record<string, number> = {};
    papers.forEach(paper => {
      (paper.concepts || []).forEach((c: any) => {
        if (c.id) freq[c.id] = (freq[c.id] || 0) + 1;
      });
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([id]) => id);
  }

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
        // Cast the data to match our interface
        const typedPapers: Paper[] = (papersData || []).map(paper => ({
          id: paper.id,
          title: paper.title,
          authors: Array.isArray(paper.authors) ? paper.authors as string[] : [],
          abstract: paper.abstract,
          publication_year: paper.publication_year,
          journal: paper.journal,
          created_at: paper.created_at || new Date().toISOString(),
          concepts: paper["concepts"] || [],
          external_id: paper["external_id"] || '',
        }));
        setPapers(typedPapers);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch recommendations when papers change
  useEffect(() => {
    if (!papers.length) return;
    console.log('Papers in list:', papers);
    setRecLoading(true);
    setRecError(null);
    const topConcepts = getTopConceptIds(papers);
    console.log('Top concept IDs:', topConcepts);
    const excludeIds = papers.map(p => p.external_id);
    const url = `https://api.openalex.org/works?filter=concepts.id:${topConcepts.join(',')}&per-page=10`;
    console.log('OpenAlex API URL:', url);
    fetchRecommendedPapers(topConcepts, excludeIds, 5)
      .then(setRecommended)
      .catch(() => setRecError('Failed to fetch recommendations.'))
      .finally(() => setRecLoading(false));
  }, [papers]);

  // Add recommended paper to list
  const handleAddRecommended = async (recPaper: any) => {
    try {
      const { error } = await supabase.from('papers').insert({
        list_id: listId,
        title: recPaper.title,
        authors: recPaper.authorships?.map((a: any) => a.author?.display_name) || [],
        abstract: recPaper.abstract_inverted_index ? Object.entries(recPaper.abstract_inverted_index).sort((a, b) => a[1][0] - b[1][0]).map(([word]) => word).join(' ') : null,
        publication_year: recPaper.publication_year,
        journal: recPaper.primary_location?.source?.display_name || recPaper.host_venue?.display_name || '',
        created_at: new Date().toISOString(),
        concepts: recPaper.concepts || [],
        external_id: recPaper.id,
      });
      if (error) {
        toast({ title: 'Error', description: 'Failed to add paper.', variant: 'destructive' });
      } else {
        toast({ title: 'Success', description: 'Paper added to your list!' });
        fetchListAndPapers();
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add paper.', variant: 'destructive' });
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
          <div className="flex gap-2 items-center">
            <ExportCitations papers={papers} listName={list.name} />
            <Button onClick={startChat}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </div>
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
        {/* Recommended Papers Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Recommended Papers</h2>
          {(() => {
            if (recLoading) {
              return <div className="text-center py-8 text-gray-500">Loading recommendations...</div>;
            } else if (recError) {
              return <div className="text-center py-8 text-red-500">{recError}</div>;
            } else if (recommended.length === 0) {
              return <div className="text-center py-8 text-gray-500">No recommendations found based on your list topics.</div>;
            } else {
              return (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommended.map((rec) => (
                    <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg mb-2">{rec.title}</CardTitle>
                        <div className="text-sm text-gray-600 space-y-1">
                          {rec.authorships && rec.authorships.length > 0 && (
                            <p><strong>Authors:</strong> {rec.authorships.map((a: any) => a.author?.display_name).filter(Boolean).join(', ')}</p>
                          )}
                          {rec.publication_year && (
                            <p><strong>Year:</strong> {rec.publication_year}</p>
                          )}
                          {rec.primary_location?.source?.display_name && (
                            <p><strong>Journal:</strong> {rec.primary_location.source.display_name}</p>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAddRecommended(rec)}>
                            Add to List
                          </Button>
                          {rec.primary_location?.landing_page_url && (
                            <Button size="sm" variant="outline" asChild>
                              <a href={rec.primary_location.landing_page_url} target="_blank" rel="noopener noreferrer">View</a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            }
          })()}
        </div>
      </div>
    </div>
  );
};

export default ListDetails;
