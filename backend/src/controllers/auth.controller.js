import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user exists
  let user = await User.findOne({ email });
  
  if (user) {
    // If user exists, update their role and password (helpful for dev testing)
    user.name = name || user.name;
    user.password = password;
    user.role = role || user.role;
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      name,
      email,
      password,
      role: role || 'employee',
    });
  }

  if (user) {
    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(400).json({ success: false, error: 'Invalid user data' });
  }
};

/**
 * @desc    Authenticate a user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } else {
    res.status(401).json({ success: false, error: 'Invalid email or password' });
  }
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};
