
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, Calendar, FileText, ExternalLink, Quote, 
  Star, BookOpen, MessageSquare, Plus, Download 
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EnhancedAddToListButton from '@/components/EnhancedAddToListButton';
import { openAlexService, OpenAlexPaper } from '@/services/openAlexService';

const PaperDetails = () => {
  const { paperId, source } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<OpenAlexPaper | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paperId && source === 'openalex') {
      fetchPaperDetails();
    }
  }, [paperId, source]);

  const fetchPaperDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const decodedPaperId = decodeURIComponent(paperId as string);
      const fetchedPaper = await openAlexService.getPaperById(decodedPaperId);
      
      if (fetchedPaper) {
        setPaper(fetchedPaper);
      } else {
        setError('Paper not found');
      }
    } catch (err) {
      setError('Failed to load paper details');
      console.error('Error fetching paper details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizePaper = () => {
    // Navigate to summarize page with paper data
    navigate('/summarize', { 
      state: { 
        paperTitle: paper?.title,
        paperAbstract: paper?.abstract,
        paperAuthors: paper?.authors.map(a => a.display_name)
      } 
    });
  };

  const formatAuthors = (authors: Array<{ display_name: string }>) => {
    if (authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.map(a => a.display_name).join(', ');
    return `${authors.slice(0, 3).map(a => a.display_name).join(', ')} +${authors.length - 3} more`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading paper details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Paper Not Found</h2>
            <p className="text-gray-500 mb-4">{error || 'The requested paper could not be found.'}</p>
            <Button onClick={() => navigate('/')}>Back to Search</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">OpenAlex</Badge>
            {paper.open_access?.is_oa && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Open Access
              </Badge>
            )}
            {paper.best_oa_location?.pdf_url && (
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                PDF Available
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl leading-tight mb-4">
                  {paper.title}
                </CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{formatAuthors(paper.authors)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{paper.publication_year}</span>
                  </div>
                  
                  {(paper.primary_location?.source?.display_name || paper.host_venue?.display_name) && (
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2" />
                      <span>{paper.primary_location?.source?.display_name || paper.host_venue?.display_name}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    <Quote className="h-4 w-4 mr-2" />
                    <span>{paper.cited_by_count} citations</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Abstract */}
            {paper.abstract && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Abstract</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {paper.abstract}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Concepts/Keywords */}
            {paper.concepts && paper.concepts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Key Concepts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {paper.concepts.map((concept) => (
                      <Badge 
                        key={concept.display_name} 
                        variant="secondary"
                        className="text-sm"
                      >
                        {concept.display_name}
                        <span className="ml-1 text-xs opacity-75">
                          ({Math.round(concept.score * 100)}%)
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Publication Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Publication Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">Publication Date: </span>
                    <span className="text-gray-600">
                      {paper.publication_date || `${paper.publication_year}`}
                    </span>
                  </div>
                  
                  {paper.primary_location?.source?.type && (
                    <div>
                      <span className="font-medium">Source Type: </span>
                      <span className="text-gray-600">
                        {paper.primary_location.source.type}
                      </span>
                    </div>
                  )}

                  {paper.biblio?.volume && (
                    <div>
                      <span className="font-medium">Volume: </span>
                      <span className="text-gray-600">{paper.biblio.volume}</span>
                    </div>
                  )}

                  {paper.biblio?.issue && (
                    <div>
                      <span className="font-medium">Issue: </span>
                      <span className="text-gray-600">{paper.biblio.issue}</span>
                    </div>
                  )}

                  {(paper.biblio?.first_page || paper.biblio?.last_page) && (
                    <div>
                      <span className="font-medium">Pages: </span>
                      <span className="text-gray-600">
                        {paper.biblio.first_page}
                        {paper.biblio.last_page && paper.biblio.first_page !== paper.biblio.last_page 
                          ? `-${paper.biblio.last_page}` 
                          : ''
                        }
                      </span>
                    </div>
                  )}
                </div>

                {paper.doi && (
                  <div className="pt-2 border-t">
                    <span className="font-medium">DOI: </span>
                    <a 
                      href={paper.doi}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {paper.doi.replace('https://doi.org/', '')}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <EnhancedAddToListButton 
                  paper={{
                    id: paper.id,
                    title: paper.title,
                    authors: paper.authors.map(a => a.display_name),
                    abstract: paper.abstract,
                    publication_year: paper.publication_year,
                    journal: paper.primary_location?.source?.display_name || paper.host_venue?.display_name,
                    external_id: paper.id
                  }} 
                />
                
                <Button 
                  onClick={handleSummarizePaper}
                  variant="outline" 
                  className="w-full"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Summarize this Paper
                </Button>

                {paper.best_oa_location?.pdf_url && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href={paper.best_oa_location.pdf_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </a>
                  </Button>
                )}

                {paper.open_access?.oa_url && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    asChild
                  >
                    <a 
                      href={paper.open_access.oa_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Paper Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Paper Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Citations:</span>
                  <span className="font-medium">{paper.cited_by_count}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Authors:</span>
                  <span className="font-medium">{paper.authors.length}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-medium">{paper.publication_year}</span>
                </div>

                {paper.concepts && paper.concepts.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Key Concepts:</span>
                    <span className="font-medium">{paper.concepts.length}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Paper ID */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identifiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">OpenAlex ID: </span>
                    <span className="text-gray-600 font-mono text-xs break-all">
                      {paper.id}
                    </span>
                  </div>
                  {paper.doi && (
                    <div>
                      <span className="font-medium text-sm">DOI: </span>
                      <span className="text-gray-600 text-xs break-all">
                        {paper.doi.replace('https://doi.org/', '')}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperDetails;
