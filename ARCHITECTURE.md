# Text Alignment Library - Architecture

## 📐 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Application Layer                            │
│  (Ionic Angular App - memorization-detail.page.ts)                  │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ Uses
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Presentation Layer                              │
│           (TextAlignmentViewerComponent - Ionic)                     │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐        │
│  │  Metrics    │  │ Token Grid   │  │ Text Comparison     │        │
│  │  Display    │  │ Visualization│  │ Side-by-Side        │        │
│  └─────────────┘  └──────────────┘  └─────────────────────┘        │
└────────────────────────────┬─────────────────────────────────────────┘
                             │
                             │ Uses
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                              │
│              (TextAligner - Framework Agnostic)                      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      TextAligner                              │  │
│  │                   (Main API Facade)                           │  │
│  │                                                               │  │
│  │  • compare(ref, hyp) → AlignmentResult                       │  │
│  │  • align(ref, hyp) → AlignedToken[]                          │  │
│  │  • calculateMetrics(alignment) → WERMetrics                  │  │
│  │  • generateDiff(alignment, options) → string                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                             │                                         │
│              ┌──────────────┼──────────────┐                         │
│              │              │              │                         │
│              ▼              ▼              ▼                         │
│  ┌────────────────┐ ┌─────────────┐ ┌──────────────┐               │
│  │ AlignmentEngine│ │  Metrics    │ │     Diff     │               │
│  │                │ │ Calculator  │ │  Generator   │               │
│  │ • align()      │ │             │ │              │               │
│  │ • tokenize()   │ │ • calcWER() │ │ • generate() │               │
│  │ • normalize()  │ │ • calcCER() │ │ • formats    │               │
│  └────────────────┘ └─────────────┘ └──────────────┘               │
└──────────────────────────────────────────────────────────────────────┘
                             │
                             │ Uses
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Algorithm Layer                                 │
│            (Wagner-Fischer / Levenshtein Distance)                   │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  1. Build Edit Distance Matrix (O(m×n))                       │  │
│  │     ┌───┬───┬───┬───┬───┐                                     │  │
│  │     │ 0 │ 1 │ 2 │ 3 │ 4 │                                     │  │
│  │     ├───┼───┼───┼───┼───┤                                     │  │
│  │     │ 1 │ X │ X │ X │ X │                                     │  │
│  │     ├───┼───┼───┼───┼───┤                                     │  │
│  │     │ 2 │ X │ X │ X │ X │                                     │  │
│  │     └───┴───┴───┴───┴───┘                                     │  │
│  │                                                               │  │
│  │  2. Backtrack for Optimal Path                               │  │
│  │     Match: diagonal (cost 0)                                 │  │
│  │     Substitute: diagonal (cost 1)                            │  │
│  │     Delete: up (cost 1)                                      │  │
│  │     Insert: left (cost 1)                                    │  │
│  │                                                               │  │
│  │  3. Generate Alignment                                       │  │
│  │     [MATCH, SUBSTITUTION, DELETION, INSERTION]               │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                             │
                             │ Produces
                             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Data Layer                                   │
│                    (Types & Interfaces)                              │
│                                                                       │
│  AlignmentResult {                                                   │
│    alignment: AlignedToken[]                                         │
│    metrics: WERMetrics                                               │
│    diffString: string                                                │
│    reference: string                                                 │
│    hypothesis: string                                                │
│  }                                                                   │
│                                                                       │
│  WERMetrics {                                                        │
│    wer: number                                                       │
│    accuracy: number                                                  │
│    substitutions: number                                             │
│    deletions: number                                                 │
│    insertions: number                                                │
│    matches: number                                                   │
│  }                                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

```
┌─────────────┐
│   User      │
│   Speaks    │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│  Speech Recognition  │
│  Service (Browser)   │
└──────┬───────────────┘
       │
       ▼ (transcript)
┌──────────────────────────┐
│ Memorization Detail Page │
│  • referenceText         │
│  • hypothesisText        │
└──────┬───────────────────┘
       │
       ▼ User clicks "Show Detailed Analysis"
┌──────────────────────────────┐
│ TextAlignmentViewerComponent │
│  [referenceText]             │
│  [hypothesisText]            │
│  [normalizer]                │
└──────┬───────────────────────┘
       │
       ▼ ngOnChanges()
┌──────────────────────┐
│   TextAligner        │
│   .compare()         │
└──────┬───────────────┘
       │
       ├──► AlignmentEngine.align()
       │    ├─► tokenize()
       │    ├─► normalize()
       │    ├─► computeEditDistance()
       │    └─► backtrack()
       │         │
       │         ▼ AlignedToken[]
       │
       ├──► MetricsCalculator.calculateWER()
       │         │
       │         ▼ WERMetrics
       │
       └──► DiffGenerator.generate()
                 │
                 ▼ string (diff)
       
       ▼ AlignmentResult
┌──────────────────────────────┐
│ Component Renders:           │
│  • Metrics badges            │
│  • Token grid                │
│  • Text comparison           │
└──────────────────────────────┘
       │
       ▼
┌──────────────┐
│  User Sees   │
│  Results     │
└──────────────┘
```

