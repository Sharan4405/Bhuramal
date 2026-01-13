import Admin from '../models/Admin.js';
import { generateToken } from '../utils/auth.js';

/**
 * Admin login
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    const admin = await Admin.findOne({ username });
    const isValid = admin && await admin.comparePassword(password);
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = generateToken(admin);
    res.json({ token, username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * Admin logout
 */
export function logout(req, res) {
  res.json({ message: 'Logged out successfully' });
}

/**
 * Create first admin (only if no admins exist)
 */
export async function setup(req, res) {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(400).json({ error: 'Admin already exists' });
    }
    
    const { username, password } = req.body;
    const admin = await Admin.create({ username, password });
    
    res.json({ message: 'Admin created successfully', username: admin.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
