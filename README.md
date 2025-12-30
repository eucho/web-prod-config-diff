# Web Prod Config Diff

A React + Vite web application ready for deployment.

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to view your app.

### Build

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

### Deploy to Vercel

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

Or push to GitHub and connect your repository in the [Vercel Dashboard](https://vercel.com/new).

### Deploy to Other Platforms

- **Netlify**: Drag and drop the `dist/` folder or connect your Git repository
- **GitHub Pages**: Use `gh-pages` package or GitHub Actions
- **Custom Server**: Upload the `dist/` folder to any static hosting service

## Project Structure

```
.
├── src/
│   ├── App.jsx         # Main app component
│   ├── App.css         # App styles
│   ├── main.jsx        # Entry point
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies and scripts
```