---

## 🏗️ Class Diagram

```
┌─────────────────────────────────────────┐
│           <<interface>>                 │
│         AlignmentOptions                │
├─────────────────────────────────────────┤
│ + caseSensitive?: boolean               │
│ + tokenizer?: (text) => string[]        │
│ + normalizer?: (token) => string        │
│ + includeConfidence?: boolean           │
└─────────────────────────────────────────┘
                    △
                    │ uses
                    │
┌─────────────────────────────────────────┐
│          AlignmentEngine                │
├─────────────────────────────────────────┤
│ - options: AlignmentOptions             │
├─────────────────────────────────────────┤
│ + align(ref, hyp): AlignedToken[]       │
│ - processText(text): string[]           │
│ - computeEditDistance(): Matrix         │
│ - backtrack(): AlignedToken[]           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         MetricsCalculator               │
├─────────────────────────────────────────┤
│ + calculateWER(): WERMetrics            │
│ + calculateCER(): number                │
│ + getDetailedStats(): Stats             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           <<interface>>                 │
│            DiffOptions                  │
├─────────────────────────────────────────┤
│ + useColors?: boolean                   │
│ + useHtml?: boolean                     │
│ + showLineNumbers?: boolean             │
│ + format?: 'inline' | ...               │
└─────────────────────────────────────────┘
                    △
                    │ uses
                    │
┌─────────────────────────────────────────┐
│           DiffGenerator                 │
├─────────────────────────────────────────┤
│ - options: DiffOptions                  │
├─────────────────────────────────────────┤
│ + generate(): string                    │
│ - generateInlineDiff(): string          │
│ - generateSideBySideDiff(): string      │
│ - generateUnifiedDiff(): string         │
│ + generateSummary(): string             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           TextAligner                   │
│         (Facade Pattern)                │
├─────────────────────────────────────────┤
│ - engine: AlignmentEngine               │◄───┐
│ - metricsCalc: MetricsCalculator        │◄───┤
│ - diffGen: DiffGenerator                │◄───┤
├─────────────────────────────────────────┤    │
│ + compare(): AlignmentResult            │    │
│ + align(): AlignedToken[]               │────┤
│ + calculateMetrics(): WERMetrics        │────┤
│ + generateDiff(): string                │────┤
│ + getDetailedStats(): Stats             │────┘
│ + calculateCER(): number                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           <<enum>>                      │
│       AlignmentOperation                │
├─────────────────────────────────────────┤
│ MATCH                                   │
│ SUBSTITUTION                            │
│ DELETION                                │
│ INSERTION                               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         AlignedToken                    │
├─────────────────────────────────────────┤
│ + reference: string | null              │
│ + hypothesis: string | null             │
│ + operation: AlignmentOperation         │
│ + referenceIndex: number | null         │
│ + hypothesisIndex: number | null        │
│ + confidence?: number                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│           WERMetrics                    │
├─────────────────────────────────────────┤
│ + wer: number                           │
│ + accuracy: number                      │
│ + substitutions: number                 │
│ + deletions: number                     │
│ + insertions: number                    │
│ + matches: number                       │
│ + totalReferenceWords: number           │
│ + totalHypothesisWords: number          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│        AlignmentResult                  │
├─────────────────────────────────────────┤
│ + alignment: AlignedToken[]             │
│ + metrics: WERMetrics                   │
│ + diffString: string                    │
│ + reference: string                     │
│ + hypothesis: string                    │
└─────────────────────────────────────────┘
```

---

## 🔀 Sequence Diagram

