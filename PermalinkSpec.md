# Permalink Feature Design Specification (Simplified)

## Overview
Add simple permalink generation and loading functionality. Users can generate shareable links to save their current text1 and text2 configurations.

## User Experience

### Generating Permalink
1. User sees "Generate Permalink" button in the top-right corner of the page
2. After clicking, a link appears below the button: `https://yourdomain.com/?permalink=xxxxxxxx`
3. Each click generates a new link, replacing the previously displayed link (if any)

### Loading Configuration via Permalink
1. User visits `https://yourdomain.com/?permalink=xxxxxxxx`
2. Page automatically loads corresponding text1 and text2 into input fields
3. If permalink ID is invalid or doesn't exist, text1 and text2 remain as empty strings (no error message displayed)

## Redis Capacity Management Strategy

### Capacity Constraints
- **Redis Storage Capacity**: 30MB
- **Estimated Storage**:
  - Assuming 1KB average per config → ~20,000-25,000 permalinks
  - Assuming 5KB average per config → ~4,000-5,000 permalinks
  - Actual capacity accounts for Redis metadata overhead

### Eviction Policy Configuration

**Recommended Policy**: `volatile-lru` (Least Recently Used)

**Rationale**:
- All permalinks have 30-day expiration time
- When memory is full, automatically deletes least recently accessed keys
- Preserves frequently accessed popular configs
- Newly created configs are prioritized

**Configuration Steps**:
1. Log into Redis service provider console (e.g., Upstash)
2. Find database instance settings
3. In Configuration/Advanced Settings, set:
   ```
   maxmemory-policy volatile-lru
   ```
4. Alternative policy: `volatile-ttl` (prioritizes deleting keys with shortest TTL)

**Other Optional Policies**:
- `allkeys-lru`: Deletes least used keys from all keys (if all data is replaceable)
- `volatile-ttl`: Prioritizes deleting keys with shortest TTL (preserves newly created)
- `noeviction` (default): Rejects writes when memory is full ⚠️ Not recommended

### Behavior When Memory is Full

**Without eviction policy configured**:
- Redis returns `OOM` (Out Of Memory) error
- Write operations fail
- Frontend displays error message

**With `volatile-lru` configured**:
- Automatically deletes least recently accessed permalinks
- New writes succeed
- Transparent to users

## Technical Implementation

### Backend API

#### 1. POST /api/save-permalink
**Request Body**:
```json
{
  "text1": "string",
  "text2": "string"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "id": "abc12345",
  "url": "https://yourdomain.com/?permalink=abc12345"
}
```

**Response (Storage Full)**:
```json
{
  "success": false,
  "error": "Storage limit reached. Please try again later."
}
```

**Implementation Details**:
- Use `nanoid(8)` to generate 8-character ID
- Store to Redis: key = `permalink:{id}`, value = JSON.stringify({text1, text2, createdAt})
- Set 30-day expiration time
- Use `REDIS_URL` environment variable for connection
- **Catch OOM errors and return friendly message**

#### 2. GET /api/load-permalink?id=xxx
**Response (Success)**:
```json
{
  "success": true,
  "text1": "...",
  "text2": "..."
}
```

**Response (Failure/Not Found)**:
```json
{
  "success": false
}
```

**Implementation Details**:
- Read from Redis: `permalink:{id}`
- If not found or error occurs, return `success: false` (frontend keeps text1/text2 empty)

### Frontend Changes

#### 1. App.jsx

**Add New State** (~line 19):
```javascript
const [permalinkUrl, setPermalinkUrl] = useState(null);
const [isGenerating, setIsGenerating] = useState(false);
```

**Initialization Loading** (add useEffect):
```javascript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const permalinkId = urlParams.get('permalink');

  if (permalinkId) {
    loadPermalink(permalinkId);
  }
}, []);

const loadPermalink = async (id) => {
  try {
    const response = await fetch(`/api/load-permalink?id=${id}`);
    const result = await response.json();

    if (result.success) {
      setText1(result.text1 || '');
      setText2(result.text2 || '');
    }
    // On failure, do nothing - text1/text2 remain as default empty strings
  } catch (error) {
    // Silent failure, no error display
    console.error('Load permalink error:', error);
  }
};
```

**Generate Permalink Function**:
```javascript
const handleGeneratePermalink = async () => {
  setIsGenerating(true);
  setPermalinkUrl(null);

  try {
    const response = await fetch('/api/save-permalink', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text1, text2 }),
    });

    const result = await response.json();

    if (result.success) {
      setPermalinkUrl(result.url);
    } else {
      // Display storage full or other errors
      alert(result.error || 'Failed to generate permalink. Please try again.');
    }
  } catch (error) {
    alert('Network error. Please check your connection and try again.');
  } finally {
    setIsGenerating(false);
  }
};
```

**Pass Props to Header Component** (~line 88):
```javascript
// In App component's return, add header area
<div className="app-header">
  <h1>Web Prod Config Diff</h1>
  <PermalinkButton
    onGenerate={handleGeneratePermalink}
    isGenerating={isGenerating}
    permalinkUrl={permalinkUrl}
  />
</div>
```

