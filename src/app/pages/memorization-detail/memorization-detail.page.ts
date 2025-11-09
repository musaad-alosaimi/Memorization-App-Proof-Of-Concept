import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { MemorizationService } from '../../services/memorization.service';
import { SpeechRecognitionService, WordMatch } from '../../services/speech-recognition.service';
import { MemorizationItem } from '../../models/memorization-item.model';
import { Subscription } from 'rxjs';
import { TextAlignmentViewerComponent } from '../../components/text-alignment-viewer/text-alignment-viewer.component';
import { matchRecitation, MatchResult } from '../../../recitation/matcher';
import { tokenizeOriginal, normalizeArabic } from '../../../recitation/normalize';

interface RevealedWord {
  word: string;
  isRevealed: boolean;
  isCorrect: boolean;
  index: number;
}

@Component({
  selector: 'app-memorization-detail',
  templateUrl: './memorization-detail.page.html',
  styleUrls: ['./memorization-detail.page.scss'],
  imports: [CommonModule, IonicModule, TextAlignmentViewerComponent]
})
export class MemorizationDetailPage implements OnInit, OnDestroy {
  item: MemorizationItem | undefined;
  isListening = false;
  currentTranscript = '';
  accuracy = 0;
  wordMatches: WordMatch[] = [];
  revealedWords: RevealedWord[] = [];
  showAlignmentViewer = false;
  canSkipWord = false; // Show skip button when user is stuck
  failedAttempts = 0; // Count consecutive failed attempts (public for template)
  private subscriptions: Subscription[] = [];
  matchResult: MatchResult | null = null; // Made public for template access
  readonly SIMILARITY_THRESHOLD = 0.30; // 30% similarity threshold (lowered for better matching) - public for template
  private lastTranscriptLength = 0; // Track transcript changes
  private readonly MAX_ATTEMPTS_BEFORE_SKIP = 3; // Allow skip after 3 attempts
  private lastTranscriptUpdateTime = 0; // Track when transcript was last updated
  private readonly TRANSCRIPT_FRESHNESS_MS = 3000; // Consider transcript "stale" after 3 seconds

  constructor(
    private route: ActivatedRoute,
    private memorizationService: MemorizationService,
    private speechService: SpeechRecognitionService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.item = this.memorizationService.getItem(id);
      if (this.item) {
        this.speechService.setTargetText(this.item.content);
        this.initializeRevealedWords();
      }
    }

