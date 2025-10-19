# Text Alignment Library

A framework-agnostic TypeScript library for comparing spoken transcripts to reference text. Provides token-level alignment using the Levenshtein distance algorithm, Word Error Rate (WER) metrics, and human-readable diffs.

## Features

- ✅ **Token-level alignment** using Wagner-Fischer edit distance algorithm
- ✅ **WER (Word Error Rate)** calculation with detailed metrics
- ✅ **Human-readable diffs** in multiple formats (inline, side-by-side, unified)
- ✅ **Framework-agnostic** - works with any JavaScript/TypeScript framework
- ✅ **Customizable** tokenizers and normalizers
- ✅ **TypeScript** first with complete type definitions
- ✅ **Zero dependencies**

## Installation

Since this is a local library, you can import it directly:

```typescript
import { TextAligner, compareText } from '@/lib/text-alignment';
```

## Quick Start

### Basic Usage

```typescript
import { compareText } from '@/lib/text-alignment';

const reference = "The quick brown fox jumps over the lazy dog";
const hypothesis = "The quick brown fox jumped over the lazy cat";

const result = compareText(reference, hypothesis);

console.log(`WER: ${result.metrics.wer.toFixed(2)}`);
console.log(`Accuracy: ${result.metrics.accuracy.toFixed(1)}%`);
console.log(`Substitutions: ${result.metrics.substitutions}`);
console.log(`Deletions: ${result.metrics.deletions}`);
console.log(`Insertions: ${result.metrics.insertions}`);
console.log(`\nDiff:\n${result.diffString}`);
```

### Advanced Usage with Custom Normalizer

```typescript
import { TextAligner } from '@/lib/text-alignment';

// Custom Arabic text normalizer
const normalizeArabic = (text: string): string => {
  // Remove diacritics
  let normalized = text.replace(/[\u064B-\u065F\u0670]/g, '');
  // Normalize alef variants
  normalized = normalized.replace(/[آأإٱ]/g, 'ا');
  // Normalize ta marbuta
  normalized = normalized.replace(/ة/g, 'ه');
  return normalized.toLowerCase();
};

const aligner = new TextAligner({
  normalizer: normalizeArabic,
  caseSensitive: false
});

const reference = "السَّلَامُ عَلَيْكُمْ";
const hypothesis = "السلام عليكم";

const result = aligner.compare(reference, hypothesis);
```

### Using Different Diff Formats

```typescript
import { TextAligner } from '@/lib/text-alignment';

const aligner = new TextAligner();
const alignment = aligner.align(reference, hypothesis);

// Inline format (default)
const inlineDiff = aligner.generateDiff(alignment, { format: 'inline' });

// Side-by-side format
const sideBySideDiff = aligner.generateDiff(alignment, { format: 'sideBySide' });

// Unified format (like git diff)
const unifiedDiff = aligner.generateDiff(alignment, { 
  format: 'unified',
  showLineNumbers: true 
});

// With HTML markup
const htmlDiff = aligner.generateDiff(alignment, { 
  format: 'inline',
  useHtml: true 
});

// With ANSI colors for terminal
const coloredDiff = aligner.generateDiff(alignment, { 
  format: 'inline',
  useColors: true 
});
```

## API Reference

### TextAligner Class

Main entry point for the library.

```typescript
class TextAligner {
  constructor(options?: AlignmentOptions);
  
  // Compare reference with hypothesis and get complete result
  compare(referenceText: string, hypothesisText: string): AlignmentResult;
  
  // Get only alignment
  align(referenceText: string, hypothesisText: string): AlignedToken[];
  
  // Calculate metrics from existing alignment
  calculateMetrics(alignment: AlignedToken[]): WERMetrics;
  
  // Generate diff from existing alignment
  generateDiff(alignment: AlignedToken[], options?: DiffOptions): string;
  
  // Get detailed statistics
  getDetailedStats(alignment: AlignedToken[]): DetailedStats;
  
  // Calculate Character Error Rate
  calculateCER(alignment: AlignedToken[]): number;
  
  // Generate summary string
  generateSummary(alignment: AlignedToken[]): string;
}
```

### Types

#### AlignmentOptions

```typescript
interface AlignmentOptions {
  caseSensitive?: boolean;                        // Default: false
  tokenizer?: (text: string) => string[];         // Default: whitespace split
  normalizer?: (token: string) => string;         // Default: toLowerCase
  includeConfidence?: boolean;                    // Default: false
}
```

#### AlignmentResult

```typescript
interface AlignmentResult {
  alignment: AlignedToken[];      // Token-level alignment
  metrics: WERMetrics;            // WER metrics
  diffString: string;             // Human-readable diff
  reference: string;              // Original reference text
  hypothesis: string;             // Original hypothesis text
}
```

#### AlignedToken

