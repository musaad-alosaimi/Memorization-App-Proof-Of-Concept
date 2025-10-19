/**
 * Framework-agnostic text alignment library
 * Provides token-level alignment, diff generation, and WER metrics
 */

/**
 * Types of operations in alignment
 */
export enum AlignmentOperation {
  MATCH = 'match',
  SUBSTITUTION = 'substitution',
  INSERTION = 'insertion',
  DELETION = 'deletion'
}

/**
 * A single aligned token pair
 */
export interface AlignedToken {
  /** The reference token (null if insertion) */
  reference: string | null;
  /** The hypothesis token (null if deletion) */
  hypothesis: string | null;
  /** The type of alignment operation */
  operation: AlignmentOperation;
  /** Position in reference text */
  referenceIndex: number | null;
  /** Position in hypothesis text */
  hypothesisIndex: number | null;
  /** Confidence score (0-1) if available */
  confidence?: number;
}

/**
 * Word Error Rate metrics
 */
export interface WERMetrics {
  /** Word Error Rate (0-1, where 0 is perfect) */
  wer: number;
  /** Number of substitutions */
  substitutions: number;
  /** Number of deletions */
  deletions: number;
  /** Number of insertions */
  insertions: number;
  /** Number of correct matches */
  matches: number;
  /** Total words in reference */
  totalReferenceWords: number;
  /** Total words in hypothesis */
  totalHypothesisWords: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
}

/**
 * Complete alignment result
 */
export interface AlignmentResult {
  /** Token-level alignment */
  alignment: AlignedToken[];
  /** WER metrics */
  metrics: WERMetrics;
  /** Human-readable diff string */
  diffString: string;
  /** Reference text */
  reference: string;
  /** Hypothesis/transcript text */
  hypothesis: string;
}

/**
 * Configuration options for text alignment
 */
export interface AlignmentOptions {
  /** Case sensitive comparison (default: false) */
  caseSensitive?: boolean;
  /** Custom tokenizer function (default: whitespace split) */
  tokenizer?: (text: string) => string[];
  /** Custom normalizer function for tokens */
  normalizer?: (token: string) => string;
  /** Include confidence scores if available */
  includeConfidence?: boolean;
}

/**
 * Edit distance matrix cell
 */
export interface EditDistanceCell {
  cost: number;
  operation: AlignmentOperation;
}

