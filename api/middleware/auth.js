// Simple API key authentication middleware
export function authenticateApiKey(req, res) {
  const apiKey = req.headers['x-api-key'];
  const validApiKey = process.env.API_KEY;

  // Require API_KEY to be configured
  if (!validApiKey) {
    res.status(500).json({
      success: false,
      error: 'Server configuration error: API key not configured'
    });
    return false;
  }

  // Validate API key
  if (!apiKey || apiKey !== validApiKey) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or missing API key'
    });
    return false;
  }

  return true;
}
