import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { MemorizationService } from '../../services/memorization.service';
import { SpeechRecognitionService, WordMatch } from '../../services/speech-recognition.service';
import { MemorizationItem } from '../../models/memorization-item.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-memorization-detail',
  templateUrl: './memorization-detail.page.html',
  styleUrls: ['./memorization-detail.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class MemorizationDetailPage implements OnInit, OnDestroy {
  item: MemorizationItem | undefined;
  isListening = false;
  currentTranscript = '';
  accuracy = 0;
  wordMatches: WordMatch[] = [];
  private subscriptions: Subscription[] = [];

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
      }
    }

    this.subscriptions.push(
      this.speechService.isListening.subscribe(
        isListening => this.isListening = isListening
      ),
      this.speechService.transcriptSubject.subscribe(transcript => {
        this.currentTranscript = transcript;
        if (this.item) {
          this.accuracy = this.calculateAccuracy(transcript, this.item.content);
        }
      }),
      this.speechService.wordMatchSubject.subscribe(matches => {
        this.wordMatches = matches;
        // Update accuracy based on matches
        if (this.item && matches.length > 0) {
          const correctWords = matches.filter(m => m.isCorrect).length;
          const totalWords = this.item.content.trim().split(/\s+/).length;
          this.accuracy = (correctWords / totalWords) * 100;
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
    this.speechService.reset();
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

  private calculateAccuracy(transcript: string, original: string): number {
    const normalizedTranscript = this.normalizeArabicText(transcript);
    const normalizedOriginal = this.normalizeArabicText(original);
    
    const transcriptWords = normalizedTranscript.split(/\s+/);
    const originalWords = normalizedOriginal.split(/\s+/);
    
    let correctWords = 0;
    for (let i = 0; i < transcriptWords.length; i++) {
      if (i < originalWords.length && transcriptWords[i] === originalWords[i]) {
        correctWords++;
      }
    }

    const totalWords = Math.max(transcriptWords.length, originalWords.length);
    return (correctWords / totalWords) * 100;
  }
} 