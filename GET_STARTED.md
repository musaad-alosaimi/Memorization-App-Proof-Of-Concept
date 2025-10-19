# 🚀 Get Started with Text Alignment Library

## ✨ What You Got

I've built a **production-ready text alignment library** for your Hadith Memorization App with:

✅ **Framework-agnostic core** (pure TypeScript, zero dependencies)  
✅ **Token-level alignment** using Levenshtein distance algorithm  
✅ **WER (Word Error Rate) metrics** with detailed breakdown  
✅ **Beautiful Ionic component** for visualization  
✅ **Arabic text support** with diacritics normalization  
✅ **Comprehensive documentation** with examples  

---

## 📁 What Was Created

```
Your Project/
├── src/lib/text-alignment/              ← Core Library
│   ├── types.ts                          (Type definitions)
│   ├── alignment-engine.ts               (Core algorithm)
│   ├── metrics-calculator.ts             (WER/CER metrics)
│   ├── diff-generator.ts                 (Human-readable diffs)
│   ├── text-aligner.ts                   (Main API)
│   ├── index.ts                          (Public exports)
│   ├── examples.ts                       (7 usage examples)
│   ├── demo.ts                           (Interactive demo)
│   └── README.md                         (Full documentation)
│
├── src/app/components/
│   └── text-alignment-viewer/           ← Ionic Component
│       ├── text-alignment-viewer.component.ts
│       ├── text-alignment-viewer.component.html
│       └── text-alignment-viewer.component.scss
│
├── src/app/pages/memorization-detail/   ← Already Integrated!
│
├── TEXT_ALIGNMENT_LIBRARY.md            ← Quick Start Guide
├── IMPLEMENTATION_SUMMARY.md            ← What Was Built
├── ARCHITECTURE.md                      ← System Design
└── GET_STARTED.md                       ← This File
```

---

## 🎯 Try It Right Now!

### Option 1: Use in Your App (Already Integrated!)

1. **Run your Ionic app**:
   ```bash
   ionic serve
   # or
   npm start
   ```

2. **Navigate to a memorization item**

3. **Click "Start Practice"** and speak some Arabic text

4. **Click "Show Detailed Analysis"** button

5. **See the magic!** 
   - Token-level alignment
   - WER metrics (accuracy, errors)
   - Color-coded visualization
   - Detailed statistics

### Option 2: Test Standalone

Create a test file `src/test-alignment.ts`:

```typescript
import { compareText } from './lib/text-alignment';

// Test with English
const result1 = compareText(
  "The quick brown fox jumps over the lazy dog",
  "The quick brown fox jumped over the lazy cat"
);

console.log('WER:', result1.metrics.wer);
console.log('Accuracy:', result1.metrics.accuracy + '%');
console.log('Diff:', result1.diffString);

// Test with Arabic
import { TextAligner } from './lib/text-alignment';

const normalizeArabic = (text: string) => 
  text.replace(/[\u064B-\u065F\u0670]/g, ''); // Remove diacritics

const aligner = new TextAligner({ normalizer: normalizeArabic });

const result2 = aligner.compare(
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "بسم الله الرحمن الرحيم"
);

console.log('Arabic Accuracy:', result2.metrics.accuracy + '%');
```

### Option 3: Run Demo

```typescript
import { demonstrateLibrary } from './lib/text-alignment/demo';

// Shows 6 feature demonstrations with output
demonstrateLibrary();
```

---

## 💡 Common Use Cases

### 1. Basic Comparison

```typescript
import { compareText } from './lib/text-alignment';

const result = compareText(
  "reference text",
  "spoken text"
);

console.log(`Accuracy: ${result.metrics.accuracy}%`);
```

### 2. With Arabic Normalization

```typescript
import { TextAligner } from './lib/text-alignment';

const normalizeArabic = (text: string) => {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, '')  // Remove diacritics
    .replace(/[آأإٱ]/g, 'ا')                  // Normalize alef
    .replace(/ة/g, 'ه')                      // Normalize ta marbuta
    .replace(/ى/g, 'ي');                     // Normalize ya
};

const aligner = new TextAligner({
  normalizer: normalizeArabic,
  caseSensitive: false
});

const result = aligner.compare(hadithText, spokenText);
```

### 3. In Your Component

```html
<app-text-alignment-viewer
  [referenceText]="originalHadith"
  [hypothesisText]="spokenText"
  [normalizer]="normalizeArabicFunction"
  [showMetrics]="true"
  [showDiff]="true">
</app-text-alignment-viewer>
```

```typescript
export class MyComponent {
  normalizeArabicFunction = (text: string) => {
    // Your normalization logic
    return text.replace(/[\u064B-\u065F\u0670]/g, '');
  };
}
```

---

## 📊 Understanding the Output

### Metrics Explained

```typescript
result.metrics = {
  wer: 0.222,                    // 22.2% error rate
  accuracy: 77.8,                // 77.8% accuracy
  substitutions: 2,              // 2 words replaced
  deletions: 0,                  // 0 words removed
  insertions: 0,                 // 0 words added
  matches: 7,                    // 7 words correct
  totalReferenceWords: 9,        // 9 words in reference
  totalHypothesisWords: 9        // 9 words spoken
}
```

### Alignment Operations

- **✓ MATCH**: Word is correct
- **⟳ SUBSTITUTION**: Word was replaced (e.g., "cat" → "car")
- **✗ DELETION**: Word was missed (should have said it)
- **+ INSERTION**: Extra word (said but not in reference)

### Diff Formats

**Inline**: `one two [three→tree] four [-five]`  
**Side-by-Side**: Shows reference and hypothesis aligned  
**Unified**: Git-style diff with +/- markers  

---

## 🎨 Component Features

The `TextAlignmentViewerComponent` displays:

