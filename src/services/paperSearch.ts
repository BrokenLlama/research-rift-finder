
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
  authors: Array<{ display_name: string }>;
  publication_year: number;
  journal?: string;
  abstract?: string;
  external_id: string;
  source: 'openalex' | 'semantic_scholar';
}

export interface SearchResponse {
  results: PaperResult[];
  nextCursor?: string;
  hasMore: boolean;
  total?: number;
}

// OpenAlex API Service
export class OpenAlexService {
  private baseUrl = 'https://api.openalex.org';

  async search(
    query: string = '',
    cursor?: string,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      
      if (query.trim()) {
        params.append('search', query);
      }
      
      if (cursor) {
        params.append('cursor', cursor);
      } else {
        params.append('page', '1');
      }
      
      params.append('per_page', '25');
      params.append('select', 'id,title,authorships,publication_year,primary_location,abstract_inverted_index');
      
      // Apply filters
      const filterParts: string[] = [];
      
      if (filters?.yearRange) {
        filterParts.push(`publication_year:${filters.yearRange.from}-${filters.yearRange.to}`);
      }
      
      if (filters?.author) {
        filterParts.push(`author.display_name.search:${encodeURIComponent(filters.author)}`);
      }
      
      if (filters?.fieldOfStudy) {
        filterParts.push(`concepts.display_name.search:${encodeURIComponent(filters.fieldOfStudy)}`);
      }
      
      if (filterParts.length > 0) {
        params.append('filter', filterParts.join(','));
      }
      
      // Sort by relevance or date
      if (!query.trim()) {
        params.append('sort', 'publication_date:desc');
      }

      const response = await fetch(`${this.baseUrl}/works?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch from OpenAlex');
      }

      const data = await response.json();
      
      return {
        results: data.results.map((paper: any) => ({
          id: paper.id,
          title: paper.title || 'No title available',
          authors: paper.authorships?.map((auth: any) => ({ 
            display_name: auth.author?.display_name || 'Unknown Author' 
          })) || [],
          publication_year: paper.publication_year || new Date().getFullYear(),
          journal: paper.primary_location?.source?.display_name || 'Unknown Journal',
          abstract: paper.abstract_inverted_index ? this.reconstructAbstract(paper.abstract_inverted_index) : undefined,
          external_id: paper.id,
          source: 'openalex' as const
        })),
        nextCursor: data.meta?.next_cursor,
        hasMore: !!data.meta?.next_cursor,
        total: data.meta?.count
      };
    } catch (error) {
      console.error('OpenAlex search error:', error);
      throw error;
    }
  }

  private reconstructAbstract(invertedIndex: any): string {
    if (!invertedIndex) return '';
    
    const words: string[] = [];
    Object.entries(invertedIndex).forEach(([word, positions]: [string, any]) => {
      if (Array.isArray(positions)) {
        positions.forEach((pos: number) => {
          words[pos] = word;
        });
      }
    });
    
    return words.filter(Boolean).join(' ');
  }
}

// Semantic Scholar API Service
export class SemanticScholarService {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1';

  async search(
    query: string,
    offset: number = 0,
    filters?: SearchFilters
  ): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      params.append('query', query);
      params.append('offset', offset.toString());
      params.append('limit', '25');
      params.append('fields', 'paperId,title,authors,year,journal,abstract');
      
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
          id: paper.paperId,
          title: paper.title || 'No title available',
          authors: paper.authors?.map((author: any) => ({ 
            display_name: author.name || 'Unknown Author' 
          })) || [],
          publication_year: paper.year || new Date().getFullYear(),
          journal: paper.journal?.name || 'Unknown Journal',
          abstract: paper.abstract || undefined,
          external_id: paper.paperId,
          source: 'semantic_scholar' as const
        })),
        nextCursor: (offset + 25).toString(),
        hasMore: (data.data || []).length === 25,
        total: data.total
      };
    } catch (error) {
      console.error('Semantic Scholar search error:', error);
      throw error;
    }
  }
}

export const openAlexService = new OpenAlexService();
export const semanticScholarService = new SemanticScholarService();
