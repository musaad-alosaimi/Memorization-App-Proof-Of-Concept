import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { MemorizationService } from '../../services/memorization.service';
import { SpeechRecognitionService, WordMatch } from '../../services/speech-recognition.service';
import { MemorizationItem } from '../../models/memorization-item.model';
import { Subscription } from 'rxjs';
import { TextAlignmentViewerComponent } from '../../components/text-alignment-viewer/text-alignment-viewer.component';
import { TextAligner, AlignmentOperation } from '../../../lib/text-alignment';

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
  showDebugInfo = false;
  matchThreshold = 0.8; // Configurable threshold for word matching
  private subscriptions: Subscription[] = [];
  private aligner: TextAligner;

  constructor(
    private route: ActivatedRoute,
    private memorizationService: MemorizationService,
    private speechService: SpeechRecognitionService
  ) {
    // Initialize aligner with Arabic normalizer and custom tokenizer
    this.aligner = new TextAligner({
      tokenizer: (text: string) => this.tokenizeArabicText(text),
      normalizer: (text: string) => this.normalizeArabicText(text)
    });
  }

  // Custom tokenizer that strictly splits words without combining them
  tokenizeArabicText(text: string): string[] {
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

  // Arabic text normalizer for the alignment library
  normalizeArabicForAlignment = (text: string): string => {
    return this.normalizeArabicText(text);
  };

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
    
    // Use the same tokenizer as the aligner to keep indices consistent
    const words = this.tokenizeArabicText(this.item.content);
    this.revealedWords = words.map((word, index) => ({
      word,
      isRevealed: false,
      isCorrect: false,
      index
    }));
  }

  private updateRevealedWords(transcript: string) {
    if (!this.item || !transcript) return;

    // Add debug logging
    console.log('Current transcript:', transcript);
    console.log('Tokenized transcript:', this.tokenizeArabicText(transcript));
    console.log('Reference words:', this.revealedWords.map(w => w.word));

    // Don't reset already revealed words - keep progress
    const currentlyRevealedCount = this.revealedWords.filter(w => w.isRevealed).length;
    
    // If all words are already revealed, nothing to do
    if (currentlyRevealedCount >= this.revealedWords.length) return;

    // Normalize and tokenize the transcript
    const normalizedTranscript = this.normalizeArabicText(transcript);
    const transcriptTokens = this.tokenizeArabicText(normalizedTranscript);

    console.log('Normalized transcript:', normalizedTranscript);
    console.log('Transcript tokens:', transcriptTokens);

    // Check for sequential word matches starting from the next unrevealed word
    let wordsRevealed = 0;
    let transcriptIndex = 0;

    // Look for consecutive matches starting from the next word to reveal
    for (let i = currentlyRevealedCount; i < this.revealedWords.length && transcriptIndex < transcriptTokens.length; i++) {
      const targetWord = this.revealedWords[i].word;
      const normalizedTargetWord = this.normalizeArabicText(targetWord);
      
      console.log(`Checking word ${i}: "${targetWord}" (normalized: "${normalizedTargetWord}")`);

      // Look for this word in the remaining transcript tokens
      let foundMatch = false;
      let bestMatchIndex = -1;
      let bestMatchScore = 0;

      for (let j = transcriptIndex; j < transcriptTokens.length; j++) {
        const transcriptToken = this.normalizeArabicText(transcriptTokens[j]);
        const matchScore = this.calculateWordMatchScore(normalizedTargetWord, transcriptToken);
        
        console.log(`  Comparing with token ${j}: "${transcriptTokens[j]}" (normalized: "${transcriptToken}") - score: ${matchScore}`);
        
        if (matchScore > bestMatchScore) {
          bestMatchScore = matchScore;
          bestMatchIndex = j;
        }
      }

      // Only accept matches with high confidence (configurable threshold)
      if (bestMatchScore >= this.matchThreshold) {
        console.log(`Found match for "${targetWord}" at token ${bestMatchIndex} with score ${bestMatchScore}`);
        this.revealedWords[i].isRevealed = true;
        this.revealedWords[i].isCorrect = true;
        wordsRevealed++;
        
        // Move transcript index past this match to ensure sequential processing
        transcriptIndex = bestMatchIndex + 1;
      } else {
        console.log(`No sufficient match for "${targetWord}" (best score: ${bestMatchScore})`);
        // Stop at first non-match to maintain sequential order
        break;
      }
    }

    console.log(`Revealed ${wordsRevealed} new words`);
  }

  private calculateWordMatchScore(targetWord: string, transcriptToken: string): number {
    // Exact match
    if (targetWord === transcriptToken) return 1.0;
    
    // Remove spaces for comparison (but no word combining)
    const noSpaceTarget = targetWord.replace(/\s+/g, '');
    const noSpaceToken = transcriptToken.replace(/\s+/g, '');
    
    if (noSpaceTarget === noSpaceToken) return 0.95;
    
    // Check character-level similarity only (no compound word handling)
    const similarity = this.calculateCharacterSimilarity(noSpaceTarget, noSpaceToken);
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
    this.initializeRevealedWords();
    this.speechService.reset();
  }

  toggleAlignmentViewer() {
    this.showAlignmentViewer = !this.showAlignmentViewer;
  }

  toggleDebugInfo() {
    this.showDebugInfo = !this.showDebugInfo;
  }

  adjustMatchThreshold(delta: number) {
    this.matchThreshold = Math.max(0.5, Math.min(1.0, this.matchThreshold + delta));
  }

  getRevealedWordsCount(): number {
    return this.revealedWords.filter(w => w.isRevealed).length;
  }

  getTotalWordsCount(): number {
    return this.revealedWords.length;
  }

  private removeDiacritics(text: string): string {
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  }

  private normalizeArabicText(text: string): string {
    let normalized = this.removeDiacritics(text);
    normalized = normalized
      .replace(/[آأإٱ]/g, 'ا')      // Normalize alef variants
      .replace(/ة/g, 'ه')          // Normalize ta marbuta
      .replace(/ى/g, 'ي')          // Normalize alef maksura
      .replace(/ؤ/g, 'و')          // Normalize hamza on waw
      .replace(/ئ/g, 'ي')          // Normalize hamza on ya
      // Add more normalization for prefixes
      .replace(/^(ف|و|ب|ل|ك|س)(.+)$/, '$1$2')  // Keep prefixes attached
      .replace(/[^\u0621-\u063A\u0641-\u064A\s]/g, '')  // Remove non-Arabic
      .trim()
      .toLowerCase();  // Make case-insensitive
    return normalized;
  }

  private calculateAccuracy(transcript: string, original: string): number {
    // Only calculate accuracy based on revealed words
    const revealedCount = this.revealedWords.filter(w => w.isRevealed).length;
    if (revealedCount === 0) return 0;

    const correctCount = this.revealedWords.filter(w => w.isRevealed && w.isCorrect).length;
    return (correctCount / revealedCount) * 100;
  }
}