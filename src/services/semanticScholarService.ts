export interface SemanticScholarFilters {
  yearRange?: {
    from: number;
    to: number;
  };
  author?: string;
  fieldOfStudy?: string;
  journal?: string;
  hasPdf?: boolean;
}

export interface SemanticScholarPaper {
  id: string;
  title: string;
  authors: Array<{ name: string; authorId?: string }>;
  year: number;
  abstract?: string;
  venue?: string;
  url?: string;
  doi?: string;
  topics?: Array<{
    topic: string;
    topicId: string;
    score: number;
  }>;
  citationCount: number;
  openAccessPdf?: {
    url: string;
  };
  publicationDate?: string;
  journal?: {
    name: string;
  };
}

export interface SemanticScholarSearchResponse {
  results: SemanticScholarPaper[];
  meta: {
    total: number;
    offset: number;
    limit: number;
  };
}

export class SemanticScholarService {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';
  private apiKey = ''; // You can add an API key here for higher rate limits

  private buildSearchQuery(query: string): string {
    // Clean and normalize the query
    const cleanQuery = query.trim();
    
    // Split into words and phrases
    const words = cleanQuery.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return '';
    
    // For Semantic Scholar, we can use a simpler approach
    // The API handles relevance scoring well
    return cleanQuery;
  }

  async searchPapers(
    query: string,
    page: number = 1,
    perPage: number = 25,
    filters?: SemanticScholarFilters
  ): Promise<SemanticScholarSearchResponse> {
    try {
      const offset = (page - 1) * perPage;
      const searchQuery = this.buildSearchQuery(query);
      
      // Build the search URL
      let url = `${this.baseUrl}/paper/search?query=${encodeURIComponent(searchQuery)}&limit=${perPage}&offset=${offset}&fields=title,authors,year,abstract,venue,url,doi,topics,citationCount,openAccessPdf,publicationDate,journal`;
      
      // Add filters
      if (filters?.yearRange?.from || filters?.yearRange?.to) {
        const from = filters.yearRange.from || 1900;
        const to = filters.yearRange.to || new Date().getFullYear();
        url += `&year=${from}-${to}`;
      }
      
      console.log('Semantic Scholar API URL:', url);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Apply additional filters that can't be done via API
      let filteredResults = data.data || [];
      
      if (filters?.author && filters.author.trim()) {
        const authorQuery = filters.author.toLowerCase();
        filteredResults = filteredResults.filter((paper: any) =>
          paper.authors?.some((author: any) =>
            author.name?.toLowerCase().includes(authorQuery)
          )
        );
      }
      
      if (filters?.journal && filters.journal.trim()) {
        const journalQuery = filters.journal.toLowerCase();
        filteredResults = filteredResults.filter((paper: any) =>
          paper.venue?.toLowerCase().includes(journalQuery) ||
          paper.journal?.name?.toLowerCase().includes(journalQuery)
        );
      }
      
      if (filters?.hasPdf === true) {
        filteredResults = filteredResults.filter((paper: any) => paper.openAccessPdf?.url);
      }
      
      return {
        results: filteredResults.map((paper: any) => ({
          id: paper.paperId || paper.id,
          title: paper.title || 'No title available',
          authors: paper.authors?.map((author: any) => ({
            name: author.name || 'Unknown Author',
            authorId: author.authorId
          })) || [],
          year: paper.year || new Date().getFullYear(),
          abstract: paper.abstract,
          venue: paper.venue,
          url: paper.url,
          doi: paper.doi,
          topics: paper.topics?.slice(0, 5) || [],
          citationCount: paper.citationCount || 0,
          openAccessPdf: paper.openAccessPdf,
          publicationDate: paper.publicationDate,
          journal: paper.journal
        })),
        meta: {
          total: data.total || filteredResults.length,
          offset: offset,
          limit: perPage
        }
      };
    } catch (error) {
      console.error('Semantic Scholar search error:', error);
      throw error;
    }
  }

  async getPaperById(id: string): Promise<SemanticScholarPaper | null> {
    try {
      const url = `${this.baseUrl}/paper/${id}?fields=title,authors,year,abstract,venue,url,doi,topics,citationCount,openAccessPdf,publicationDate,journal`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        return null;
      }

      const paper = await response.json();
      
      return {
        id: paper.paperId || paper.id,
        title: paper.title || 'No title available',
        authors: paper.authors?.map((author: any) => ({
          name: author.name || 'Unknown Author',
          authorId: author.authorId
        })) || [],
        year: paper.year || new Date().getFullYear(),
        abstract: paper.abstract,
        venue: paper.venue,
        url: paper.url,
        doi: paper.doi,
        topics: paper.topics?.slice(0, 5) || [],
        citationCount: paper.citationCount || 0,
        openAccessPdf: paper.openAccessPdf,
        publicationDate: paper.publicationDate,
        journal: paper.journal
      };
    } catch (error) {
      console.error('Error fetching paper by ID:', error);
      return null;
    }
  }

  // Helper method to get paper recommendations
  async getPaperRecommendations(paperId: string, limit: number = 10): Promise<SemanticScholarPaper[]> {
    try {
      const url = `${this.baseUrl}/paper/${paperId}/recommendations?limit=${limit}&fields=title,authors,year,abstract,venue,url,doi,topics,citationCount,openAccessPdf`;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      
      return (data.data || []).map((paper: any) => ({
        id: paper.paperId || paper.id,
        title: paper.title || 'No title available',
        authors: paper.authors?.map((author: any) => ({
          name: author.name || 'Unknown Author',
          authorId: author.authorId
        })) || [],
        year: paper.year || new Date().getFullYear(),
        abstract: paper.abstract,
        venue: paper.venue,
        url: paper.url,
        doi: paper.doi,
        topics: paper.topics?.slice(0, 5) || [],
        citationCount: paper.citationCount || 0,
        openAccessPdf: paper.openAccessPdf,
        publicationDate: paper.publicationDate,
        journal: paper.journal
      }));
    } catch (error) {
      console.error('Error fetching paper recommendations:', error);
      return [];
    }
  }
}

export const semanticScholarService = new SemanticScholarService(); 