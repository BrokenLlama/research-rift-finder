
export interface SearchFilters {
  yearRange?: {
    from: number;
    to: number;
  };
  author?: string;
  fieldOfStudy?: string;
}

export interface PaperResult {
  id: string;
  title: string;
  authors: Array<{ name: string }>;
  year: number;
  journal?: string;
  abstract?: string;
  url?: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    PubMed?: string;
  };
}

export interface SearchResponse {
  results: PaperResult[];
  total: number;
  offset: number;
  hasMore: boolean;
}

// Semantic Scholar API Service
export class SemanticScholarService {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  async search(
    query: string,
    offset: number = 0,
    limit: number = 20,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      params.append('offset', offset.toString());
      params.append('limit', limit.toString());
      params.append('fields', 'title,authors,abstract,year,url,externalIds,journal');
      
      // Apply year filter if provided
      if (filters?.yearRange) {
        params.append('year', `${filters.yearRange.from}-${filters.yearRange.to}`);
      }
      
      // Apply author filter if provided
      if (filters?.author) {
        params.append('authors', filters.author);
      }
      
      // Apply field of study filter if provided
      if (filters?.fieldOfStudy) {
        params.append('fieldsOfStudy', filters.fieldOfStudy);
      }

      const response = await fetch(`${this.baseUrl}/paper/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from Semantic Scholar');
      }

      const data = await response.json();
      
      return {
        results: (data.data || []).map((paper: any) => ({
          id: paper.paperId || `ss_${Date.now()}_${Math.random()}`,
          title: paper.title || 'No title available',
          authors: paper.authors?.map((author: any) => ({ 
            name: author.name || 'Unknown Author' 
          })) || [],
          year: paper.year || new Date().getFullYear(),
          journal: paper.journal?.name || undefined,
          abstract: paper.abstract || undefined,
          url: paper.url || undefined,
          externalIds: paper.externalIds || {}
        })),
        total: data.total || 0,
        offset: data.offset || 0,
        hasMore: (data.data || []).length === limit
      };
    } catch (error) {
      console.error('Semantic Scholar search error:', error);
      throw error;
    }
  }
}

export const semanticScholarService = new SemanticScholarService();
