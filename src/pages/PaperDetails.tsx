
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, FileText, ExternalLink, Quote, Star } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AddToListButton from '@/components/AddToListButton';

interface PaperDetailsData {
  title: string;
  authors: Array<{ name: string }>;
  year: number;
  journal?: string;
  abstract?: string;
  external_id: string;
  source: string;
  url?: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
}

const PaperDetails = () => {
  const { paperId, source } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState<PaperDetailsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (paperId && source) {
      fetchPaperDetails();
    }
  }, [paperId, source]);

  const fetchPaperDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, using mock data since we'd need to implement individual paper fetching
      // In a real implementation, you'd fetch from Semantic Scholar API with specific paper ID
      const mockPaper: PaperDetailsData = {
        title: "Machine Learning Applications in Climate Change Research: A Comprehensive Survey",
        authors: [
          { name: "Dr. Jane Smith" },
          { name: "Prof. Michael Johnson" },
          { name: "Dr. Sarah Chen" },
          { name: "Dr. Robert Williams" }
        ],
        year: 2024,
        journal: "Nature Climate Change",
        abstract: "This comprehensive survey examines the rapidly growing field of machine learning applications in climate change research. We analyze over 500 recent publications to identify key trends, methodologies, and breakthrough applications. Our findings reveal significant advances in climate modeling, extreme weather prediction, and carbon footprint analysis using deep learning techniques. The survey covers supervised and unsupervised learning approaches, neural networks, and ensemble methods applied to various climate datasets. We also discuss challenges such as data quality, model interpretability, and computational requirements. The review concludes with recommendations for future research directions and potential policy implications of ML-driven climate science.",
        external_id: paperId as string,
        source: source as string,
        url: "https://example.com/paper",
        externalIds: {
          DOI: "10.1038/s41558-2024-01234-5",
          ArXiv: "2024.12345"
        }
      };
      
      setPaper(mockPaper);
    } catch (err) {
      setError('Failed to load paper details');
      console.error('Error fetching paper details:', err);
    } finally {
      setIsLoading(false);
    }
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant="secondary" className="ml-auto">
            Semantic Scholar
          </Badge>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl leading-tight">
                {paper.url ? (
                  <a 
                    href={paper.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors inline-flex items-center gap-2"
                  >
                    {paper.title}
                    <ExternalLink className="h-5 w-5" />
                  </a>
                ) : (
                  paper.title
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{paper.authors.map(a => a.name).join(', ')}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{paper.year}</span>
                </div>
                
                {paper.journal && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{paper.journal}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <AddToListButton 
                  paper={{
                    title: paper.title,
                    authors: paper.authors.map(a => a.name),
                    abstract: paper.abstract,
                    publication_year: paper.year,
                    journal: paper.journal,
                    external_id: paper.external_id
                  }} 
                />
                
                {paper.url && (
                  <Button variant="outline" asChild>
                    <a href={paper.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Original
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Abstract */}
          {paper.abstract && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Abstract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {paper.abstract}
                </p>
              </CardContent>
            </Card>
          )}

          {/* External IDs */}
          {paper.externalIds && Object.keys(paper.externalIds).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">External Identifiers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {paper.externalIds.DOI && (
                    <Badge variant="outline">
                      DOI: {paper.externalIds.DOI}
                    </Badge>
                  )}
                  {paper.externalIds.ArXiv && (
                    <Badge variant="outline">
                      ArXiv: {paper.externalIds.ArXiv}
                    </Badge>
                  )}
                  {paper.externalIds.PubMed && (
                    <Badge variant="outline">
                      PubMed: {paper.externalIds.PubMed}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Publication Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Source: </span>
                <span className="text-gray-600">Semantic Scholar</span>
              </div>
              <div>
                <span className="font-medium">Paper ID: </span>
                <span className="text-gray-600 font-mono text-sm">{paper.external_id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaperDetails;
