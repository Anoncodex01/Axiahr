import barredWords from '@/data/barredWords.json';

export interface WordCheckResult {
  hasBarredWords: boolean;
  foundWords: string[];
  warnings: string[];
}

export const checkForBarredWords = (text: string): WordCheckResult => {
  if (!text || text.trim() === '') {
    return {
      hasBarredWords: false,
      foundWords: [],
      warnings: []
    };
  }

  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];
  const warnings: string[] = [];

  // Check for exact matches and partial matches
  barredWords.barredWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    
    // Check for exact word match (with word boundaries)
    const exactMatch = new RegExp(`\\b${lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (exactMatch.test(lowerText)) {
      foundWords.push(word);
      warnings.push(`"${word}" may be discriminatory or inappropriate`);
    }
    
    // Check for partial matches (for phrases)
    if (lowerWord.includes(' ') && lowerText.includes(lowerWord)) {
      if (!foundWords.includes(word)) {
        foundWords.push(word);
        warnings.push(`"${word}" may be discriminatory or inappropriate`);
      }
    }
  });

  return {
    hasBarredWords: foundWords.length > 0,
    foundWords,
    warnings
  };
};

export const highlightBarredWords = (text: string, foundWords: string[]): string => {
  if (foundWords.length === 0) return text;
  
  let highlightedText = text;
  
  foundWords.forEach(word => {
    const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    highlightedText = highlightedText.replace(regex, `<mark class="bg-red-200 text-red-800 px-1 rounded">$&</mark>`);
  });
  
  return highlightedText;
};

export const getWordCheckSummary = (results: WordCheckResult[]): WordCheckResult => {
  const allFoundWords: string[] = [];
  const allWarnings: string[] = [];
  
  results.forEach(result => {
    allFoundWords.push(...result.foundWords);
    allWarnings.push(...result.warnings);
  });
  
  // Remove duplicates
  const uniqueWords = [...new Set(allFoundWords)];
  const uniqueWarnings = [...new Set(allWarnings)];
  
  return {
    hasBarredWords: uniqueWords.length > 0,
    foundWords: uniqueWords,
    warnings: uniqueWarnings
  };
};
