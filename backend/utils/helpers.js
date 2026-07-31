const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '8830862537';

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate token
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// Validate required fields
const validateRequired = (fields, required) => {
  const missing = required.filter(field => !fields[field]);
  if (missing.length > 0) {
    return { valid: false, missing };
  }
  return { valid: true };
};

// Format date
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Calculate age from date of birth
const calculateAge = (dob) => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Generate random ID
const generateId = (prefix = '') => {
  return prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  validateRequired,
  formatDate,
  calculateAge,
  generateId
};