    this.subscriptions.push(
      this.speechService.isListening.subscribe(
        isListening => this.isListening = isListening
      ),
      this.speechService.transcriptSubject.subscribe(transcript => {
        this.currentTranscript = transcript;
        this.lastTranscriptUpdateTime = Date.now(); // Track when transcript was updated
        if (this.item) {
          this.updateRevealedWords(transcript);
          this.accuracy = this.calculateAccuracy(transcript, this.item.content);
        }
      }),
      this.speechService.wordMatchSubject.subscribe(matches => {
        this.wordMatches = matches;
        // Accuracy is now calculated based on revealed words only
        if (this.item && matches.length > 0) {
          this.accuracy = this.calculateAccuracy(this.currentTranscript, this.item.content);
        }
      }),
      this.speechService.errorSubject.subscribe(error => {
        console.error('Speech recognition error:', error);
        // Only stop listening on critical errors
        if (error !== 'no-speech') {
          this.isListening = false;
        }
      })
    );
  }

  private initializeRevealedWords() {
    if (!this.item) return;
    
    // Reset match result and skip tracking
    this.matchResult = null;
    this.failedAttempts = 0;
    this.lastTranscriptLength = 0;
    this.lastTranscriptUpdateTime = 0;
    this.canSkipWord = false;
    
    // Tokenize original text using the new tokenizer
    const words = tokenizeOriginal(this.item.content);
    this.revealedWords = words.map((word, index) => ({
      word,
      isRevealed: false,
      isCorrect: false,
      index
    }));
  }

  /**
   * Update revealed words based on transcript using the new matching algorithm
   */
  private updateRevealedWords(transcript: string) {
    if (!this.item || !transcript) return;

    console.log('Current transcript:', transcript);

    // Tokenize transcript (split by whitespace for ASR tokens)
    const transcriptTokens = transcript.trim().split(/\s+/).filter(t => t.length > 0);
    console.log('Transcript tokens:', transcriptTokens);

    // Track the number of revealed words before matching
    const previousRevealedCount = this.revealedWords.filter(w => w.isRevealed).length;

    // Use the new matching algorithm
    this.matchResult = matchRecitation(
      this.item.content,
      transcriptTokens,
      this.SIMILARITY_THRESHOLD,
      true // Use Arabic normalization
    );

    // Update revealedWords based on match result
    const originalTokens = tokenizeOriginal(this.item.content);
    
    // Ensure revealedWords array matches originalTokens length
    if (this.revealedWords.length !== originalTokens.length) {
      this.revealedWords = originalTokens.map((word, index) => ({
        word,
        isRevealed: false,
        isCorrect: false,
        index
      }));
    }

    // Update revealed status based on matchResult
    for (let i = 0; i < originalTokens.length; i++) {
      if (this.matchResult.revealedTokenMask[i]) {
        this.revealedWords[i].isRevealed = true;
        this.revealedWords[i].isCorrect = true;
      }
    }

    // Log detailed matching information for debugging
    console.log('=== DETAILED MATCH INFO ===');
    const nextWord = this.getNextExpectedWord();
    console.log('Next expected word:', nextWord || '(All words revealed!)');
    console.log('Unmatched transcript indices:', this.matchResult.unmatchedTranscriptIndices);
    if (this.matchResult.unmatchedTranscriptIndices.length > 0) {
      console.log('Unmatched words you said:', 
        this.matchResult.unmatchedTranscriptIndices.map(idx => transcriptTokens[idx])
      );
    }

    // Track failed attempts for skip functionality
    const currentRevealedCount = this.revealedWords.filter(w => w.isRevealed).length;
    const transcriptChanged = transcriptTokens.length > this.lastTranscriptLength;
    
    if (transcriptChanged) {
      if (currentRevealedCount === previousRevealedCount && currentRevealedCount < this.revealedWords.length) {
        // Transcript changed but no new words revealed - increment failed attempts
        this.failedAttempts++;
        console.log(`Failed attempt ${this.failedAttempts}/${this.MAX_ATTEMPTS_BEFORE_SKIP}`);
        
        // Enable skip button after max attempts
        if (this.failedAttempts >= this.MAX_ATTEMPTS_BEFORE_SKIP) {
          this.canSkipWord = true;
          console.log('Skip word button enabled');
        }
      } else if (currentRevealedCount > previousRevealedCount) {
        // New words revealed - reset failed attempts
        this.failedAttempts = 0;
        this.canSkipWord = false;
        console.log('Progress made, reset failed attempts');
      }
      
      this.lastTranscriptLength = transcriptTokens.length;
    }

    console.log(
      `\n=== Summary: Revealed ${this.matchResult.matches.length} matches, ` +
      `${this.revealedWords.filter(w => w.isRevealed).length} / ${this.revealedWords.length} words ===`
    );
    console.log('Unmatched transcript indices:', this.matchResult.unmatchedTranscriptIndices);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.stopListening();
  }

  

  toggleListening() {
    if (this.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private startListening() {
    // Don't reset transcript and matches when starting
    this.speechService.start();
  }

  private stopListening() {
    this.speechService.stop();
    if (this.item && this.accuracy > 0) {
      this.memorizationService.updateItem(this.item.id, {
        lastPracticed: new Date(),
        accuracy: this.accuracy
      });
    }
  }

  resetPractice() {
    this.currentTranscript = '';
    this.accuracy = 0;
    this.wordMatches = [];
    this.showAlignmentViewer = false;
    this.matchResult = null;
    this.failedAttempts = 0;
    this.lastTranscriptLength = 0;
    this.lastTranscriptUpdateTime = 0;
    this.canSkipWord = false;
    this.initializeRevealedWords();
    this.speechService.reset();
  }

  /**
   * Skip the current unrevealed word and reveal the next one
   * This helps users when they're stuck on a difficult word
   */
  skipCurrentWord() {
    if (!this.canSkipWord) return;

    // Find the first unrevealed word
    const nextUnrevealedIndex = this.revealedWords.findIndex(w => !w.isRevealed);
    
    if (nextUnrevealedIndex !== -1) {
      // Reveal the word but mark it as incorrect (skipped)
      this.revealedWords[nextUnrevealedIndex].isRevealed = true;
      this.revealedWords[nextUnrevealedIndex].isCorrect = false; // Mark as skipped/incorrect
      
      console.log(`Skipped word: "${this.revealedWords[nextUnrevealedIndex].word}"`);
      
      // Reset skip tracking
      this.failedAttempts = 0;
      this.canSkipWord = false;
      
      // Recalculate accuracy
      if (this.item) {
        this.accuracy = this.calculateAccuracy(this.currentTranscript, this.item.content);
      }
    }
  }

  toggleAlignmentViewer() {
    this.showAlignmentViewer = !this.showAlignmentViewer;
  }

  getRevealedWordsCount(): number {
    return this.revealedWords.filter(w => w.isRevealed).length;
  }

  getTotalWordsCount(): number {
    return this.revealedWords.length;
  }

  /**
   * Get the list of unmatched words from the current transcript
   */
  getUnmatchedWords(): string[] {
    // Clear unmatched words if not currently listening or no transcript
    if (!this.isListening || !this.currentTranscript || this.currentTranscript.trim().length === 0) {
      return [];
    }
    
    // Check if transcript is "fresh" (updated recently)
    const timeSinceLastUpdate = Date.now() - this.lastTranscriptUpdateTime;
    if (timeSinceLastUpdate > this.TRANSCRIPT_FRESHNESS_MS) {
      return []; // Transcript is stale, hide unmatched words
    }
    
    if (!this.matchResult) {
      return [];
    }
    
    const transcriptTokens = this.currentTranscript.trim().split(/\s+/).filter(t => t.length > 0);
    return this.matchResult.unmatchedTranscriptIndices.map(idx => transcriptTokens[idx]);
  }

  /**
   * Get details about the last unmatched word (for debugging)
   */
  getLastUnmatchedWordInfo(): string {
    const unmatched = this.getUnmatchedWords();
    if (unmatched.length === 0) return '';
    
    const lastWord = unmatched[unmatched.length - 1];
    const nextExpected = this.getNextExpectedWord();
    
    if (!lastWord || !nextExpected) return '';
    
    // Calculate similarity between last unmatched word and next expected word
    const normalizedSaid = this.normalizeArabicForAlignment(lastWord);
    const normalizedExpected = this.normalizeArabicForAlignment(nextExpected);
    
    return `"${lastWord}" vs "${nextExpected}" (normalized: "${normalizedSaid}" vs "${normalizedExpected}")`;
  }

  /**
   * Get the next expected word (first unrevealed word)
   */
  getNextExpectedWord(): string | null {
    const nextUnrevealedIndex = this.revealedWords.findIndex(w => !w.isRevealed);
    if (nextUnrevealedIndex === -1) {
      return null; // All words revealed
    }
    return this.revealedWords[nextUnrevealedIndex].word;
  }

  /**
   * Check if there are any unrevealed words remaining
   */
  hasUnrevealedWords(): boolean {
    return this.revealedWords.some(w => !w.isRevealed);
  }

  /**
   * Normalization function for the text alignment viewer component
   * Uses the new Arabic normalization utility
   */
  normalizeArabicForAlignment = (text: string): string => {
    return normalizeArabic(text);
  };

  private calculateAccuracy(transcript: string, original: string): number {
    // Only calculate accuracy based on revealed words
    const revealedCount = this.revealedWords.filter(w => w.isRevealed).length;
    if (revealedCount === 0) return 0;

    const correctCount = this.revealedWords.filter(w => w.isRevealed && w.isCorrect).length;
    return (correctCount / revealedCount) * 100;
  }
}