#### 2. New Component: PermalinkButton.jsx

Location: `/Users/sunshaohua/projects/web-prod-config-diff/src/components/PermalinkButton.jsx`

```javascript
function PermalinkButton({ onGenerate, isGenerating, permalinkUrl }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(permalinkUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="permalink-container">
      <button
        className="permalink-button"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Generate Permalink'}
      </button>

      {permalinkUrl && (
        <div className="permalink-display">
          <input
            type="text"
            value={permalinkUrl}
            readOnly
            onClick={(e) => e.target.select()}
          />
          <button onClick={handleCopy}>Copy</button>
        </div>
      )}
    </div>
  );
}

export default PermalinkButton;
```

#### 3. CSS Styles (App.css)

```css
/* App header area */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e0e0e0;
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
}

/* Permalink container */
.permalink-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

/* Permalink button */
.permalink-button {
  background-color: #646cff;
  color: white;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.permalink-button:hover {
  background-color: #535bf2;
}

.permalink-button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

/* Permalink display area */
.permalink-display {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.permalink-display input {
  width: 350px;
  padding: 0.4rem 0.8rem;
  border: 1px solid #d0d0d0;
  border-radius: 4px;
  font-size: 0.85rem;
  font-family: monospace;
}

.permalink-display button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 0.4rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.permalink-display button:hover {
  background-color: #218838;
}
```

### Dependencies Installation

```bash
npm install nanoid@^4.0.0 redis@^4.6.0
```

**package.json Update**:
```json
{
  "dependencies": {
    "diff": "^8.0.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "nanoid": "^4.0.0",
    "redis": "^4.6.0"
  }
}
```

## File Structure

```
/Users/sunshaohua/projects/web-prod-config-diff/
├── api/
│   ├── save-permalink.js          # New: Save config API
│   └── load-permalink.js          # New: Load config API
├── src/
│   ├── App.jsx                    # Modified: Add permalink logic
│   ├── App.css                    # Modified: Add styles
│   └── components/
│       └── PermalinkButton.jsx    # New: Permalink button component
├── package.json                   # Modified: Add dependencies
└── PermalinkSpec.md              # This document
```

## API Implementation Details

### /api/save-permalink.js

```javascript
import { createClient } from 'redis';
import { nanoid } from 'nanoid';

// Create Redis client (using REDIS_URL environment variable)
const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { text1, text2 } = req.body;

    // Generate 8-character ID
    const id = nanoid(8);

    // Connect to Redis
    await client.connect();

    // Save data (30-day expiration)
    const data = JSON.stringify({
      text1: text1 || '',
      text2: text2 || '',
      createdAt: new Date().toISOString()
    });

    try {
      await client.setEx(`permalink:${id}`, 2592000, data); // 30 days = 2592000 seconds
    } catch (setError) {
      // Catch memory full errors
      if (setError.message && (
          setError.message.includes('OOM') ||
          setError.message.includes('maxmemory') ||
          setError.message.includes('out of memory')
      )) {
        await client.disconnect();
        return res.status(507).json({
          success: false,
          error: 'Storage limit reached. Please try again later.'
        });
      }
      throw setError;
    }

    await client.disconnect();

    // Build URL
    const baseUrl = `https://${req.headers.host}`;
    const url = `${baseUrl}/?permalink=${id}`;

    return res.status(200).json({
      success: true,
      id,
      url
    });

  } catch (error) {
    console.error('Save permalink error:', error);

    // Ensure disconnection
    try {
      await client.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }

    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
```

### /api/load-permalink.js

```javascript
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.error('Redis Client Error', err));

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(200).json({ success: false });
    }

    await client.connect();

    const data = await client.get(`permalink:${id}`);

    await client.disconnect();

    if (!data) {
      return res.status(200).json({ success: false });
    }

    const parsed = JSON.parse(data);

    return res.status(200).json({
      success: true,
      text1: parsed.text1,
      text2: parsed.text2
    });

  } catch (error) {
    console.error('Load permalink error:', error);

    // Ensure disconnection
    try {
      await client.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors
    }

    return res.status(200).json({ success: false });
  }
}
```

## Environment Variable Configuration

### Vercel Environment Variables
Add in Vercel project settings:
- `REDIS_URL`: Your Redis connection string (already created)

Example format:
```
redis://default:password@host:port
```

### Local Development
Create `.env.local` file:
```
REDIS_URL=redis://default:your-password@your-host:port
```

Add to `.gitignore`:
```
.env.local
```

## Redis Monitoring and Maintenance

### Monitoring Metrics
Regularly check the following metrics (in Redis provider console):
- **Memory Usage**: Start monitoring when reaching 80%
- **Hit Rate**: Understand how frequently permalinks are accessed
- **Eviction Count**: Monitor how much old data is automatically deleted

### Capacity Optimization Recommendations
If frequently approaching capacity limit:
1. **Reduce TTL**: Change from 30 days to 14 or 7 days
2. **Compress Data**: Use gzip compression before storage (requires additional dependencies)
3. **Upgrade Capacity**: Consider upgrading to larger Redis instance
4. **Data Cleanup**: Periodically delete permalinks with zero access count

### Compression Implementation Example (Optional)
If space saving is needed, compress before saving:

```javascript
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Compress when saving
const compressed = await gzipAsync(JSON.stringify(data));
await client.setEx(`permalink:${id}`, 2592000, compressed);

