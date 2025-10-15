// User info endpoint for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        detail: 'Authorization token required' 
      });
    }

    // For demo purposes, return a mock user
    // In a real app, you'd verify the token and get user from database
    const mockUser = {
      id: '1',
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'user',
      created_at: new Date().toISOString()
    };

    return res.status(200).json(mockUser);

  } catch (error) {
    console.error('Auth check error:', error);
    return res.status(500).json({ 
      detail: 'Internal server error' 
    });
  }
}
