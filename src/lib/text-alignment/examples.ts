/**
 * Example usage of the Text Alignment Library
 * This file demonstrates various use cases
 */

import { TextAligner, compareText, AlignmentOperation } from './index';

// ============================================================================
// EXAMPLE 1: Basic Text Comparison
// ============================================================================

export function basicComparison() {
  console.log('=== Example 1: Basic Text Comparison ===\n');

  const reference = "The quick brown fox jumps over the lazy dog";
  const hypothesis = "The quick brown fox jumped over the lazy cat";

  const result = compareText(reference, hypothesis);

  console.log('Reference:', result.reference);
  console.log('Hypothesis:', result.hypothesis);
  console.log('\nMetrics:');
  console.log(`  WER: ${result.metrics.wer.toFixed(3)}`);
  console.log(`  Accuracy: ${result.metrics.accuracy.toFixed(1)}%`);
  console.log(`  Matches: ${result.metrics.matches}`);
  console.log(`  Substitutions: ${result.metrics.substitutions}`);
  console.log(`  Deletions: ${result.metrics.deletions}`);
  console.log(`  Insertions: ${result.metrics.insertions}`);
  console.log('\nDiff:');
  console.log(result.diffString);
  console.log('\n');
}

// ============================================================================
// EXAMPLE 2: Arabic Text with Diacritics
// ============================================================================

export function arabicTextComparison() {
  console.log('=== Example 2: Arabic Text with Diacritics ===\n');

  // Custom normalizer for Arabic text
  const normalizeArabic = (text: string): string => {
    // Remove diacritics
    let normalized = text.replace(/[\u064B-\u065F\u0670]/g, '');
    // Normalize alef variants
    normalized = normalized.replace(/[آأإٱ]/g, 'ا');
    // Normalize ta marbuta
    normalized = normalized.replace(/ة/g, 'ه');
    // Normalize ya
    normalized = normalized.replace(/ى/g, 'ي');
    return normalized;
  };

  const aligner = new TextAligner({
    normalizer: normalizeArabic,
    caseSensitive: false
  });

  const reference = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
  const hypothesis = "بسم الله الرحمن الرحيم";

  const result = aligner.compare(reference, hypothesis);

  console.log('Reference:', result.reference);
  console.log('Hypothesis:', result.hypothesis);
  console.log('\nMetrics:');
  console.log(`  WER: ${result.metrics.wer.toFixed(3)}`);
  console.log(`  Accuracy: ${result.metrics.accuracy.toFixed(1)}%`);
  console.log('\nNote: With normalization, diacritics are ignored!\n');
}

// ============================================================================
// EXAMPLE 3: Detailed Token-Level Analysis
// ============================================================================

export function detailedAnalysis() {
  console.log('=== Example 3: Detailed Token-Level Analysis ===\n');

  const reference = "I like to eat apples and bananas";
  const hypothesis = "I love to eat oranges and bananas";

  const aligner = new TextAligner();
  const alignment = aligner.align(reference, hypothesis);

  console.log('Token-by-Token Analysis:\n');
  
  alignment.forEach((token, index) => {
    const prefix = `Token ${index + 1}:`;
    
    switch (token.operation) {
      case AlignmentOperation.MATCH:
        console.log(`${prefix} ✓ MATCH - "${token.reference}"`);
        break;
      case AlignmentOperation.SUBSTITUTION:
        console.log(`${prefix} ⟳ SUBSTITUTION - "${token.reference}" → "${token.hypothesis}"`);
        break;
      case AlignmentOperation.DELETION:
        console.log(`${prefix} ✗ DELETION - "${token.reference}" was removed`);
        break;
      case AlignmentOperation.INSERTION:
        console.log(`${prefix} + INSERTION - "${token.hypothesis}" was added`);
        break;
    }
  });

  const metrics = aligner.calculateMetrics(alignment);
  console.log('\nSummary:');
  console.log(`  Total tokens: ${alignment.length}`);
  console.log(`  Accuracy: ${metrics.accuracy.toFixed(1)}%`);
  console.log('\n');
}

