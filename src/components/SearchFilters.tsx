
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

  const handleFieldSelect = (field: string) => {
    if (filters.fieldOfStudy === field) {
      // If same field is clicked, clear it
      updateFilter('fieldOfStudy', undefined);
    } else {
      // Set new field
      updateFilter('fieldOfStudy', field);
    }
  };

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
                Clear All
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
          <div className="space-y-6">
            {/* Field of Study */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Field of Study</Label>
              <div className="flex flex-wrap gap-2">
                {fieldOfStudyOptions.map((field) => (
                  <Button
                    key={field}
                    variant={filters.fieldOfStudy === field ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleFieldSelect(field)}
                    className="text-xs"
                  >
                    {field}
                  </Button>
                ))}
              </div>
            </div>

            {/* Text-based filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author Name */}
              <div>
                <Label htmlFor="author" className="text-sm font-medium">Author Name</Label>
                <Input
                  id="author"
                  placeholder="e.g. John Smith"
                  value={filters.author || ''}
                  onChange={(e) => updateFilter('author', e.target.value || undefined)}
                  className="mt-1"
                />
              </div>

              {/* Journal/Conference */}
              <div>
                <Label htmlFor="journal" className="text-sm font-medium">Journal/Conference</Label>
                <Input
                  id="journal"
                  placeholder="e.g. Nature, Science"
                  value={filters.journal || ''}
                  onChange={(e) => updateFilter('journal', e.target.value || undefined)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Year Range */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Publication Year Range</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="From year"
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
                  className="w-32"
                />
                <span className="text-gray-500">to</span>
                <Input
                  type="number"
                  placeholder="To year"
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
                  className="w-32"
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
              <Label htmlFor="hasPdf" className="text-sm font-medium">Has Full Text PDF</Label>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Active Filters:</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.fieldOfStudy && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Field: {filters.fieldOfStudy}
                    </span>
                  )}
                  {filters.author && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Author: {filters.author}
                    </span>
                  )}
                  {filters.journal && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Journal: {filters.journal}
                    </span>
                  )}
                  {filters.yearRange?.from && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      Year: {filters.yearRange.from}
                      {filters.yearRange.to && ` - ${filters.yearRange.to}`}
                    </span>
                  )}
                  {filters.hasPdf && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      PDF Available
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default SearchFilters;
