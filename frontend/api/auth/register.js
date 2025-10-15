// Simple registration endpoint for Vercel
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        detail: 'Name, email, and password are required' 
      });
    }

    // For demo purposes, create a mock successful response
    // In a real app, you'd save to a database and hash the password
    const mockUser = {
      id: Date.now().toString(),
      name: name,
      email: email,
      role: 'user',
      created_at: new Date().toISOString()
    };

    const mockToken = 'mock-jwt-token-' + Date.now();

    return res.status(200).json({
      access_token: mockToken,
      token_type: 'bearer',
      user: mockUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      detail: 'Internal server error' 
    });
  }
}
