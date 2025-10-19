/**
 * Text Alignment Library
 * 
 * Framework-agnostic library for comparing spoken transcripts to reference text.
 * Provides token-level alignment, WER metrics, and human-readable diffs.
 * 
 * @example
 * ```typescript
 * import { TextAligner, compareText } from './lib/text-alignment';
 * 
 * const reference = "The quick brown fox jumps over the lazy dog";
 * const hypothesis = "The quick brown fox jumped over the lazy cat";
 * 
 * const result = compareText(reference, hypothesis);
 * 
 * console.log(`WER: ${result.metrics.wer}`);
 * console.log(`Accuracy: ${result.metrics.accuracy}%`);
 * console.log(result.diffString);
 * ```
 */

// Main API
export { TextAligner, compareText } from './text-aligner';

// Core components
export { AlignmentEngine } from './alignment-engine';
export { MetricsCalculator } from './metrics-calculator';
export { DiffGenerator } from './diff-generator';

// Types
export {
  AlignmentOperation,
  AlignedToken,
  WERMetrics,
  AlignmentResult,
  AlignmentOptions,
  EditDistanceCell
} from './types';

export type { DiffOptions } from './diff-generator';