// Decompress when loading
const compressed = await client.getBuffer(`permalink:${id}`);
const data = JSON.parse((await gunzipAsync(compressed)).toString());
```

## Local Development and Testing

```bash
# Install dependencies
npm install

# Local development (requires Vercel CLI)
vercel dev

# Or use Vite dev (but API needs separate running)
npm run dev
```

### Test Scenarios

#### 1. Basic Functionality Testing
- Enter text1 and text2
- Click "Generate Permalink"
- Verify displayed URL
- Copy link and open in new tab
- Verify data loads correctly

#### 2. Edge Case Testing
- **Empty config**: Generate permalink when both text1 and text2 are empty
- **Large config**: Input very large text (close to 5KB)
- **Invalid ID**: Visit `?permalink=invalid123`, verify stays blank
- **Expired data**: Wait 30 days or manually delete Redis key

#### 3. Error Handling Testing
- **Network disconnected**: Click generate when offline, verify error message
- **Redis connection failure**: Temporarily modify REDIS_URL, verify error handling
- **Storage full**: Simulate memory full scenario (manually fill Redis)

#### 4. Performance Testing
- Rapidly click generate button repeatedly, verify no duplicate requests
- Open multiple tabs loading same permalink simultaneously
- Test response time after storing large number of permalinks

## Implementation Steps Summary

### Step 1: Preparation
1. Install dependencies: `npm install nanoid redis`
2. Configure Redis eviction policy to `volatile-lru`
3. Set `REDIS_URL` environment variable in Vercel

### Step 2: Create APIs
1. Create `api/save-permalink.js` (including OOM error handling)
2. Create `api/load-permalink.js`

### Step 3: Frontend Implementation
1. Create `src/components/PermalinkButton.jsx`
2. Modify `src/App.jsx`:
   - Add state and functions
   - Add header area and PermalinkButton component
   - Add initialization loading logic
3. Update `src/App.css`: Add styles

### Step 4: Testing and Deployment
1. Test all functionality locally
2. Deploy to Vercel: `vercel --prod`
3. End-to-end testing
4. Monitor Redis usage

## Key Technical Points

- **Redis Connection**: Connect/disconnect on each API call (Serverless best practice)
- **ID Generation**: nanoid(8) generates 8-character short ID (extremely low collision probability)
- **Silent Failure**: No error display on load failure, text1/text2 remain empty
- **State Management**: Use React useState to manage permalink URL and loading state
- **URL Parameters**: Use URLSearchParams to read `?permalink=xxx`
- **Error Handling**: Catch OOM errors and provide user-friendly messages
- **Capacity Management**: Use volatile-lru to automatically clean old data

## Security and Performance Considerations

### Security
- **Input Validation**: API validates all input parameters
- **Data Size Limit** (optional): Limit single config to max 100KB
- **Rate Limiting** (optional): Use Vercel Edge Config or Redis for implementation

### Performance
- **Auto Expiration**: Auto cleanup after 30 days, reduces storage pressure
- **Connection Pooling** (optional): Consider Redis connection pool in high-traffic scenarios
- **CDN Caching**: Static assets accelerated via Vercel CDN
- **Minimize Data**: Only store necessary text1 and text2 fields

## Troubleshooting

### Common Issues

**Issue 1: Generate permalink fails with "Storage limit reached"**
- **Cause**: Redis memory is full
- **Solution**:
  1. Check if Redis eviction policy is configured to `volatile-lru`
  2. Monitor memory usage, consider shortening TTL or upgrading capacity
  3. Check for abnormally large configs consuming space

**Issue 2: Data is empty when loading permalink**
- **Cause**: ID doesn't exist or has expired
- **Behavior**: This is expected, text1/text2 remain empty strings

**Issue 3: Local development API cannot connect to Redis**
- **Cause**: REDIS_URL environment variable not set
- **Solution**: Create `.env.local` file and configure REDIS_URL

**Issue 4: API returns 500 error after deployment**
- **Cause**: Vercel environment variables not configured
- **Solution**: Add REDIS_URL environment variable in Vercel project settings

## Future Optimization Directions (Optional)

1. **Compression Storage**: Use gzip compression, can save 60-80% space
2. **Access Statistics**: Record access count for each permalink
3. **Custom TTL**: Allow users to choose 7 days/30 days/permanent
4. **Batch Export**: Support exporting all saved configs
5. **User Authentication**: Restrict saving to logged-in users only
