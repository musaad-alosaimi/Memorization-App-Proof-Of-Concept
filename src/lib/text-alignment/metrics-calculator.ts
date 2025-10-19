/**
 * WER (Word Error Rate) metrics calculator
 */

import { AlignedToken, AlignmentOperation, WERMetrics } from './types';

export class MetricsCalculator {
  /**
   * Calculate WER metrics from aligned tokens
   */
  public calculateWER(alignment: AlignedToken[]): WERMetrics {
    let substitutions = 0;
    let deletions = 0;
    let insertions = 0;
    let matches = 0;

    // Count operations
    for (const token of alignment) {
      switch (token.operation) {
        case AlignmentOperation.MATCH:
          matches++;
          break;
        case AlignmentOperation.SUBSTITUTION:
          substitutions++;
          break;
        case AlignmentOperation.DELETION:
          deletions++;
          break;
        case AlignmentOperation.INSERTION:
          insertions++;
          break;
      }
    }

    // Calculate total reference words (matches + substitutions + deletions)
    const totalReferenceWords = matches + substitutions + deletions;
    
    // Calculate total hypothesis words (matches + substitutions + insertions)
    const totalHypothesisWords = matches + substitutions + insertions;

    // WER = (S + D + I) / N where N is total reference words
    const wer = totalReferenceWords > 0
      ? (substitutions + deletions + insertions) / totalReferenceWords
      : 0;

    // Accuracy = (N - S - D - I) / N = matches / totalReferenceWords
    const accuracy = totalReferenceWords > 0
      ? (matches / totalReferenceWords) * 100
      : 0;

    return {
      wer,
      substitutions,
      deletions,
      insertions,
      matches,
      totalReferenceWords,
      totalHypothesisWords,
      accuracy
    };
  }

  /**
   * Calculate Character Error Rate (CER) from aligned tokens
   */
  public calculateCER(alignment: AlignedToken[]): number {
    let totalChars = 0;
    let errorChars = 0;

    for (const token of alignment) {
      if (token.reference) {
        totalChars += token.reference.length;
      }

      if (token.operation !== AlignmentOperation.MATCH) {
        if (token.operation === AlignmentOperation.SUBSTITUTION) {
          const refLen = token.reference?.length || 0;
          const hypLen = token.hypothesis?.length || 0;
          errorChars += Math.max(refLen, hypLen);
        } else if (token.operation === AlignmentOperation.DELETION) {
          errorChars += token.reference?.length || 0;
        } else if (token.operation === AlignmentOperation.INSERTION) {
          errorChars += token.hypothesis?.length || 0;
        }
      }
    }

    return totalChars > 0 ? errorChars / totalChars : 0;
  }

  /**
   * Get detailed statistics from alignment
   */
  public getDetailedStats(alignment: AlignedToken[]): {
    operationCounts: Record<AlignmentOperation, number>;
    averageWordLength: number;
    longestCorrectSequence: number;
    totalErrors: number;
  } {
    const operationCounts: Record<AlignmentOperation, number> = {
      [AlignmentOperation.MATCH]: 0,
      [AlignmentOperation.SUBSTITUTION]: 0,
      [AlignmentOperation.DELETION]: 0,
      [AlignmentOperation.INSERTION]: 0
    };

    let currentCorrectSequence = 0;
    let longestCorrectSequence = 0;
    let totalWordLength = 0;
    let wordCount = 0;

    for (const token of alignment) {
      operationCounts[token.operation]++;

      if (token.operation === AlignmentOperation.MATCH) {
        currentCorrectSequence++;
        longestCorrectSequence = Math.max(longestCorrectSequence, currentCorrectSequence);
      } else {
        currentCorrectSequence = 0;
      }

      if (token.reference) {
        totalWordLength += token.reference.length;
        wordCount++;
      }
    }

    const averageWordLength = wordCount > 0 ? totalWordLength / wordCount : 0;
    const totalErrors = operationCounts[AlignmentOperation.SUBSTITUTION] +
                       operationCounts[AlignmentOperation.DELETION] +
                       operationCounts[AlignmentOperation.INSERTION];

    return {
      operationCounts,
      averageWordLength,
      longestCorrectSequence,
      totalErrors
    };
  }
}