### 1. Metrics Dashboard
- **Accuracy Badge**: Green (≥90%), Yellow (70-89%), Red (<70%)
- **WER Badge**: Shows word error rate
- **Statistics Grid**: Matches, Substitutions, Deletions, Insertions

### 2. Token Visualization
- **Color-coded tokens**: 
  - Green border = Match ✓
  - Yellow border = Substitution ⟳
  - Red border = Deletion ✗
  - Blue border = Insertion +
- **Responsive grid**: Adjusts to screen size
- **Hover effects**: Elevation on hover

### 3. Text Comparison
- **Side-by-side view**: Reference vs Hypothesis
- **RTL support**: Proper Arabic text rendering
- **Color-coded borders**: Easy to distinguish

---

## 🔧 Customization

### Custom Tokenizer (e.g., Character-level)

```typescript
const charTokenizer = (text: string) => text.split('');

const aligner = new TextAligner({
  tokenizer: charTokenizer
});

// Now compares character by character instead of word by word
```

### Custom Normalizer (e.g., Remove Punctuation)

```typescript
const noPunctuation = (token: string) => 
  token.toLowerCase().replace(/[^\w]/g, '');

const aligner = new TextAligner({
  normalizer: noPunctuation
});
```

### Different Diff Format

```typescript
// Inline format
const inline = aligner.generateDiff(alignment, { 
  format: 'inline' 
});

// Side-by-side format
const sideBySide = aligner.generateDiff(alignment, { 
  format: 'sideBySide' 
});

// Unified format (like git diff)
const unified = aligner.generateDiff(alignment, { 
  format: 'unified',
  showLineNumbers: true 
});

// With HTML markup
const html = aligner.generateDiff(alignment, { 
  useHtml: true 
});
```

---

## 📚 Learn More

- **Quick Start**: See `TEXT_ALIGNMENT_LIBRARY.md`
- **Full API**: See `src/lib/text-alignment/README.md`
- **Examples**: See `src/lib/text-alignment/examples.ts`
- **Architecture**: See `ARCHITECTURE.md`
- **Implementation**: See `IMPLEMENTATION_SUMMARY.md`

---

## 🐛 Troubleshooting

### Issue: Low accuracy with Arabic text
**Solution**: Make sure you're using the Arabic normalizer:
```typescript
const normalizer = (text: string) => 
  text.replace(/[\u064B-\u065F\u0670]/g, '');
```

### Issue: Component not showing
**Solution**: Check that you have:
1. Imported `TextAlignmentViewerComponent`
2. Added to `imports` array
3. Both `referenceText` and `hypothesisText` are not empty

### Issue: Unexpected alignment
**Solution**: 
- Check your normalizer function
- Try without normalization first
- Verify both texts are properly formatted

---

## 💪 Next Steps

### Immediate:
1. ✅ Test in your app (already integrated!)
2. ✅ Try the demo script
3. ✅ Read the API documentation

### Short-term:
- Customize the component styling
- Add more normalization rules for Arabic variants
- Experiment with different diff formats

### Long-term:
- Add unit tests
- Export results to PDF/CSV
- Track progress over time
- Add audio playback synchronized with alignment

---

## 🎓 Key Concepts

### Word Error Rate (WER)
```
WER = (Substitutions + Deletions + Insertions) / Total Reference Words

Example:
Reference:  "The quick brown fox"   (4 words)
Hypothesis: "The quick brown cat"   (4 words)
Difference: 1 substitution (fox→cat)
WER = 1/4 = 0.25 = 25%
Accuracy = 75%
```

### Levenshtein Distance
The minimum number of edits (substitutions, deletions, insertions) needed to transform one text into another.

### Token-level Alignment
Instead of just counting errors, we align each token (word) to show exactly what happened:
- Which words were correct
- Which words were wrong and how
- Which words were added or missed

---

## 📞 Quick Reference

### Import Library
```typescript
import { TextAligner, compareText } from './lib/text-alignment';
```

### Quick Comparison
```typescript
const result = compareText(reference, hypothesis);
```

### With Options
```typescript
const aligner = new TextAligner({ 
  normalizer: yourNormalizer 
});
const result = aligner.compare(ref, hyp);
```

### Use Component
```html
<app-text-alignment-viewer
  [referenceText]="ref"
  [hypothesisText]="hyp"
  [normalizer]="normalize">
</app-text-alignment-viewer>
```

---

## 🎉 You're Ready!

Everything is set up and integrated. Just run your app and start using it!

```bash
ionic serve
```

Navigate to a memorization item, practice speaking, and click "Show Detailed Analysis" to see the alignment in action!

---

## 💡 Pro Tips

1. **Use normalization** for better accuracy with speech recognition
2. **Cache results** if comparing the same texts multiple times
3. **Show progress** by comparing WER over time
4. **Customize colors** in the component SCSS file
5. **Export data** for external analysis if needed

---

## 🌟 Features at a Glance

| Feature | Status | Description |
|---------|--------|-------------|
| Token Alignment | ✅ | Levenshtein distance algorithm |
| WER Metrics | ✅ | Complete error rate calculations |
| CER Metrics | ✅ | Character-level accuracy |
| Diff Generation | ✅ | 3 formats (inline, side-by-side, unified) |
| Arabic Support | ✅ | Diacritics, normalization, RTL |
| Ionic Component | ✅ | Beautiful visualization |
| Responsive Design | ✅ | Mobile-optimized |
| TypeScript | ✅ | Full type safety |
| Zero Dependencies | ✅ | Framework-agnostic core |
| Documentation | ✅ | Comprehensive guides |

---

**Happy coding!** 🚀

If you have questions, check the documentation files or review the examples.

---

*Built with ❤️ for the Hadith Memorization App*

