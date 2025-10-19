/**
 * Human-readable diff generator
 */

import { AlignedToken, AlignmentOperation } from './types';

export interface DiffOptions {
  /** Use ANSI colors for terminal output */
  useColors?: boolean;
  /** Use HTML markup */
  useHtml?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Format style */
  format?: 'inline' | 'sideBySide' | 'unified';
}

export class DiffGenerator {
  private options: Required<DiffOptions>;

  constructor(options: DiffOptions = {}) {
    this.options = {
      useColors: options.useColors ?? false,
      useHtml: options.useHtml ?? false,
      showLineNumbers: options.showLineNumbers ?? false,
      format: options.format ?? 'inline'
    };
  }

  /**
   * Generate human-readable diff string
   */
  public generate(alignment: AlignedToken[]): string {
    switch (this.options.format) {
      case 'inline':
        return this.generateInlineDiff(alignment);
      case 'sideBySide':
        return this.generateSideBySideDiff(alignment);
      case 'unified':
        return this.generateUnifiedDiff(alignment);
      default:
        return this.generateInlineDiff(alignment);
    }
  }

  /**
   * Generate inline diff with markers
   */
  private generateInlineDiff(alignment: AlignedToken[]): string {
    const lines: string[] = [];
    const tokens: string[] = [];

    for (const token of alignment) {
      switch (token.operation) {
        case AlignmentOperation.MATCH:
          tokens.push(this.formatToken(token.reference!, 'match'));
          break;
        case AlignmentOperation.SUBSTITUTION:
          tokens.push(
            this.formatToken(`[${token.reference}→${token.hypothesis}]`, 'substitution')
          );
          break;
        case AlignmentOperation.DELETION:
          tokens.push(this.formatToken(`[-${token.reference}]`, 'deletion'));
          break;
        case AlignmentOperation.INSERTION:
          tokens.push(this.formatToken(`[+${token.hypothesis}]`, 'insertion'));
          break;
      }
    }

    return tokens.join(' ');
  }

  /**
   * Generate side-by-side diff
   */
  private generateSideBySideDiff(alignment: AlignedToken[]): string {
    const refLine: string[] = [];
    const hypLine: string[] = [];
    const markerLine: string[] = [];

    for (const token of alignment) {
      switch (token.operation) {
        case AlignmentOperation.MATCH:
          refLine.push(token.reference!);
          hypLine.push(token.hypothesis!);
          markerLine.push('='.repeat(Math.max(token.reference!.length, token.hypothesis!.length)));
          break;
        case AlignmentOperation.SUBSTITUTION:
          refLine.push(token.reference!);
          hypLine.push(token.hypothesis!);
          markerLine.push('S'.repeat(Math.max(token.reference!.length, token.hypothesis!.length)));
          break;
        case AlignmentOperation.DELETION:
          refLine.push(token.reference!);
          hypLine.push('---');
          markerLine.push('D'.repeat(token.reference!.length));
          break;
        case AlignmentOperation.INSERTION:
          refLine.push('---');
          hypLine.push(token.hypothesis!);
          markerLine.push('I'.repeat(token.hypothesis!.length));
          break;
      }
    }

    return [
      'Reference:  ' + refLine.join(' '),
      'Markers:    ' + markerLine.join(' '),
      'Hypothesis: ' + hypLine.join(' ')
    ].join('\n');
  }

  /**
   * Generate unified diff (like git diff)
   */
  private generateUnifiedDiff(alignment: AlignedToken[]): string {
    const lines: string[] = [];
    let lineNumber = 1;

    for (const token of alignment) {
      const prefix = this.options.showLineNumbers ? `${lineNumber.toString().padStart(4)} | ` : '';
      
      switch (token.operation) {
        case AlignmentOperation.MATCH:
          lines.push(`${prefix}  ${token.reference}`);
          lineNumber++;
          break;
        case AlignmentOperation.SUBSTITUTION:
          lines.push(`${prefix}- ${token.reference}`);
          lines.push(`${prefix}+ ${token.hypothesis}`);
          lineNumber++;
          break;
        case AlignmentOperation.DELETION:
          lines.push(`${prefix}- ${token.reference}`);
          lineNumber++;
          break;
        case AlignmentOperation.INSERTION:
          lines.push(`${prefix}+ ${token.hypothesis}`);
          break;
      }
    }

    return lines.join('\n');
  }

  /**
   * Format token with styling
   */
  private formatToken(token: string, type: 'match' | 'substitution' | 'deletion' | 'insertion'): string {
    if (this.options.useHtml) {
      return this.formatHtml(token, type);
    } else if (this.options.useColors) {
      return this.formatAnsi(token, type);
    } else {
      return token;
    }
  }

  /**
   * Format with HTML
   */
  private formatHtml(token: string, type: string): string {
    const classMap = {
      match: 'diff-match',
      substitution: 'diff-substitution',
      deletion: 'diff-deletion',
      insertion: 'diff-insertion'
    };
    return `<span class="${classMap[type as keyof typeof classMap]}">${this.escapeHtml(token)}</span>`;
  }

  /**
   * Format with ANSI colors
   */
  private formatAnsi(token: string, type: string): string {
    const colorMap = {
      match: '\x1b[32m',      // Green
      substitution: '\x1b[33m', // Yellow
      deletion: '\x1b[31m',    // Red
      insertion: '\x1b[36m'    // Cyan
    };
    const reset = '\x1b[0m';
    return `${colorMap[type as keyof typeof colorMap]}${token}${reset}`;
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, char => map[char]);
  }

  /**
   * Generate summary statistics as string
   */
  public generateSummary(alignment: AlignedToken[]): string {
    const stats = {
      matches: 0,
      substitutions: 0,
      deletions: 0,
      insertions: 0
    };

    for (const token of alignment) {
      switch (token.operation) {
        case AlignmentOperation.MATCH:
          stats.matches++;
          break;
        case AlignmentOperation.SUBSTITUTION:
          stats.substitutions++;
          break;
        case AlignmentOperation.DELETION:
          stats.deletions++;
          break;
        case AlignmentOperation.INSERTION:
          stats.insertions++;
          break;
      }
    }

    const total = alignment.length;
    const lines = [
      'Alignment Summary:',
      `  Matches:       ${stats.matches} (${((stats.matches / total) * 100).toFixed(1)}%)`,
      `  Substitutions: ${stats.substitutions}`,
      `  Deletions:     ${stats.deletions}`,
      `  Insertions:    ${stats.insertions}`,
      `  Total Tokens:  ${total}`
    ];

    return lines.join('\n');
  }
}

