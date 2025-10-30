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

  // Custom tokenizer that removes punctuation and empty tokens
  private tokenizeArabicText(text: string): string[] {
    // First, normalize spaces and split into potential phrases
    const phrases = text
      .trim()
      .split(/[،,؛;:.!؟?«»""\[\](){}]/g)  // Split on punctuation
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 0);

    const processedWords: string[] = [];
    
    for (const phrase of phrases) {
      // Split each phrase into words
      const words = phrase.split(/\s+/);
      
      // Process each word or word group
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if (word.length === 0) continue;

        // Check for compound words with prefixes
        if (word.match(/^(ف|و|ب|ل|ك|س)[ا-ي]+$/)) {
          // Look ahead for potential compound
          if (i < words.length - 1) {
            // Try to combine with next word
            const compound = word + ' ' + words[i + 1];
            processedWords.push(compound);
            i++; // Skip next word since we used it in compound
            continue;
          }
        }

        // Add the word by itself
        processedWords.push(word);
      }
    }

    return processedWords.filter((word: string) => word.length > 0);
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

    // Tokenize the transcript
    const transcriptTokens = this.tokenizeArabicText(transcript);
    console.log('Transcript tokens:', transcriptTokens);
    
    // Find the current pointer position (first unrevealed word)
    const currentPointer = this.revealedWords.findIndex(w => !w.isRevealed);
    
    // If all words are revealed, nothing to do
    if (currentPointer === -1) {
      console.log('All words already revealed');
      return;
    }

    const nextWordToReveal = this.revealedWords[currentPointer];
    console.log(`Pointer at position ${currentPointer}, next word to reveal: "${nextWordToReveal.word}"`);

    // Only check if the NEXT word in sequence exists in the transcript
    const normalizedRefWord = this.normalizeArabicText(nextWordToReveal.word);
    let matchFound = false;

    // Check each token in the transcript to see if it matches the next word
    for (let transIndex = 0; transIndex < transcriptTokens.length; transIndex++) {
      const transcriptToken = transcriptTokens[transIndex];
      const normalizedToken = this.normalizeArabicText(transcriptToken);

      // Check for match using various methods
      let isMatch = false;

      // Method 1: Exact match
      if (normalizedToken === normalizedRefWord) {
        isMatch = true;
      }
      
      // Method 2: Match without spaces (for compound words)
      if (!isMatch) {
        const noSpaceToken = normalizedToken.replace(/\s+/g, '');
        const noSpaceRefWord = normalizedRefWord.replace(/\s+/g, '');
        if (noSpaceToken === noSpaceRefWord) {
          isMatch = true;
        }
      }

      // Method 3: Partial match for compound words (both ways)
      if (!isMatch) {
        const noSpaceToken = normalizedToken.replace(/\s+/g, '');
        const noSpaceRefWord = normalizedRefWord.replace(/\s+/g, '');
        
        // Check if one contains the other and they have substantial overlap
        const minLength = Math.min(noSpaceToken.length, noSpaceRefWord.length);
        const maxLength = Math.max(noSpaceToken.length, noSpaceRefWord.length);
        
        // Require at least 80% overlap for partial matches
        if (minLength >= 3 && (minLength / maxLength) >= 0.8) {
          if (noSpaceToken.includes(noSpaceRefWord) || noSpaceRefWord.includes(noSpaceToken)) {
            isMatch = true;
          }
        }
      }

      if (isMatch) {
        console.log(`✓ Matched "${nextWordToReveal.word}" with transcript token "${transcriptToken}"`);
        nextWordToReveal.isRevealed = true;
        nextWordToReveal.isCorrect = true;
        matchFound = true;
        break;
      }
    }

    if (!matchFound) {
      console.log(`✗ No match found for "${nextWordToReveal.word}"`);
    }

    console.log(`Revealed words: ${this.revealedWords.filter(w => w.isRevealed).length} / ${this.revealedWords.length}`);
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