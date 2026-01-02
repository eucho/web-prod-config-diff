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
