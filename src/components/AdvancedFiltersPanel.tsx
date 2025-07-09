
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Filter, X } from 'lucide-react';

interface SearchFilters {
  dateRange: {
    from: string;
    to: string;
  };
  hasPdf: boolean | null;
  authorName: string;
  journal: string;
  fieldOfStudy: string[];
}

interface AdvancedFiltersPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const FIELD_OF_STUDY_OPTIONS = [
  'Computer Science',
  'Physics',
  'Biology',
  'Chemistry',
  'Mathematics',
  'Medicine',
  'Engineering',
  'Psychology',
  'Economics',
  'Sociology',
  'Political Science',
  'Environmental Science',
  'Materials Science',
  'Neuroscience',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Bioinformatics',
  'Climate Science',
  'Public Health'
];

const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  isOpen,
  onOpenChange,
}) => {
  const updateFilters = (updates: Partial<SearchFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: { from: '', to: '' },
      hasPdf: null,
      authorName: '',
      journal: '',
      fieldOfStudy: [],
    });
  };

  const toggleFieldOfStudy = (field: string) => {
    const currentFields = filters.fieldOfStudy;
    const updatedFields = currentFields.includes(field)
      ? currentFields.filter(f => f !== field)
      : [...currentFields, field];
    
    updateFilters({ fieldOfStudy: updatedFields });
  };

  const hasActiveFilters = 
    filters.dateRange.from || 
    filters.dateRange.to || 
    filters.hasPdf !== null || 
    filters.authorName || 
    filters.journal || 
    filters.fieldOfStudy.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Advanced Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              !
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:w-96">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            Advanced Filters
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Publication Date Range</Label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Label htmlFor="from-year" className="text-xs text-gray-500">From</Label>
                <Input
                  id="from-year"
                  type="number"
                  placeholder="2020"
                  value={filters.dateRange.from}
                  onChange={(e) => updateFilters({
                    dateRange: { ...filters.dateRange, from: e.target.value }
                  })}
                  min="1900"
                  max="2024"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="to-year" className="text-xs text-gray-500">To</Label>
                <Input
                  id="to-year"
                  type="number"
                  placeholder="2024"
                  value={filters.dateRange.to}
                  onChange={(e) => updateFilters({
                    dateRange: { ...filters.dateRange, to: e.target.value }
                  })}
                  min="1900"
                  max="2024"
                />
              </div>
            </div>
          </div>

          {/* PDF Availability */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">PDF Availability</Label>
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.hasPdf === true}
                onCheckedChange={(checked) => 
                  updateFilters({ hasPdf: checked ? true : null })
                }
              />
              <Label className="text-sm">Only papers with PDF available</Label>
            </div>
          </div>

          {/* Author Name */}
          <div className="space-y-2">
            <Label htmlFor="author" className="text-sm font-medium">Author Name</Label>
            <Input
              id="author"
              placeholder="e.g., John Smith"
              value={filters.authorName}
              onChange={(e) => updateFilters({ authorName: e.target.value })}
            />
          </div>

          {/* Journal/Conference */}
          <div className="space-y-2">
            <Label htmlFor="journal" className="text-sm font-medium">Journal/Conference</Label>
            <Input
              id="journal"
              placeholder="e.g., Nature, Science"
              value={filters.journal}
              onChange={(e) => updateFilters({ journal: e.target.value })}
            />
          </div>

          {/* Field of Study */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Field of Study</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {FIELD_OF_STUDY_OPTIONS.map((field) => (
                <div key={field} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`field-${field}`}
                    checked={filters.fieldOfStudy.includes(field)}
                    onChange={() => toggleFieldOfStudy(field)}
                    className="rounded border-gray-300"
                  />
                  <Label 
                    htmlFor={`field-${field}`} 
                    className="text-sm cursor-pointer flex-1"
                  >
                    {field}
                  </Label>
                </div>
              ))}
            </div>
            {filters.fieldOfStudy.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {filters.fieldOfStudy.map((field) => (
                  <Badge key={field} variant="secondary" className="text-xs">
                    {field}
                    <button
                      onClick={() => toggleFieldOfStudy(field)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AdvancedFiltersPanel;
