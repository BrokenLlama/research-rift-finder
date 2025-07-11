
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

  private buildAdvancedSearchQuery(query: string): string {
    // Clean and normalize the query
    const cleanQuery = query.trim().toLowerCase();
    
    // Split into words and phrases
    const words = cleanQuery.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) return '';
    
    // Build a more sophisticated search query
    const searchParts: string[] = [];
    
    // If it's a single word, search broadly
    if (words.length === 1) {
      const word = words[0];
      searchParts.push(`"${word}"`);
      searchParts.push(`title.search:"${word}"`);
      searchParts.push(`abstract.search:"${word}"`);
    } else {
      // For multiple words, try different combinations
      
      // 1. Exact phrase match (highest priority)
      searchParts.push(`"${cleanQuery}"`);
      
      // 2. All words in title (high priority)
      const titleSearch = words.map(word => `title.search:"${word}"`).join(',');
      searchParts.push(`(${titleSearch})`);
      
      // 3. All words in abstract (medium priority)
      const abstractSearch = words.map(word => `abstract.search:"${word}"`).join(',');
      searchParts.push(`(${abstractSearch})`);
      
      // 4. Individual word matches (lower priority)
      words.forEach(word => {
        if (word.length > 2) { // Only search for words longer than 2 characters
          searchParts.push(`"${word}"`);
        }
      });
    }
    
    // Combine all search parts with OR operator
    return searchParts.join(' OR ');
  }

  async searchPapers(
    query: string,
    page: number = 1,
    perPage: number = 25,
    filters?: OpenAlexFilters
  ): Promise<OpenAlexSearchResponse> {
    try {
      const params = new URLSearchParams();
      
      // Build advanced search query
      const searchQuery = this.buildAdvancedSearchQuery(query);
      console.log('Advanced search query:', searchQuery);
      
      params.append('search', searchQuery);
      params.append('page', page.toString());
      params.append('per_page', perPage.toString());
      
      // Use relevance-based sorting instead of just citation count
      // This will prioritize papers that better match the search terms
      params.append('sort', 'relevance_score:desc');
      
      // Add filters using the filter parameter
      const filterConditions: string[] = [];
      
      // Add author filter
      if (filters?.author && filters.author.trim()) {
        filterConditions.push(`authorships.author.display_name.search:"${filters.author.trim()}"`);
      }
      
      // Add field of study filter
      if (filters?.fieldOfStudy && filters.fieldOfStudy.trim()) {
        filterConditions.push(`concepts.display_name.search:"${filters.fieldOfStudy.trim()}"`);
      }
      
      // Add journal filter
      if (filters?.journal && filters.journal.trim()) {
        filterConditions.push(`primary_location.source.display_name.search:"${filters.journal.trim()}"`);
      }
      
      // Add year range filter
      if (filters?.yearRange?.from || filters?.yearRange?.to) {
        const from = filters.yearRange.from || 1900;
        const to = filters.yearRange.to || new Date().getFullYear();
        filterConditions.push(`publication_year:${from}-${to}`);
      }
      
      // Add PDF availability filter
      if (filters?.hasPdf !== undefined) {
        filterConditions.push(`has_fulltext:${filters.hasPdf}`);
      }
      
      // Add all filter conditions to the filter parameter
      if (filterConditions.length > 0) {
        params.append('filter', filterConditions.join(','));
      }
      
      console.log('OpenAlex API URL:', `${this.baseUrl}/works?${params.toString()}`);
      
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
