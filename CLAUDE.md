# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a React + Vite application for comparing multi-line configuration text. The app parses configuration lines in the format `Key_1=[config_1][config_2]...[config_n]` and provides side-by-side text comparison with visual diff highlighting using intelligent line-based diff with character-level highlighting for modified lines. It includes permalink functionality to share comparison states via unique URLs backed by Redis storage.

## Application Architecture

### State Management Flow
The app uses a two-phase workflow managed in `src/App.jsx`:

1. **Input Phase**: Users enter text in two side-by-side text areas
2. **Comparison Phase**: After submit, users select keys from dropdowns to compare their config values

State flow:
- `text1`, `text2` → raw input text
- Submit triggers parsing → `parsedText1`, `parsedText2` (key-value objects)
- Keys extracted → `keys1`, `keys2` (arrays for dropdowns)
- Key selection → `selectedKey1`, `selectedKey2`
- `useEffect` hook automatically computes diff when both keys selected
- `diffResult` contains line-level differences using `diff.diffLines`

### Component Structure
- **App.jsx**: Main component managing state and workflow, including permalink state management
- **TextInputSection**: Side-by-side text areas with submit button
- **ComparisonSection**: Dropdown selectors and DiffViewer container
- **DiffViewer**: Renders highlighted diff with color coding (green=added, red=removed, gray=unchanged, side-by-side for modified)
- **PermalinkButton**: UI for generating and displaying shareable permalink URLs
- **utils/parser.js**: Text parsing utilities with variable reference support
- **utils/lineMatcher.js**: Intelligent line matching algorithm for optimal diff pairing

### Text Input Parsing Logic
The parser (`src/utils/parser.js`) expects each line to follow:
```
Key_Name=[config_1][config_2]...[config_n]
```

Features:
- Uses regex `/^(.+?)=(.+)$/` to split key from value
- Returns object with keys mapped to their full config value strings (including brackets)
- Empty lines are filtered out
- **Variable reference support**: Supports `$Base$KeyName$` syntax to reference other keys
  - Two-pass parsing: First extracts all key-value pairs, then resolves variable references
  - Unresolved variables remain as-is in the output

### Diff Implementation
The app uses a sophisticated multi-level diff approach:

#### Line-Level Diff (App.jsx)
- Uses `diff.diffLines` to identify unchanged, removed, and added line blocks
- Config values are preprocessed: newlines added after each `]` for better line-level comparison
- When consecutive removed and added blocks are detected, intelligent matching is applied

#### Intelligent Line Matching (utils/lineMatcher.js)
When removed and added lines have different counts, the matching algorithm:
1. **Calculates similarity scores** between all removed-added line pairs using character-level diff
2. **Greedy matching**: Selects best matches (similarity > 0.3 threshold) in descending order
3. **Outputs**:
   - Matched pairs → `modified` type (will show character-level diff)
   - Unmatched removed lines → `removed` type
   - Unmatched added lines → `added` type
4. **Order preservation**: Maintains relative order of lines from original arrays

#### Character-Level Diff (DiffViewer.jsx)
For lines marked as `modified`:
- Uses `diff.diffChars` to highlight character-level changes
- Displays side-by-side view:
  - Left side (removed): Shows original with highlighted removed/common characters
  - Right side (added): Shows new version with highlighted added/common characters

#### Color Coding
- **Green background**: Added lines (entire line added)
- **Red background**: Removed lines (entire line removed)
- **Gray text**: Unchanged lines
- **Side-by-side with character highlighting**: Modified lines
  - Red highlight: Removed characters
  - Green highlight: Added characters
  - Gray text: Common characters

### Styling
- Responsive design using CSS Grid and Flexbox
- Color scheme: #646cff (primary), #28a745 (added), #dc3545 (removed)

### Permalink Feature
Users can generate shareable permalinks to save and restore comparison states:
- **Frontend**: PermalinkButton component handles URL generation and display with copy-to-clipboard
- **Backend**: Vercel serverless functions (`/api/save-permalink` and `/api/load-permalink`)
- **Storage**: Redis with 8-character nanoid keys, 30-day expiration
- **URL format**: `https://domain.com/?permalink={id}`
- Requires `REDIS_URL` environment variable

## Deployment

Configured for Vercel deployment via `vercel.json`. The build outputs to `dist/` directory which should be served as static files.