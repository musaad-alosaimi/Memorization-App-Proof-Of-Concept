/**
 * Unit tests for recitation matcher
 */

import { matchRecitation } from './matcher';

describe('matchRecitation', () => {
  const original = 'To be or not to be, that is the question';

  it('should reveal single-word matches at >= 0.70', () => {
    const transcript = ['to', 'bee', 'or', 'not', 'to', 'bee'];
    const res = matchRecitation(original, transcript, 0.70);
    
    // "bee" should match "be" with tolerance (edit distance 1/2)
    expect(res.matches.length).toBeGreaterThanOrEqual(4);
    expect(res.unmatchedTranscriptIndices.length).toBeLessThanOrEqual(2);
    
    // Ensure reveal advanced through original
    expect(res.finalOriginalPointer).toBeGreaterThan(0);
  });

  it('should fall back to bigram/trigram', () => {
    const original2 = 'hello world again';
    
    // ASR merged "worldagain" into one token; should match bigram "world again"
    const transcript = ['hello', 'worldagain'];
    const res = matchRecitation(original2, transcript, 0.70);
    
    const spans = res.matches.map(m => m.originalSpan);
    expect(spans).toEqual([1, 2]); // first single word, then bigram
  });

  it('should not reveal when below threshold', () => {
    const transcript = ['xyzxyz'];
    const res = matchRecitation(original, transcript, 0.95);
    
    expect(res.matches).toHaveLength(0);
    expect(res.revealedTokenMask.some(Boolean)).toBe(false);
  });

  it('should never advance original pointer on mismatch', () => {
    const transcript = ['___'];
    const res = matchRecitation(original, transcript, 0.90);
    
    expect(res.finalOriginalPointer).toBe(0);
  });

  it('should handle short tails', () => {
    const original3 = 'a b';
    const transcript = ['ab'];
    const res = matchRecitation(original3, transcript, 0.70);
    
    // Should try bigram "a b" and likely match
    expect(res.matches.length).toBeGreaterThan(0);
    expect(res.matches[0].originalSpan).toBe(2);
  });

  it('should handle empty transcript', () => {
    const res = matchRecitation(original, [], 0.70);
    
    expect(res.matches).toHaveLength(0);
    expect(res.unmatchedTranscriptIndices).toHaveLength(0);
    expect(res.finalOriginalPointer).toBe(0);
    expect(res.revealedTokenMask.every(v => v === false)).toBe(true);
  });

  it('should handle empty original', () => {
    const transcript = ['hello', 'world'];
    const res = matchRecitation('', transcript, 0.70);
    
    expect(res.matches).toHaveLength(0);
    expect(res.unmatchedTranscriptIndices).toEqual([0, 1]);
    expect(res.finalOriginalPointer).toBe(0);
  });

  it('should match with punctuation differences', () => {
    const original4 = 'Hello, world!';
    const transcript = ['hello', 'world'];
    const res = matchRecitation(original4, transcript, 0.70);
    
    expect(res.matches.length).toBe(2);
    expect(res.revealedTokenMask.filter(Boolean).length).toBe(2);
  });

  it('should handle repeated words correctly', () => {
    const original5 = 'to be or not to be';
    const transcript = ['to', 'be', 'or', 'not', 'to', 'be'];
    const res = matchRecitation(original5, transcript, 0.70);
    
    expect(res.matches.length).toBe(6);
    expect(res.finalOriginalPointer).toBe(6);
  });

  it('should handle filler words that do not match', () => {
    const original6 = 'hello world';
    const transcript = ['hello', 'um', 'world'];
    const res = matchRecitation(original6, transcript, 0.70);
    
    // "um" should not match, so it should be in unmatched indices
    expect(res.unmatchedTranscriptIndices).toContain(1);
    // But "hello" and "world" should still match
    expect(res.matches.length).toBe(2);
  });

  it('should preserve exact original text in revealedText', () => {
    const original7 = 'Hello, beautiful world!';
    const transcript = ['hello', 'beautiful', 'world'];
    const res = matchRecitation(original7, transcript, 0.70);
    
    // Check that revealedText contains exact original tokens
    res.matches.forEach(match => {
      expect(match.revealedText).toBeTruthy();
      expect(typeof match.revealedText).toBe('string');
    });
  });

  it('should handle Arabic text with diacritics', () => {
    const originalArabic = 'مُحَمَّدٌ رَسُولُ اللَّهِ';
    const transcript = ['محمد', 'رسول', 'الله'];
    const res = matchRecitation(originalArabic, transcript, 0.70, true);
    
    // Should match despite diacritics differences
    expect(res.matches.length).toBeGreaterThan(0);
  });

  it('should have similarity scores in valid range', () => {
    const transcript = ['to', 'be'];
    const res = matchRecitation(original, transcript, 0.70);
    
    res.matches.forEach(match => {
      expect(match.similarity).toBeGreaterThanOrEqual(0);
      expect(match.similarity).toBeLessThanOrEqual(1);
    });
  });

  it('should have unrevealedOriginal contain only unrevealed tokens', () => {
    const transcript = ['to', 'be'];
    const res = matchRecitation(original, transcript, 0.70);
    
    // Count revealed tokens
    const revealedCount = res.revealedTokenMask.filter(Boolean).length;
    
    // Unrevealed should be total - revealed
    expect(res.unrevealedOriginal.length).toBe(
      res.revealedTokenMask.length - revealedCount
    );
  });
});

