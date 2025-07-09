
export interface OpenAlexFilters {
  yearRange?: {
    from: number;
    to: number;
  };
  author?: string;
  fieldOfStudy?: string;
  journal?: string;
  hasPdf?: boolean;
}

export interface OpenAlexPaper {
  id: string;
  title: string;
  authors: Array<{ display_name: string; id?: string }>;
  publication_year: number;
  publication_date: string;
  abstract?: string;
  primary_location?: {
    source?: {
      display_name: string;
      type: string;
    };
  };
  host_venue?: {
    display_name: string;
    type: string;
  };
  open_access?: {
    is_oa: boolean;
    oa_url?: string;
  };
  doi?: string;
  concepts?: Array<{
    display_name: string;
    level: number;
    score: number;
  }>;
  cited_by_count: number;
  biblio?: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  };
  best_oa_location?: {
    pdf_url?: string;
    host_type?: string;
  };
}

export interface OpenAlexSearchResponse {
  results: OpenAlexPaper[];
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
  };
}

export class OpenAlexService {
  private baseUrl = 'https://api.openalex.org';

  async searchPapers(
    query: string,
    page: number = 1,
    perPage: number = 25,
    filters?: OpenAlexFilters
  ): Promise<OpenAlexSearchResponse> {
    try {
      const params = new URLSearchParams();
      
      // Build search query
      let searchQuery = query;
      
      // Add filters to the query
      if (filters?.author) {
        searchQuery += ` author.display_name.search:${filters.author}`;
      }
      
      if (filters?.fieldOfStudy) {
        searchQuery += ` concepts.display_name.search:${filters.fieldOfStudy}`;
      }
      
      if (filters?.journal) {
        searchQuery += ` primary_location.source.display_name.search:${filters.journal}`;
      }
      
      params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());
      params.append('sort', 'cited_by_count:desc');
      
      // Add year range filter
      if (filters?.yearRange) {
        params.append('filter', `publication_year:${filters.yearRange.from}-${filters.yearRange.to}`);
      }
      
      // Add PDF availability filter
      if (filters?.hasPdf !== undefined) {
        params.append('filter', `has_fulltext:${filters.hasPdf}`);
      }
      
      const response = await fetch(`${this.baseUrl}/works?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        results: data.results.map((paper: any) => ({
          id: paper.id,
          title: paper.title || 'No title available',
          authors: paper.authorships?.map((authorship: any) => ({
            display_name: authorship.author?.display_name || 'Unknown Author',
            id: authorship.author?.id
          })) || [],
          publication_year: paper.publication_year || new Date().getFullYear(),
          publication_date: paper.publication_date || '',
          abstract: paper.abstract_inverted_index ? this.reconstructAbstract(paper.abstract_inverted_index) : undefined,
          primary_location: paper.primary_location,
          host_venue: paper.host_venue,
          open_access: paper.open_access,
          doi: paper.doi,
          concepts: paper.concepts?.slice(0, 5) || [],
          cited_by_count: paper.cited_by_count || 0,
          biblio: paper.biblio,
          best_oa_location: paper.best_oa_location
        })),
        meta: data.meta
      };
    } catch (error) {
      console.error('OpenAlex search error:', error);
      throw error;
    }
  }

  private reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    if (!invertedIndex) return '';
    
    const words: string[] = [];
    Object.entries(invertedIndex).forEach(([word, positions]) => {
      positions.forEach(pos => {
        words[pos] = word;
      });
    });
    
    return words.filter(Boolean).join(' ');
  }

  async getPaperById(id: string): Promise<OpenAlexPaper | null> {
    try {
      const response = await fetch(`${this.baseUrl}/works/${id}`);
      
      if (!response.ok) {
        return null;
      }

      const paper = await response.json();
      
      return {
        id: paper.id,
        title: paper.title || 'No title available',
        authors: paper.authorships?.map((authorship: any) => ({
          display_name: authorship.author?.display_name || 'Unknown Author',
          id: authorship.author?.id
        })) || [],
        publication_year: paper.publication_year || new Date().getFullYear(),
        publication_date: paper.publication_date || '',
        abstract: paper.abstract_inverted_index ? this.reconstructAbstract(paper.abstract_inverted_index) : undefined,
        primary_location: paper.primary_location,
        host_venue: paper.host_venue,
        open_access: paper.open_access,
        doi: paper.doi,
        concepts: paper.concepts?.slice(0, 5) || [],
        cited_by_count: paper.cited_by_count || 0,
        biblio: paper.biblio,
        best_oa_location: paper.best_oa_location
      };
    } catch (error) {
      console.error('Error fetching paper by ID:', error);
      return null;
    }
  }
}

export const openAlexService = new OpenAlexService();
