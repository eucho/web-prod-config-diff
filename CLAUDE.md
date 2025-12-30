# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a frontend-only React + Vite application for comparing multi-line configuration text. The app parses configuration lines in the format `Key_1=[config_1][config_2]...[config_n]` and provides side-by-side text comparison with visual diff highlighting using line-based diff (not character-level).

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production (output to dist/)
npm run build

# Preview production build locally
npm run preview
```

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

- **App.jsx**: Main component managing state and workflow
- **TextInputSection**: Side-by-side text areas with submit button
- **ComparisonSection**: Dropdown selectors and DiffViewer container
- **DiffViewer**: Renders highlighted diff with color coding (green=added, red=removed, gray=unchanged)
- **utils/parser.js**: Text parsing utilities

### Text Parsing Logic

The parser (`src/utils/parser.js`) expects each line to follow:
```
Key_Name=[config_1][config_2]...[config_n]
```

- Uses regex `/^(.+?)=(.+)$/` to split key from value
- Returns object with keys mapped to their full config value strings (including brackets)
- Empty lines are filtered out

### Diff Implementation

Uses the `diff` npm package (specifically `Diff.diffLines`) for line-level comparison. The diff result is processed to:
- Add newlines after each `]` character for better readability
- Display differences with color coding:
  - Green background: Added lines
  - Red background: Removed lines
  - Gray text: Unchanged content

### Styling

- Dark theme by default with light mode support
- Responsive design using CSS Grid and Flexbox
- 90% width container centered on page
- Monospace font for text areas and diff display
- Color scheme: #646cff (primary), #28a745 (added), #dc3545 (removed)

## Deployment

Configured for Vercel deployment via `vercel.json`. The build outputs to `dist/` directory which should be served as static files.

## Key Implementation Details

- App width set to 90% for better viewport usage
- Text areas have 15 rows minimum height
- Diff viewer processes config values to add newlines after each `]`
- Supports both dark and light color schemes
- Uses React 18 with Vite for fast development and building