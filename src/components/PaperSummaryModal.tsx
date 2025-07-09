
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
  external_id?: string;
}

interface PaperSummaryModalProps {
  paper: Paper | null;
  isOpen: boolean;
  onClose: () => void;
  listId?: string;
}

const PaperSummaryModal: React.FC<PaperSummaryModalProps> = ({
  paper,
  isOpen,
  onClose,
  listId,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const generateSummary = async () => {
    if (!paper) return;

    setIsGenerating(true);
    
    try {
      const prompt = `Please provide a comprehensive summary of this research paper:

Title: ${paper.title}
Authors: ${paper.authors.join(', ')}
Year: ${paper.publication_year || 'N/A'}
Journal: ${paper.journal || 'N/A'}

Abstract: ${paper.abstract || 'No abstract available'}

Please structure your summary with:
1. Main research question/objective
2. Key methodology
3. Primary findings
4. Significance and implications
5. Limitations (if apparent)

Keep the summary concise but comprehensive, suitable for academic reference.`;

      const { data, error } = await supabase.functions.invoke('groq-chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: 'You are an expert academic researcher who creates comprehensive yet concise summaries of research papers. Focus on clarity and academic relevance.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
      });

      if (error) {
        throw error;
      }

      const generatedSummary = data.message;
      setSummary(generatedSummary);

      toast({
        title: "Success",
        description: "Paper summary generated successfully!",
      });

    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "Error",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSummary = async () => {
    if (!paper || !summary) return;

    setIsSaving(true);

    try {
      // Save summary to the paper record
      const { error } = await supabase
        .from('papers')
        .update({ 
          summary: { 
            content: summary, 
            generated_at: new Date().toISOString() 
          } 
        })
        .eq('external_id', paper.external_id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Summary saved successfully!",
      });

    } catch (error) {
      console.error('Error saving summary:', error);
      toast({
        title: "Error",
        description: "Failed to save summary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setSummary('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Paper Summary</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {paper && (
          <div className="flex-1 space-y-4">
            {/* Paper Info */}
            <div className="border-b pb-4">
              <h3 className="font-semibold text-lg">{paper.title}</h3>
              <p className="text-sm text-gray-600 mt-1">
                {paper.authors.join(', ')} • {paper.publication_year} • {paper.journal}
              </p>
            </div>

            {/* Generate Summary Button */}
            {!summary && (
              <div className="text-center py-8">
                <Button
                  onClick={generateSummary}
                  disabled={isGenerating}
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Summary...
                    </>
                  ) : (
                    'Generate Summary'
                  )}
                </Button>
              </div>
            )}

            {/* Summary Content */}
            {summary && (
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Generated Summary</h4>
                  <div className="flex gap-2">
                    <Button
                      onClick={saveSummary}
                      disabled={isSaving}
                      size="sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Summary
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={generateSummary}
                      disabled={isGenerating}
                      variant="outline"
                      size="sm"
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-96 w-full rounded border p-4">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {summary}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaperSummaryModal;
