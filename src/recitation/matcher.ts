/**
 * Recitation matching algorithm
 * Matches transcribed words against original text for recitation practice
 */

import { normalizeForMatch, tokenizeOriginal, normalizeArabic } from './normalize';
import { similarity } from './damerau';

export type Match = {
  transcriptIndex: number;         // index of transcribed token matched
  originalStart: number;           // index in original tokens where span starts
  originalSpan: number;            // 1, 2, or 3
  revealedText: string;            // original text slice exactly as in source
  similarity: number;              // chosen candidate similarity
};

export type MatchResult = {
  matches: Match[];
  revealedTokenMask: boolean[];    // length = originalTokens.length; true if revealed
  unrevealedOriginal: string[];    // original tokens that remain unrevealed (for UI)
  unmatchedTranscriptIndices: number[]; // transcript tokens that didn't match
  finalOriginalPointer: number;    // where matching stopped in original
};

/**
 * Match transcribed tokens against original text for recitation practice
 * 
 * @param originalText - The original/correct text to match against
 * @param transcriptTokens - Array of transcribed words from ASR (already split)
 * @param threshold - Similarity threshold (default 0.70)
 * @param useArabicNormalization - Whether to use Arabic-specific normalization (default true)
 * @returns MatchResult with matches, revealed tokens, and statistics
 */
export function matchRecitation(
  originalText: string,
  transcriptTokens: string[],
  threshold = 0.70,
  useArabicNormalization = true
): MatchResult {
  // Tokenize original text
  const originalTokens = tokenizeOriginal(originalText);
  
  // Initialize result structures
  const revealedMask = Array(originalTokens.length).fill(false);
  const matches: Match[] = [];
  const unmatched: number[] = [];
  
  // Pointer for next original token to match against (never decrements)
  let j = 0;
  
  // Normalize original tokens once (for efficiency)
  const normalizeFn = useArabicNormalization ? normalizeArabic : normalizeForMatch;
  const normOriginalTokens = originalTokens.map(normalizeFn);
  
  // Process each transcript token
  for (let i = 0; i < transcriptTokens.length; i++) {
    // If we've exhausted the original text, mark remaining transcript tokens as unmatched
    if (j >= originalTokens.length) {
      unmatched.push(i);
      continue;
    }
    
    // Normalize transcript token
    const tRaw = transcriptTokens[i];
    const t = normalizeFn(tRaw);
    
    // Build candidates: single word (A), bigram (B), trigram (C)
    const candidates: { span: number; textRaw: string; textNorm: string }[] = [];
    
    for (let span = 1; span <= 3; span++) {
      // Check bounds
      if (j + span - 1 >= originalTokens.length) break;
      
      // Get raw slice (for reveal text) and normalized slice (for comparison)
      const rawSlice = originalTokens.slice(j, j + span).join(' ');
      const normSlice = normOriginalTokens.slice(j, j + span).join(' ');
      
      candidates.push({ span, textRaw: rawSlice, textNorm: normSlice });
    }
    
    // Score each candidate and find the best match
    let best = { span: 0, sim: -1, textRaw: '', textNorm: '' };
    
    for (const candidate of candidates) {
      const sim = similarity(t, candidate.textNorm);
      if (sim > best.sim) {
        best = { span: candidate.span, sim, textRaw: candidate.textRaw, textNorm: candidate.textNorm };
      }
    }
    
    // Debug logging for matching attempts
    console.log(`\n[Token ${i}] Trying to match: "${tRaw}" (normalized: "${t}")`);
    console.log(`  Against original token ${j}: "${originalTokens[j]}" (normalized: "${normOriginalTokens[j]}")`);
    console.log(`  Best candidate: "${best.textRaw}" (normalized: "${best.textNorm}")`);
    console.log(`  Similarity: ${best.sim.toFixed(4)} / Threshold: ${threshold}`);
    
    // If best similarity meets threshold, reveal the span
    if (best.sim >= threshold && best.span > 0) {
      console.log(`  ✓ MATCH! Revealing ${best.span} token(s)`);
      
      // Mark tokens as revealed
      for (let k = 0; k < best.span; k++) {
        revealedMask[j + k] = true;
      }
      
      // Record the match
      matches.push({
        transcriptIndex: i,
        originalStart: j,
        originalSpan: best.span,
        revealedText: best.textRaw,
        similarity: Number(best.sim.toFixed(4)),
      });
      
      // Advance pointer only on successful match
      j += best.span;
    } else {
      console.log(`  ✗ NO MATCH (below threshold or invalid)`);
      // No match found - record as unmatched but don't advance pointer
      unmatched.push(i);
    }
  }
  
  // Build list of unrevealed original tokens
  const unrevealedOriginal = originalTokens.filter((_, idx) => !revealedMask[idx]);
  
  return {
    matches,
    revealedTokenMask: revealedMask,
    unrevealedOriginal,
    unmatchedTranscriptIndices: unmatched,
    finalOriginalPointer: j,
  };
}