```
User          Component         TextAligner    Engine    Metrics    DiffGen
 │                │                  │            │         │          │
 │   speak        │                  │            │         │          │
 ├───────────────►│                  │            │         │          │
 │                │                  │            │         │          │
 │   click        │                  │            │         │          │
 │   "Analyze"    │                  │            │         │          │
 ├───────────────►│                  │            │         │          │
 │                │                  │            │         │          │
 │                │  compare()       │            │         │          │
 │                ├─────────────────►│            │         │          │
 │                │                  │            │         │          │
 │                │                  │  align()   │         │          │
 │                │                  ├───────────►│         │          │
 │                │                  │            │         │          │
 │                │                  │ AlignedToken[]       │          │
 │                │                  │◄───────────┤         │          │
 │                │                  │            │         │          │
 │                │                  │ calculateWER()       │          │
 │                │                  ├─────────────────────►│          │
 │                │                  │            │         │          │
 │                │                  │       WERMetrics     │          │
 │                │                  │◄─────────────────────┤          │
 │                │                  │            │         │          │
 │                │                  │ generate() │         │          │
 │                │                  ├────────────────────────────────►│
 │                │                  │            │         │          │
 │                │                  │              diff string        │
 │                │                  │◄────────────────────────────────┤
 │                │                  │            │         │          │
 │                │ AlignmentResult  │            │         │          │
 │                │◄─────────────────┤            │         │          │
 │                │                  │            │         │          │
 │                │  render()        │            │         │          │
 │   display      │                  │            │         │          │
 │◄───────────────┤                  │            │         │          │
 │                │                  │            │         │          │
```

---

## 🧩 Design Patterns Used

### 1. **Facade Pattern**
- `TextAligner` provides a simple interface to complex subsystems
- Hides complexity of Engine, Metrics, and DiffGenerator

### 2. **Strategy Pattern**
- Custom tokenizers and normalizers can be injected
- Different diff formats (inline, side-by-side, unified)

### 3. **Builder Pattern**
- `AlignmentOptions` for configuring alignment behavior
- `DiffOptions` for configuring diff generation

### 4. **Component Pattern**
- `TextAlignmentViewerComponent` encapsulates UI logic
- Clear input/output boundaries

### 5. **Separation of Concerns**
- Algorithm layer (edit distance)
- Business logic layer (metrics, diffs)
- Presentation layer (component)

---

## 📦 Module Dependencies

```
TextAlignmentViewerComponent (Angular/Ionic)
    │
    ├─► CommonModule (Angular)
    ├─► IonicModule (Ionic)
    │
    └─► TextAligner (Framework-agnostic)
            │
            ├─► AlignmentEngine
            │       └─► types
            │
            ├─► MetricsCalculator
            │       └─► types
            │
            └─► DiffGenerator
                    └─► types

✅ Zero external dependencies in core library
✅ Only Angular/Ionic in component layer
```

---

## 🎯 SOLID Principles Applied

### Single Responsibility
- ✅ `AlignmentEngine`: Only handles alignment
- ✅ `MetricsCalculator`: Only calculates metrics
- ✅ `DiffGenerator`: Only generates diffs

### Open/Closed
- ✅ Open for extension (custom tokenizers/normalizers)
- ✅ Closed for modification (core algorithm unchanged)

### Liskov Substitution
- ✅ Custom tokenizers/normalizers are interchangeable
- ✅ Diff generators follow same interface

### Interface Segregation
- ✅ Separate interfaces for options, results, tokens
- ✅ Clients depend only on what they use

### Dependency Inversion
- ✅ Depends on abstractions (interfaces)
- ✅ Not on concrete implementations

---

## 🔐 Type Safety

```typescript
// Strong typing throughout
AlignmentOptions      → TextAligner
string, string        → compare()
AlignmentResult       → returned
AlignedToken[]        → alignment
WERMetrics           → metrics
string               → diffString

// Compile-time safety
enum AlignmentOperation  // No magic strings
interface AlignedToken   // Structured data
interface WERMetrics     // Type-safe metrics
```

---

## ⚡ Performance Optimization

### Algorithm Level
- Dynamic programming (avoid recomputation)
- Single-pass matrix fill
- Efficient backtracking

### Data Level
- Minimal object creation
- Pre-allocated arrays
- Efficient string operations

### UI Level
- OnPush change detection (possible)
- Virtual scrolling (for large alignments)
- Lazy rendering

---

## 🧪 Testability

### Pure Functions
- ✅ No side effects
- ✅ Deterministic output
- ✅ Easy to unit test

### Dependency Injection
- ✅ Custom tokenizers/normalizers
- ✅ Mockable components

### Separation of Concerns
- ✅ Algorithm isolated from UI
- ✅ Metrics isolated from alignment
- ✅ Each layer testable independently

---

Built with best practices, SOLID principles, and scalability in mind! 🚀

