
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { OpenAlexFilters } from '@/services/openAlexService';

interface SearchFiltersProps {
  filters: OpenAlexFilters;
  onFiltersChange: (filters: OpenAlexFilters) => void;
  onClearFilters: () => void;
}

const fieldOfStudyOptions = [
  'Computer Science',
  'Medicine',
  'Biology',
  'Chemistry',
  'Physics',
  'Mathematics',
  'Economics',
  'Psychology',
  'Sociology',
  'Engineering',
  'Business',
  'Political Science',
  'Environmental Science',
  'Materials Science',
  'Neuroscience'
];

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentYear = new Date().getFullYear();

  const updateFilter = (key: keyof OpenAlexFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (typeof value !== 'object' || Object.keys(value).length > 0)
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Advanced Filters
            {hasActiveFilters && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Field of Study */}
            <div>
              <Label htmlFor="fieldOfStudy">Field of Study</Label>
              <Select
                value={filters.fieldOfStudy || ''}
                onValueChange={(value) => updateFilter('fieldOfStudy', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Fields</SelectItem>
                  {fieldOfStudyOptions.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Author Name */}
            <div>
              <Label htmlFor="author">Author Name</Label>
              <Input
                id="author"
                placeholder="e.g. John Smith"
                value={filters.author || ''}
                onChange={(e) => updateFilter('author', e.target.value || undefined)}
              />
            </div>

            {/* Journal/Conference */}
            <div>
              <Label htmlFor="journal">Journal/Conference</Label>
              <Input
                id="journal"
                placeholder="e.g. Nature, Science"
                value={filters.journal || ''}
                onChange={(e) => updateFilter('journal', e.target.value || undefined)}
              />
            </div>

            {/* Year Range */}
            <div className="md:col-span-2">
              <Label>Publication Year Range</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input
                  type="number"
                  placeholder="From"
                  min="1900"
                  max={currentYear}
                  value={filters.yearRange?.from || ''}
                  onChange={(e) => {
                    const from = parseInt(e.target.value);
                    updateFilter('yearRange', {
                      ...filters.yearRange,
                      from: isNaN(from) ? undefined : from
                    });
                  }}
                  className="w-24"
                />
                <span>to</span>
                <Input
                  type="number"
                  placeholder="To"
                  min="1900"
                  max={currentYear}
                  value={filters.yearRange?.to || ''}
                  onChange={(e) => {
                    const to = parseInt(e.target.value);
                    updateFilter('yearRange', {
                      ...filters.yearRange,
                      to: isNaN(to) ? undefined : to
                    });
                  }}
                  className="w-24"
                />
              </div>
            </div>

            {/* PDF Availability */}
            <div className="flex items-center space-x-2">
              <Switch
                id="hasPdf"
                checked={filters.hasPdf === true}
                onCheckedChange={(checked) => updateFilter('hasPdf', checked ? true : undefined)}
              />
              <Label htmlFor="hasPdf">Has Full Text PDF</Label>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SearchFilters;