// ============================================================================
// EXAMPLE 4: Different Diff Formats
// ============================================================================

export function diffFormats() {
  console.log('=== Example 4: Different Diff Formats ===\n');

  const reference = "one two three four five";
  const hypothesis = "one too three five six";

  const aligner = new TextAligner();
  const alignment = aligner.align(reference, hypothesis);

  console.log('Inline Format:');
  console.log(aligner.generateDiff(alignment, { format: 'inline' }));
  console.log('\n');

  console.log('Side-by-Side Format:');
  console.log(aligner.generateDiff(alignment, { format: 'sideBySide' }));
  console.log('\n');

  console.log('Unified Format:');
  console.log(aligner.generateDiff(alignment, { format: 'unified', showLineNumbers: true }));
  console.log('\n');
}

// ============================================================================
// EXAMPLE 5: Performance Test
// ============================================================================

export function performanceTest() {
  console.log('=== Example 5: Performance Test ===\n');

  const reference = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua".split(' ');
  const hypothesis = "Lorem ipsum color sit amet consectetur adipiscing elit sed did eiusmod tempor incididunt ut labore et dolore magma aliqua plus extra".split(' ');

  const refText = reference.join(' ');
  const hypText = hypothesis.join(' ');

  const startTime = performance.now();
  const result = compareText(refText, hypText);
  const endTime = performance.now();

  console.log(`Reference length: ${result.metrics.totalReferenceWords} words`);
  console.log(`Hypothesis length: ${result.metrics.totalHypothesisWords} words`);
  console.log(`Time taken: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`Accuracy: ${result.metrics.accuracy.toFixed(1)}%`);
  console.log(`WER: ${result.metrics.wer.toFixed(3)}`);
  console.log('\n');
}

// ============================================================================
// EXAMPLE 6: Character-Level Alignment
// ============================================================================

export function characterLevelAlignment() {
  console.log('=== Example 6: Character-Level Alignment ===\n');

  const charTokenizer = (text: string) => text.split('');

  const aligner = new TextAligner({
    tokenizer: charTokenizer,
    caseSensitive: true
  });

  const reference = "hello";
  const hypothesis = "hallo";

  const result = aligner.compare(reference, hypothesis);

  console.log('Reference:', result.reference);
  console.log('Hypothesis:', result.hypothesis);
  console.log('\nCharacter-level metrics:');
  console.log(`  CER (Character Error Rate): ${aligner.calculateCER(result.alignment).toFixed(3)}`);
  console.log(`  Accuracy: ${result.metrics.accuracy.toFixed(1)}%`);
  console.log('\nDiff:');
  console.log(result.diffString);
  console.log('\n');
}

// ============================================================================
// EXAMPLE 7: Statistical Analysis
// ============================================================================

export function statisticalAnalysis() {
  console.log('=== Example 7: Statistical Analysis ===\n');

  const reference = "The weather today is sunny and warm with clear blue skies";
  const hypothesis = "The whether today is sunny and hot with clear skyes";

  const aligner = new TextAligner();
  const alignment = aligner.align(reference, hypothesis);
  const stats = aligner.getDetailedStats(alignment);

  console.log('Detailed Statistics:');
  console.log('  Operation counts:');
  console.log(`    Matches: ${stats.operationCounts.match}`);
  console.log(`    Substitutions: ${stats.operationCounts.substitution}`);
  console.log(`    Deletions: ${stats.operationCounts.deletion}`);
  console.log(`    Insertions: ${stats.operationCounts.insertion}`);
  console.log(`  Average word length: ${stats.averageWordLength.toFixed(1)} characters`);
  console.log(`  Longest correct sequence: ${stats.longestCorrectSequence} words`);
  console.log(`  Total errors: ${stats.totalErrors}`);
  
  console.log('\n' + aligner.generateSummary(alignment));
  console.log('\n');
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

export function runAllExamples() {
  basicComparison();
  arabicTextComparison();
  detailedAnalysis();
  diffFormats();
  performanceTest();
  characterLevelAlignment();
  statisticalAnalysis();
}

// Uncomment to run examples:
// runAllExamples();

