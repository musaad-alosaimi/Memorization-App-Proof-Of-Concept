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

  private checkWords(transcript: string, isFinal: boolean) {
    const normalizedTranscript = this.normalizeArabicText(transcript);
    const normalizedTarget = this.normalizeArabicText(this.targetText);
    
    const transcriptWords = normalizedTranscript.trim().split(/\s+/);
    const targetWords = normalizedTarget.trim().split(/\s+/);
    const originalWords = transcript.trim().split(/\s+/);
    
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

    // Check new words
    for (let i = this.lastCorrectIndex + 1; i < transcriptWords.length; i++) {
      const isCorrect = i < targetWords.length && 
                       this.normalizeArabicText(transcriptWords[i]) === targetWords[i];
      const isPartial = !isFinal && i === transcriptWords.length - 1;
      
      matches.push({
        word: originalWords[i],
        isCorrect,
        isPartial
      });

      // Update last correct index if this word is correct
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