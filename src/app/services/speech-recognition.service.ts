import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

declare var webkitSpeechRecognition: any;

export interface WordMatch {
  word: string;
  isCorrect: boolean;
  isPartial?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SpeechRecognitionService {
  recognition: any;
  isListening = new BehaviorSubject<boolean>(false);
  transcriptSubject = new Subject<string>();
  wordMatchSubject = new Subject<WordMatch[]>();
  errorSubject = new Subject<string>();
  private targetText: string = '';
  private lastCorrectIndex: number = -1;
  private accumulatedTranscript: string = '';

  constructor(private ngZone: NgZone) {
    this.initRecognition();
  }

  private initRecognition() {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'ar-SA';

      this.recognition.onresult = (event: any) => {
        let currentTranscript = '';
        let isFinal = false;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
          isFinal = event.results[i].isFinal;
        }

        // If we have a last correct word, prepend the accumulated transcript
        const fullTranscript = this.accumulatedTranscript + 
          (this.accumulatedTranscript && currentTranscript ? ' ' : '') + 
          currentTranscript;
        
        this.ngZone.run(() => {
          this.transcriptSubject.next(fullTranscript);
          this.checkWords(fullTranscript, isFinal);
        });
      };

      this.recognition.onend = () => {
        // Only restart if we're still supposed to be listening
        if (this.isListening.value) {
          this.recognition.start();
        }
      };

      this.recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          this.errorSubject.next(event.error);
          if (event.error === 'no-speech') {
            // Don't stop on no-speech error, just restart
            if (this.isListening.value) {
              this.recognition.start();
            }
          } else {
            this.stop();
          }
        });
      };
    }
  }

  setTargetText(text: string) {
    this.targetText = text;
    this.resetProgress();
  }

  private resetProgress() {
    this.lastCorrectIndex = -1;
    this.accumulatedTranscript = '';
  }

  private removeDiacritics(text: string): string {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  }

  private normalizeArabicText(text: string): string {
    let normalized = this.removeDiacritics(text);
    normalized = normalized
      .replace(/[آأإٱ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, '')
      .trim();
    return normalized;
  }

  // Strict word-by-word tokenizer (same as page component)
  private tokenizeArabicText(text: string): string[] {
    // Remove punctuation and normalize spaces, then split strictly by whitespace
    const cleanedText = text
      .trim()
      .replace(/[،,؛;:.!؟?«»""\[\](){}]/g, ' ')  // Replace punctuation with spaces
      .replace(/\s+/g, ' ')  // Normalize multiple spaces to single space
      .trim();

    // Split strictly by whitespace - no word combining
    const words = cleanedText.split(/\s+/);
    
    // Filter out empty strings and return individual words
    return words.filter((word: string) => word.length > 0);
  }

  private checkWords(transcript: string, isFinal: boolean) {
    const normalizedTranscript = this.normalizeArabicText(transcript);
    const normalizedTarget = this.normalizeArabicText(this.targetText);
    
    // Use strict word-by-word tokenization (same as the page component)
    const transcriptWords = this.tokenizeArabicText(normalizedTranscript);
    const targetWords = this.tokenizeArabicText(normalizedTarget);
    const originalWords = this.tokenizeArabicText(transcript);
    
    let newLastCorrectIndex = this.lastCorrectIndex;
    const matches: WordMatch[] = [];

    // Add previously correct words
    for (let i = 0; i <= this.lastCorrectIndex && i < targetWords.length; i++) {
      matches.push({
        word: originalWords[i] || targetWords[i],
        isCorrect: true,
        isPartial: false
      });
    }

    // Check new words with improved matching logic
    for (let i = this.lastCorrectIndex + 1; i < transcriptWords.length; i++) {
      const transcriptWord = transcriptWords[i];
      const targetWord = i < targetWords.length ? targetWords[i] : null;
      
      // Calculate match score for better accuracy
      const matchScore = targetWord ? this.calculateWordMatchScore(targetWord, transcriptWord) : 0;
      const isCorrect = matchScore >= 0.8; // High confidence threshold
      const isPartial = !isFinal && i === transcriptWords.length - 1;
      
      matches.push({
        word: originalWords[i],
        isCorrect,
        isPartial
      });

      // Update last correct index if this word is correct and final
      if (isCorrect && isFinal) {
        newLastCorrectIndex = i;
      }
    }

    // If we have final results, update the accumulated transcript and last correct index
    if (isFinal) {
      if (newLastCorrectIndex > this.lastCorrectIndex) {
        this.lastCorrectIndex = newLastCorrectIndex;
        // Update accumulated transcript with all words up to last correct
        this.accumulatedTranscript = originalWords.slice(0, this.lastCorrectIndex + 1).join(' ');
      }
    }

    this.wordMatchSubject.next(matches);
  }

  private calculateWordMatchScore(targetWord: string, transcriptWord: string): number {
    // Exact match
    if (targetWord === transcriptWord) return 1.0;
    
    // Remove spaces for comparison (but no word combining)
    const noSpaceTarget = targetWord.replace(/\s+/g, '');
    const noSpaceTranscript = transcriptWord.replace(/\s+/g, '');
    
    if (noSpaceTarget === noSpaceTranscript) return 0.95;
    
    // Check character-level similarity only (no compound word handling)
    const similarity = this.calculateCharacterSimilarity(noSpaceTarget, noSpaceTranscript);
    return similarity >= 0.8 ? similarity : 0; // Higher threshold for word-by-word matching
  }

  private calculateCharacterSimilarity(str1: string, str2: string): number {
    if (str1.length === 0 || str2.length === 0) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  start() {
    if (this.recognition) {
      // Don't reset progress when starting
      this.recognition.start();
      this.isListening.next(true);
    } else {
      this.errorSubject.next('Speech recognition not supported');
    }
  }

  stop() {
    if (this.recognition) {
      this.recognition.stop();
      this.isListening.next(false);
    }
  }

  reset() {
    this.resetProgress();
    this.stop();
  }

  setLanguage(language: string) {
    if (this.recognition) {
      this.recognition.lang = language;
    }
  }
} 