```typescript
interface AlignedToken {
  reference: string | null;           // Reference token (null if insertion)
  hypothesis: string | null;          // Hypothesis token (null if deletion)
  operation: AlignmentOperation;      // Type of operation
  referenceIndex: number | null;      // Position in reference
  hypothesisIndex: number | null;     // Position in hypothesis
  confidence?: number;                // Confidence score (0-1)
}
```

#### AlignmentOperation

```typescript
enum AlignmentOperation {
  MATCH = 'match',              // Tokens match exactly
  SUBSTITUTION = 'substitution', // Token was replaced
  INSERTION = 'insertion',       // Token was added
  DELETION = 'deletion'          // Token was removed
}
```

#### WERMetrics

```typescript
interface WERMetrics {
  wer: number;                    // Word Error Rate (0-1)
  substitutions: number;          // Number of substitutions
  deletions: number;              // Number of deletions
  insertions: number;             // Number of insertions
  matches: number;                // Number of correct matches
  totalReferenceWords: number;    // Total words in reference
  totalHypothesisWords: number;   // Total words in hypothesis
  accuracy: number;               // Accuracy percentage (0-100)
}
```

#### DiffOptions

```typescript
interface DiffOptions {
  useColors?: boolean;              // Use ANSI colors (default: false)
  useHtml?: boolean;                // Use HTML markup (default: false)
  showLineNumbers?: boolean;        // Show line numbers (default: false)
  format?: 'inline' | 'sideBySide' | 'unified';  // Format style (default: 'inline')
}
```

## Examples

### Example 1: English Text Comparison

```typescript
const reference = "Hello world how are you";
const hypothesis = "Hello world haw ar you";

const result = compareText(reference, hypothesis);

console.log(result.metrics);
// Output:
// {
//   wer: 0.4,
//   substitutions: 2,
//   deletions: 0,
//   insertions: 0,
//   matches: 3,
//   totalReferenceWords: 5,
//   totalHypothesisWords: 5,
//   accuracy: 60
// }
```

### Example 2: Arabic Text with Diacritics

```typescript
const normalizeArabic = (text: string): string => {
  return text.replace(/[\u064B-\u065F\u0670]/g, '').toLowerCase();
};

const aligner = new TextAligner({ normalizer: normalizeArabic });

const reference = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
const hypothesis = "بسم الله الرحمن الرحيم";

const result = aligner.compare(reference, hypothesis);
console.log(`Accuracy: ${result.metrics.accuracy}%`); // 100%
```

### Example 3: Custom Tokenizer (Character-level)

```typescript
const charTokenizer = (text: string) => text.split('');

const aligner = new TextAligner({ tokenizer: charTokenizer });

const reference = "cat";
const hypothesis = "car";

const result = aligner.compare(reference, hypothesis);
// This will perform character-level alignment
```

### Example 4: Detailed Analysis

```typescript
const aligner = new TextAligner();
const alignment = aligner.align(reference, hypothesis);

// Get detailed statistics
const stats = aligner.getDetailedStats(alignment);
console.log(stats);
// Output:
// {
//   operationCounts: { match: 5, substitution: 2, deletion: 1, insertion: 0 },
//   averageWordLength: 4.5,
//   longestCorrectSequence: 3,
//   totalErrors: 3
// }

// Get Character Error Rate
const cer = aligner.calculateCER(alignment);
console.log(`CER: ${cer.toFixed(2)}`);

// Generate summary
const summary = aligner.generateSummary(alignment);
console.log(summary);
```

## Algorithm

The library uses the **Wagner-Fischer algorithm** (a dynamic programming approach to computing Levenshtein distance) for token-level alignment:

1. Builds an edit distance matrix comparing reference and hypothesis tokens
2. Backtracks through the matrix to find the optimal alignment
3. Classifies each alignment as Match, Substitution, Deletion, or Insertion

### WER Calculation

Word Error Rate is calculated as:

```
WER = (S + D + I) / N

Where:
  S = Number of substitutions
  D = Number of deletions
  I = Number of insertions
  N = Total number of words in reference
```

## Use Cases

- **Speech Recognition Evaluation**: Compare ASR output with ground truth
- **Language Learning Apps**: Assess pronunciation and memorization accuracy
- **Transcription Quality Control**: Evaluate transcription accuracy
- **Voice Commands**: Validate voice command recognition
- **Dictation Software**: Measure dictation accuracy

## Performance

- **Time Complexity**: O(m × n) where m and n are the number of tokens
- **Space Complexity**: O(m × n) for the edit distance matrix
- Suitable for texts with up to ~10,000 tokens without performance issues

## Integration with Ionic

See the `TextAlignmentViewerComponent` for an example of integrating this library into an Ionic Angular application. The component provides:

- Visual token-level alignment display
- Color-coded operation types
- WER metrics display
- Responsive design for mobile devices

## Contributing

This is a standalone library. To extend it:

1. Add new features to the appropriate module
2. Update types in `types.ts`
3. Add tests for new functionality
4. Update this README

## License

Part of the Hadith Memorization App. For internal use.

