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

### Environment Variables

Before deploying, configure the following environment variables:

```bash
# Required: Redis connection URL
REDIS_URL=redis://default:password@host:port

# Required: API authentication key
# Generate using: openssl rand -base64 32
API_KEY=your_secure_api_key_here

# Required: Frontend API key (must match API_KEY)
VITE_API_KEY=your_secure_api_key_here
```

### Deploy to Vercel

1. Install Vercel CLI (optional):
   ```bash
   npm i -g vercel
   ```

2. Set environment variables in Vercel dashboard or CLI:
   ```bash
   vercel env add REDIS_URL
   vercel env add API_KEY
   vercel env add VITE_API_KEY
   ```

3. Deploy:
   ```bash
   vercel
   ```

Or push to GitHub and connect your repository in the [Vercel Dashboard](https://vercel.com/new).

### Security Features

This application includes the following security mechanisms:

1. **API Key Authentication** (required)
   - Protects API endpoints from unauthorized access
   - Both `API_KEY` (backend) and `VITE_API_KEY` (frontend) must be configured
   - Backend validates `x-api-key` header on all protected endpoints
   - Frontend automatically includes API key in requests
   - If API_KEY is not configured, server returns 500 error

2. **CORS Protection**
   - Automatically configured by Vercel
   - Restricts cross-origin requests

**Note:** Rate limiting should be implemented at infrastructure level (e.g., Vercel Edge Config, Cloudflare, or API Gateway) rather than application level for better security.

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
