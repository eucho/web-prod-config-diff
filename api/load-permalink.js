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
