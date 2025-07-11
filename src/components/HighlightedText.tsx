import React from 'react';

interface HighlightedTextProps {
  text: string;
  searchTerms: string[];
  className?: string;
  maxLength?: number;
}

const HighlightedText: React.FC<HighlightedTextProps> = ({ 
  text, 
  searchTerms, 
  className = "",
  maxLength 
}) => {
  if (!text) return null;

  // Clean and normalize search terms
  const normalizedTerms = searchTerms
    .map(term => term.toLowerCase().trim())
    .filter(term => term.length > 0);

  if (normalizedTerms.length === 0) {
    // If no search terms, just return the text (possibly truncated)
    const displayText = maxLength && text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
    return <span className={className}>{displayText}</span>;
  }

  // Create a regex pattern that matches any of the search terms
  const pattern = new RegExp(`(${normalizedTerms.map(term => 
    term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special characters
  ).join('|')})`, 'gi');

  // Split the text by the pattern
  const parts = text.split(pattern);

  // Process the text with highlighting
  const highlightedParts = parts.map((part, index) => {
    if (!part) return null;
    
    // Check if this part matches any search term (case insensitive)
    const isMatch = normalizedTerms.some(term => 
      part.toLowerCase().includes(term)
    );

    if (isMatch) {
      return (
        <mark 
          key={index} 
          className="bg-yellow-200 text-gray-900 px-1 rounded font-medium"
        >
          {part}
        </mark>
      );
    }

    return part;
  });

  // Apply simple truncation if needed
  let finalText = highlightedParts;
  if (maxLength && text.length > maxLength) {
    // For simplicity, we'll just truncate the original text and then highlight
    const truncatedText = text.substring(0, maxLength) + '...';
    const truncatedParts = truncatedText.split(pattern);
    
    finalText = truncatedParts.map((part, index) => {
      if (!part) return null;
      
      const isMatch = normalizedTerms.some(term => 
        part.toLowerCase().includes(term)
      );

      if (isMatch) {
        return (
          <mark 
            key={index} 
            className="bg-yellow-200 text-gray-900 px-1 rounded font-medium"
          >
            {part}
          </mark>
        );
      }

      return part;
    });
  }

  return <span className={className}>{finalText}</span>;
};

export default HighlightedText; 