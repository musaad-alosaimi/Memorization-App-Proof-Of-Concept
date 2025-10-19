import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TextAligner, AlignmentResult, AlignedToken, AlignmentOperation } from '../../../lib/text-alignment';

@Component({
  selector: 'app-text-alignment-viewer',
  templateUrl: './text-alignment-viewer.component.html',
  styleUrls: ['./text-alignment-viewer.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class TextAlignmentViewerComponent implements OnChanges {
  @Input() referenceText: string = '';
  @Input() hypothesisText: string = '';
  @Input() showMetrics: boolean = true;
  @Input() showDiff: boolean = true;
  @Input() normalizer?: (text: string) => string;

  alignmentResult: AlignmentResult | null = null;
  private aligner: TextAligner;

  // Expose enum for template
  AlignmentOperation = AlignmentOperation;

  constructor() {
    this.aligner = new TextAligner();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['referenceText'] || changes['hypothesisText'] || changes['normalizer']) {
      this.updateAlignment();
    }
  }

  private updateAlignment(): void {
    if (!this.referenceText || !this.hypothesisText) {
      this.alignmentResult = null;
      return;
    }

    // Update aligner with custom normalizer if provided
    if (this.normalizer) {
      this.aligner = new TextAligner({
        normalizer: this.normalizer
      });
    }

    this.alignmentResult = this.aligner.compare(this.referenceText, this.hypothesisText);
  }

  getOperationClass(operation: AlignmentOperation): string {
    const classMap = {
      [AlignmentOperation.MATCH]: 'token-match',
      [AlignmentOperation.SUBSTITUTION]: 'token-substitution',
      [AlignmentOperation.DELETION]: 'token-deletion',
      [AlignmentOperation.INSERTION]: 'token-insertion'
    };
    return classMap[operation];
  }

  getOperationIcon(operation: AlignmentOperation): string {
    const iconMap = {
      [AlignmentOperation.MATCH]: 'checkmark-circle',
      [AlignmentOperation.SUBSTITUTION]: 'swap-horizontal',
      [AlignmentOperation.DELETION]: 'remove-circle',
      [AlignmentOperation.INSERTION]: 'add-circle'
    };
    return iconMap[operation];
  }

  getOperationLabel(operation: AlignmentOperation): string {
    const labelMap = {
      [AlignmentOperation.MATCH]: 'Match',
      [AlignmentOperation.SUBSTITUTION]: 'Substitution',
      [AlignmentOperation.DELETION]: 'Deletion',
      [AlignmentOperation.INSERTION]: 'Insertion'
    };
    return labelMap[operation];
  }

  getTokenDisplay(token: AlignedToken): string {
    switch (token.operation) {
      case AlignmentOperation.MATCH:
        return token.reference || '';
      case AlignmentOperation.SUBSTITUTION:
        return `${token.reference} → ${token.hypothesis}`;
      case AlignmentOperation.DELETION:
        return `${token.reference} (deleted)`;
      case AlignmentOperation.INSERTION:
        return `${token.hypothesis} (inserted)`;
      default:
        return '';
    }
  }

  getWERColor(): string {
    if (!this.alignmentResult) return 'medium';
    const wer = this.alignmentResult.metrics.wer;
    if (wer === 0) return 'success';
    if (wer < 0.1) return 'success';
    if (wer < 0.3) return 'warning';
    return 'danger';
  }

  getAccuracyColor(): string {
    if (!this.alignmentResult) return 'medium';
    const accuracy = this.alignmentResult.metrics.accuracy;
    if (accuracy >= 90) return 'success';
    if (accuracy >= 70) return 'warning';
    return 'danger';
  }
}

