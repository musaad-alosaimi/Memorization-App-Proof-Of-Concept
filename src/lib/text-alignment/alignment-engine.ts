/**
 * Core alignment engine using Levenshtein distance algorithm
 */

import {
  AlignmentOperation,
  AlignedToken,
  EditDistanceCell,
  AlignmentOptions
} from './types';

export class AlignmentEngine {
  private options: Required<AlignmentOptions>;

  constructor(options: AlignmentOptions = {}) {
    this.options = {
      caseSensitive: options.caseSensitive ?? false,
      tokenizer: options.tokenizer ?? this.defaultTokenizer,
      normalizer: options.normalizer ?? this.defaultNormalizer,
      includeConfidence: options.includeConfidence ?? false
    };
  }

  /**
   * Default tokenizer - splits on whitespace
   */
  private defaultTokenizer(text: string): string[] {
    return text.trim().split(/\s+/).filter(token => token.length > 0);
  }

  /**
   * Default normalizer - handles case sensitivity
   */
  private defaultNormalizer(token: string): string {
    return this.options.caseSensitive ? token : token.toLowerCase();
  }

  /**
   * Tokenize and normalize text
   */
  private processText(text: string): string[] {
    const tokens = this.options.tokenizer(text);
    return tokens.map(token => this.options.normalizer(token));
  }

  /**
   * Compute edit distance matrix using Wagner-Fischer algorithm
   */
  private computeEditDistance(
    reference: string[],
    hypothesis: string[]
  ): EditDistanceCell[][] {
    const rows = reference.length + 1;
    const cols = hypothesis.length + 1;
    const matrix: EditDistanceCell[][] = [];

    // Initialize matrix
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = { cost: 0, operation: AlignmentOperation.MATCH };
      }
    }

    // Initialize first row (insertions)
    for (let j = 0; j < cols; j++) {
      matrix[0][j] = {
        cost: j,
        operation: AlignmentOperation.INSERTION
      };
    }

    // Initialize first column (deletions)
    for (let i = 0; i < rows; i++) {
      matrix[i][0] = {
        cost: i,
        operation: AlignmentOperation.DELETION
      };
    }

    // Fill the matrix
    for (let i = 1; i < rows; i++) {
      for (let j = 1; j < cols; j++) {
        const refToken = reference[i - 1];
        const hypToken = hypothesis[j - 1];
        const isMatch = refToken === hypToken;

        // Calculate costs for each operation
        const substitutionCost = matrix[i - 1][j - 1].cost + (isMatch ? 0 : 1);
        const deletionCost = matrix[i - 1][j].cost + 1;
        const insertionCost = matrix[i][j - 1].cost + 1;

        // Choose operation with minimum cost
        if (substitutionCost <= deletionCost && substitutionCost <= insertionCost) {
          matrix[i][j] = {
            cost: substitutionCost,
            operation: isMatch ? AlignmentOperation.MATCH : AlignmentOperation.SUBSTITUTION
          };
        } else if (deletionCost < insertionCost) {
          matrix[i][j] = {
            cost: deletionCost,
            operation: AlignmentOperation.DELETION
          };
        } else {
          matrix[i][j] = {
            cost: insertionCost,
            operation: AlignmentOperation.INSERTION
          };
        }
      }
    }

    return matrix;
  }

  /**
   * Backtrack through edit distance matrix to get alignment
   */
  private backtrack(
    matrix: EditDistanceCell[][],
    referenceTokens: string[],
    hypothesisTokens: string[]
  ): AlignedToken[] {
    const alignment: AlignedToken[] = [];
    let i = referenceTokens.length;
    let j = hypothesisTokens.length;

    while (i > 0 || j > 0) {
      const cell = matrix[i][j];

      switch (cell.operation) {
        case AlignmentOperation.MATCH:
        case AlignmentOperation.SUBSTITUTION:
          alignment.unshift({
            reference: referenceTokens[i - 1],
            hypothesis: hypothesisTokens[j - 1],
            operation: cell.operation,
            referenceIndex: i - 1,
            hypothesisIndex: j - 1
          });
          i--;
          j--;
          break;

        case AlignmentOperation.DELETION:
          alignment.unshift({
            reference: referenceTokens[i - 1],
            hypothesis: null,
            operation: AlignmentOperation.DELETION,
            referenceIndex: i - 1,
            hypothesisIndex: null
          });
          i--;
          break;

        case AlignmentOperation.INSERTION:
          alignment.unshift({
            reference: null,
            hypothesis: hypothesisTokens[j - 1],
            operation: AlignmentOperation.INSERTION,
            referenceIndex: null,
            hypothesisIndex: j - 1
          });
          j--;
          break;
      }
    }

    return alignment;
  }

  /**
   * Align reference text with hypothesis text
   */
  public align(referenceText: string, hypothesisText: string): AlignedToken[] {
    const referenceTokens = this.processText(referenceText);
    const hypothesisTokens = this.processText(hypothesisText);

    if (referenceTokens.length === 0 && hypothesisTokens.length === 0) {
      return [];
    }

    const matrix = this.computeEditDistance(referenceTokens, hypothesisTokens);
    return this.backtrack(matrix, referenceTokens, hypothesisTokens);
  }

  /**
   * Get original token (preserving case) from processed token
   */
  public getOriginalToken(
    processedToken: string,
    originalText: string
  ): string {
    const originalTokens = this.options.tokenizer(originalText);
    const processedTokens = originalTokens.map(t => this.options.normalizer(t));
    const index = processedTokens.indexOf(processedToken);
    return index >= 0 ? originalTokens[index] : processedToken;
  }
}

