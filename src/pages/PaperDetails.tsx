
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
  authors: Array<{ display_name: string }>;
  publication_year: number;
  journal?: string;
  abstract?: string;
  external_id: string;
  source: 'openalex' | 'semantic_scholar';
  citations_count?: number;
  doi?: string;
  url?: string;
  keywords?: string[];
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
      // Mock data for demonstration - in a real app, you'd fetch from your API services
      const mockPaper: PaperDetailsData = {
        title: "Climate Change Impact on Global Biodiversity: A Comprehensive Analysis",
        authors: [
          { display_name: "Dr. Jane Smith" },
          { display_name: "Prof. Michael Johnson" },
          { display_name: "Dr. Sarah Chen" }
        ],
        publication_year: 2023,
        journal: "Nature Climate Change",
        abstract: "This comprehensive study examines the multifaceted impacts of climate change on global biodiversity patterns. Through analysis of longitudinal data spanning three decades, we identify critical thresholds and tipping points in ecosystem responses to temperature and precipitation changes. Our findings reveal accelerated species migration patterns, altered phenological cycles, and increasing extinction risks in vulnerable habitats. The research highlights the urgent need for adaptive conservation strategies and international cooperation to mitigate biodiversity loss in the face of ongoing climate change.",
        external_id: paperId as string,
        source: source as 'openalex' | 'semantic_scholar',
        citations_count: 142,
        doi: "10.1038/s41558-023-01234-5",
        url: "https://example.com/paper",
        keywords: ["Climate Change", "Biodiversity", "Conservation", "Ecosystem", "Species Migration"]
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
            {paper.source === 'openalex' ? 'OpenAlex' : 'Semantic Scholar'}
          </Badge>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title and Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl leading-tight">
                {paper.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>{paper.authors.map(a => a.display_name).join(', ')}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{paper.publication_year}</span>
                </div>
                
                {paper.journal && (
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    <span>{paper.journal}</span>
                  </div>
                )}

                {paper.citations_count && (
                  <div className="flex items-center">
                    <Quote className="h-4 w-4 mr-2" />
                    <span>{paper.citations_count} citations</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <AddToListButton 
                  paper={{
                    title: paper.title,
                    authors: paper.authors.map(a => a.display_name),
                    abstract: paper.abstract,
                    publication_year: paper.publication_year,
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

          {/* Keywords */}
          {paper.keywords && paper.keywords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {paper.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
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
              {paper.doi && (
                <div>
                  <span className="font-medium">DOI: </span>
                  <span className="text-gray-600">{paper.doi}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Source: </span>
                <span className="text-gray-600">
                  {paper.source === 'openalex' ? 'OpenAlex' : 'Semantic Scholar'}
                </span>
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
