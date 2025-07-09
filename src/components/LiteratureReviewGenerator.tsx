
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string | null;
  publication_year: number | null;
  journal: string | null;
}

interface LiteratureReviewGeneratorProps {
  listId: string;
  listName: string;
  papers: Paper[];
  onReviewGenerated?: (review: string) => void;
}

const LiteratureReviewGenerator: React.FC<LiteratureReviewGeneratorProps> = ({
  listId,
  listName,
  papers,
  onReviewGenerated,
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [review, setReview] = useState<string>('');

  const generateLiteratureReview = async () => {
    if (papers.length === 0) {
      toast({
        title: "No Papers",
        description: "Add some papers to this list before generating a literature review.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const paperSummaries = papers.map(paper => ({
        title: paper.title,
        authors: paper.authors.join(', '),
        year: paper.publication_year,
        journal: paper.journal,
        abstract: paper.abstract?.substring(0, 500) || 'No abstract available',
      }));

      const prompt = `Generate a comprehensive literature review for the following ${papers.length} papers on the topic "${listName}". 

Structure the review with:
1. Introduction and background
2. Key themes and findings
3. Methodological approaches
4. Gaps and future research directions
5. Conclusion

Papers to review:
${paperSummaries.map((paper, index) => `
${index + 1}. ${paper.title}
Authors: ${paper.authors}
Year: ${paper.year || 'N/A'}
Journal: ${paper.journal || 'N/A'}
Abstract: ${paper.abstract}
`).join('\n')}

Write a professional, academic literature review that synthesizes these papers into a coherent narrative.`;

      const { data, error } = await supabase.functions.invoke('groq-chat', {
        body: {
          messages: [
            {
              role: 'system',
              content: 'You are an expert academic researcher who writes comprehensive literature reviews. Focus on synthesis, critical analysis, and identifying research gaps.',
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

      const generatedReview = data.message;
      setReview(generatedReview);

      // Save the literature review to the database
      const { error: updateError } = await supabase
        .from('paper_lists')
        .update({ literature_review: generatedReview })
        .eq('id', listId);

      if (updateError) {
        console.error('Error saving literature review:', updateError);
      }

      if (onReviewGenerated) {
        onReviewGenerated(generatedReview);
      }

      toast({
        title: "Success",
        description: "Literature review generated successfully!",
      });

    } catch (error) {
      console.error('Error generating literature review:', error);
      toast({
        title: "Error",
        description: "Failed to generate literature review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadReview = () => {
    if (!review) return;

    const blob = new Blob([review], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${listName}_Literature_Review.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Literature Review Generator
          </div>
          <div className="flex gap-2">
            <Button
              onClick={generateLiteratureReview}
              disabled={isGenerating || papers.length === 0}
              size="sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Review'
              )}
            </Button>
            {review && (
              <Button
                onClick={downloadReview}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      {review && (
        <CardContent>
          <ScrollArea className="h-96 w-full rounded border p-4">
            <div className="whitespace-pre-wrap text-sm">
              {review}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  );
};

export default LiteratureReviewGenerator;
