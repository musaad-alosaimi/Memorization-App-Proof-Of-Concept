/**
 * Damerau-Levenshtein distance algorithm
 * Optimal String Alignment (restricted Damerau-Levenshtein)
 */

/**
 * Calculate Damerau-Levenshtein distance between two strings
 * This is the restricted version (optimal string alignment)
 * which allows transposition of adjacent characters
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  
  // Early exits
  if (al === 0) return bl;
  if (bl === 0) return al;
  if (a === b) return 0;
  
  // Create DP table
  const dp: number[][] = Array.from({ length: al + 1 }, (_, i) =>
    Array(bl + 1).fill(0)
  );
  
  // Initialize first row and column
  for (let i = 0; i <= al; i++) dp[i][0] = i;
  for (let j = 0; j <= bl; j++) dp[0][j] = j;
  
  // Fill the DP table
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      
      // Standard Levenshtein operations
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // deletion
        dp[i][j - 1] + 1,        // insertion
        dp[i - 1][j - 1] + cost  // substitution
      );
      
      // Damerau extension: transposition of adjacent characters
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  
  return dp[al][bl];
}

/**
 * Calculate similarity score from Damerau-Levenshtein distance
 * Returns a value between 0 and 1, where 1 is an exact match
 */
export function similarity(a: string, b: string): number {
  if (a.length === 0 && b.length === 0) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;
  
  const dist = damerauLevenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  
  // Convert distance to similarity: sim = 1 - (distance / max_length)
  return Math.max(0, 1 - dist / maxLen);
}

