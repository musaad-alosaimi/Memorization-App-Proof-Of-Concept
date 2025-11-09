/**
 * String normalization utilities for recitation matching
 */

/**
 * Normalize a string for similarity comparison
 * - Unicode NFKD normalization
 * - Strip combining marks (diacritics)
 * - Convert to lowercase
 * - Remove punctuation and symbols
 * - Collapse whitespace
 */
export function normalizeForMatch(s: string): string {
  // Unicode NFKD normalization (decomposes characters)
  const nfkd = s.normalize('NFKD');
  
  // Remove combining marks (diacritics) - covers Arabic and other scripts
  // \u0300-\u036F: Combining Diacritical Marks
  // \u064B-\u065F: Arabic diacritics (Tanwin, Fatha, Damma, Kasra, Shadda, Sukun, etc.)
  // \u0670: Arabic Superscript Alef
  // \u0640: Arabic Tatweel (kashida)
  const stripped = nfkd.replace(/[\u0300-\u036f\u064B-\u065F\u0670\u0640]/g, '');
  
  // Convert to lowercase
  const lower = stripped.toLowerCase();
  
  // Remove punctuation and symbols, replace with space
  // \p{P}: Punctuation
  // \p{S}: Symbols
  const noPunct = lower.replace(/[\p{P}\p{S}]+/gu, ' ');
  
  // Collapse multiple whitespace to single space and trim
  return noPunct.replace(/\s+/g, ' ').trim();
}

/**
 * Tokenize original text into word-like tokens
 * Matches sequences of letters (with optional marks) and digits
 * Preserves the original token array for exact reveal text reconstruction
 */
export function tokenizeOriginal(text: string): string[] {
  // Match word-like sequences:
  // \p{L}+: One or more letters (any script)
  // \p{M}*: Zero or more marks (diacritics, etc.)
  // \p{Nd}+: One or more decimal digits
  const matches = text.match(/[\p{L}\p{M}]+|\p{Nd}+/gu);
  return matches ?? [];
}

/**
 * Locale-specific normalization hook for Arabic
 * Can be extended for other languages
 */
export function normalizeArabic(text: string): string {
  let normalized = normalizeForMatch(text);
  
  // Additional Arabic-specific normalizations
  normalized = normalized
    .replace(/[آأإٱ]/g, 'ا')      // Normalize alef variants
    .replace(/ة/g, 'ه')          // Normalize ta marbuta
    .replace(/ى/g, 'ي')          // Normalize alef maksura
    .replace(/ؤ/g, 'و')          // Normalize hamza on waw
    .replace(/ئ/g, 'ي');         // Normalize hamza on ya
  
  return normalized;
}

