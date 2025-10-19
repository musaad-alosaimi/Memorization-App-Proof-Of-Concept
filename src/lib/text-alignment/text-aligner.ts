/**
 * Main entry point for the text alignment library
 * Framework-agnostic text comparison with WER metrics
 */

import { AlignmentEngine } from './alignment-engine';
import { MetricsCalculator } from './metrics-calculator';
import { DiffGenerator, DiffOptions } from './diff-generator';
import {
  AlignmentOptions,
  AlignmentResult,
  AlignedToken,
  WERMetrics
} from './types';

export class TextAligner {
  private engine: AlignmentEngine;
  private metricsCalculator: MetricsCalculator;
  private diffGenerator: DiffGenerator;

  constructor(options: AlignmentOptions = {}) {
    this.engine = new AlignmentEngine(options);
    this.metricsCalculator = new MetricsCalculator();
    this.diffGenerator = new DiffGenerator();
  }

  /**
   * Compare reference text with hypothesis and get complete alignment result
   * 
   * @param referenceText - The expected/correct text
   * @param hypothesisText - The spoken/transcribed text to compare
   * @returns Complete alignment result with metrics and diff
   */
  public compare(
    referenceText: string,
    hypothesisText: string
  ): AlignmentResult {
    // Get token-level alignment
    const alignment = this.engine.align(referenceText, hypothesisText);

    // Calculate WER metrics
    const metrics = this.metricsCalculator.calculateWER(alignment);

    // Generate human-readable diff
    const diffString = this.diffGenerator.generate(alignment);

    return {
      alignment,
      metrics,
      diffString,
      reference: referenceText,
      hypothesis: hypothesisText
    };
  }

  /**
   * Get only the alignment without metrics or diff
   */
  public align(referenceText: string, hypothesisText: string): AlignedToken[] {
    return this.engine.align(referenceText, hypothesisText);
  }

  /**
   * Calculate WER metrics from existing alignment
   */
  public calculateMetrics(alignment: AlignedToken[]): WERMetrics {
    return this.metricsCalculator.calculateWER(alignment);
  }

  /**
   * Generate diff string from existing alignment
   */
  public generateDiff(alignment: AlignedToken[], options?: DiffOptions): string {
    const generator = options ? new DiffGenerator(options) : this.diffGenerator;
    return generator.generate(alignment);
  }

  /**
   * Get detailed statistics from alignment
   */
  public getDetailedStats(alignment: AlignedToken[]) {
    return this.metricsCalculator.getDetailedStats(alignment);
  }

  /**
   * Calculate Character Error Rate (CER)
   */
  public calculateCER(alignment: AlignedToken[]): number {
    return this.metricsCalculator.calculateCER(alignment);
  }

  /**
   * Generate summary string
   */
  public generateSummary(alignment: AlignedToken[]): string {
    return this.diffGenerator.generateSummary(alignment);
  }
}

/**
 * Convenience function for quick comparison
 */
export function compareText(
  referenceText: string,
  hypothesisText: string,
  options?: AlignmentOptions
): AlignmentResult {
  const aligner = new TextAligner(options);
  return aligner.compare(referenceText, hypothesisText);
}

