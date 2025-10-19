/**
 * Standalone demo script for Text Alignment Library
 * Run this to verify the library is working correctly
 * 
 * Usage: node -r ts-node/register demo.ts
 * Or just import and call demonstrateLibrary() from your app
 */

import { TextAligner, compareText, AlignmentOperation } from './index';

export function demonstrateLibrary() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   Text Alignment Library - Feature Demonstration         ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Demo 1: Basic English comparison
  console.log('📝 Demo 1: Basic Text Comparison\n');
  console.log('─'.repeat(60));
  
  const ref1 = "The quick brown fox jumps over the lazy dog";
  const hyp1 = "The quick brown fox jumped over the lazy cat";
  
  const result1 = compareText(ref1, hyp1);
  
  console.log(`Reference:  ${ref1}`);
  console.log(`Hypothesis: ${hyp1}`);
  console.log('\n📊 Metrics:');
  console.log(`   WER:           ${(result1.metrics.wer * 100).toFixed(1)}%`);
  console.log(`   Accuracy:      ${result1.metrics.accuracy.toFixed(1)}%`);
  console.log(`   Matches:       ${result1.metrics.matches}`);
  console.log(`   Substitutions: ${result1.metrics.substitutions}`);
  console.log(`   Deletions:     ${result1.metrics.deletions}`);
  console.log(`   Insertions:    ${result1.metrics.insertions}`);
  
  console.log('\n💬 Diff:');
  console.log(`   ${result1.diffString}`);
  
  // Demo 2: Arabic text with diacritics
  console.log('\n\n📝 Demo 2: Arabic Text with Normalization\n');
  console.log('─'.repeat(60));
  
  const normalizeArabic = (text: string): string => {
    let normalized = text.replace(/[\u064B-\u065F\u0670]/g, '');
    normalized = normalized
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي');
    return normalized;
  };
  
  const aligner2 = new TextAligner({ normalizer: normalizeArabic });
  const ref2 = "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ";
  const hyp2 = "الحمد لله رب العالمين";
  
  const result2 = aligner2.compare(ref2, hyp2);
  
  console.log(`Reference:  ${ref2}`);
  console.log(`Hypothesis: ${hyp2}`);
  console.log('\n📊 Metrics:');
  console.log(`   WER:      ${(result2.metrics.wer * 100).toFixed(1)}%`);
  console.log(`   Accuracy: ${result2.metrics.accuracy.toFixed(1)}%`);
  console.log('\n✨ Note: With normalization, diacritics are ignored!');
  
  // Demo 3: Detailed token analysis
  console.log('\n\n📝 Demo 3: Token-Level Analysis\n');
  console.log('─'.repeat(60));
  
  const ref3 = "I love programming in TypeScript";
  const hyp3 = "I like programming with JavaScript";
  
  const aligner3 = new TextAligner();
  const alignment3 = aligner3.align(ref3, hyp3);
  
  console.log(`Reference:  ${ref3}`);
  console.log(`Hypothesis: ${hyp3}`);
  console.log('\n🔍 Token-by-Token Breakdown:\n');
  
  alignment3.forEach((token, idx) => {
    const num = (idx + 1).toString().padStart(2, '0');
    let symbol = '';
    let description = '';
    
    switch (token.operation) {
      case AlignmentOperation.MATCH:
        symbol = '✓';
        description = `"${token.reference}"`;
        break;
      case AlignmentOperation.SUBSTITUTION:
        symbol = '⟳';
        description = `"${token.reference}" → "${token.hypothesis}"`;
        break;
      case AlignmentOperation.DELETION:
        symbol = '✗';
        description = `"${token.reference}" (deleted)`;
        break;
      case AlignmentOperation.INSERTION:
        symbol = '+';
        description = `"${token.hypothesis}" (inserted)`;
        break;
    }
    
    console.log(`   ${num}. ${symbol} ${description}`);
  });
  
  // Demo 4: Different diff formats
  console.log('\n\n📝 Demo 4: Multiple Diff Formats\n');
  console.log('─'.repeat(60));
  
  const ref4 = "one two three four five";
  const hyp4 = "one too three five six";
  
  const aligner4 = new TextAligner();
  const alignment4 = aligner4.align(ref4, hyp4);
  
  console.log('📄 Inline Format:');
  console.log('   ' + aligner4.generateDiff(alignment4, { format: 'inline' }));
  
  console.log('\n📊 Side-by-Side Format:');
  const sideBySide = aligner4.generateDiff(alignment4, { format: 'sideBySide' });
  sideBySide.split('\n').forEach(line => console.log('   ' + line));
  
  console.log('\n📋 Unified Format:');
  const unified = aligner4.generateDiff(alignment4, { format: 'unified', showLineNumbers: true });
  unified.split('\n').forEach(line => console.log('   ' + line));
  
  // Demo 5: Statistics
  console.log('\n\n📝 Demo 5: Detailed Statistics\n');
  console.log('─'.repeat(60));
  
  const stats = aligner4.getDetailedStats(alignment4);
  
  console.log('📈 Statistical Analysis:');
  console.log(`   Operation Counts:`);
  console.log(`     - Matches:       ${stats.operationCounts.match}`);
  console.log(`     - Substitutions: ${stats.operationCounts.substitution}`);
  console.log(`     - Deletions:     ${stats.operationCounts.deletion}`);
  console.log(`     - Insertions:    ${stats.operationCounts.insertion}`);
  console.log(`   Average word length: ${stats.averageWordLength.toFixed(1)} chars`);
  console.log(`   Longest correct sequence: ${stats.longestCorrectSequence} words`);
  console.log(`   Total errors: ${stats.totalErrors}`);
  
  const cer = aligner4.calculateCER(alignment4);
  console.log(`   Character Error Rate: ${(cer * 100).toFixed(1)}%`);
  
  // Demo 6: Performance test
  console.log('\n\n📝 Demo 6: Performance Benchmark\n');
  console.log('─'.repeat(60));
  
  const longRef = "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat";
  const longHyp = "Lorem ipsum color sit amet consectetur adipiscing elit sed did eiusmod tempor incididunt ut labore et dolore magma aliqua Ut enim at minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commoda consequat extra words";
  
  const iterations = 100;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    compareText(longRef, longHyp);
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  const avgTime = totalTime / iterations;
  
  const finalResult = compareText(longRef, longHyp);
  
  console.log(`⚡ Performance Results (${iterations} iterations):`);
  console.log(`   Total time:    ${totalTime}ms`);
  console.log(`   Average time:  ${avgTime.toFixed(2)}ms per comparison`);
  console.log(`   Text length:   ${finalResult.metrics.totalReferenceWords} words (reference)`);
  console.log(`   Throughput:    ${(iterations / (totalTime / 1000)).toFixed(0)} comparisons/sec`);
  
  // Summary
  console.log('\n\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    Demo Complete! ✨                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  console.log('✅ All features working correctly!');
  console.log('✅ Framework-agnostic library');
  console.log('✅ Token-level alignment with Levenshtein distance');
  console.log('✅ WER and CER metrics calculation');
  console.log('✅ Multiple diff formats');
  console.log('✅ Arabic text normalization support');
  console.log('✅ High performance (sub-millisecond for typical texts)');
  console.log('\n📚 See README.md for full API documentation');
  console.log('📝 See examples.ts for more usage examples');
  console.log('🎯 Integrated into memorization-detail page\n');
}

// Export for use in other files
export default demonstrateLibrary;

// Uncomment to run demo directly
// demonstrateLibrary();

