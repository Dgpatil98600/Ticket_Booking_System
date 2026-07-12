
import User from '../models/User.js';
import { generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken, } from '../utils/tokenUtils.js';

const registerUser = async ({ name, email, password, role, phone, adminSecret }) => {
  
  if (role === 'admin') {
    if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
      throw { statusCode: 403, message: 'Invalid admin registration secret' };
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw { statusCode: 409, message: 'An account with this email already exists' };
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || 'customer',
    phone,
  });

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+password +refreshToken');

  if (!user) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  if (!user.isActive) {
    throw { statusCode: 403, message: 'Account has been deactivated. Contact support.' };
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw { statusCode: 401, message: 'Invalid email or password' };
  }

  user.lastLogin = new Date();

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { user: user.toPublicJSON(), accessToken, refreshToken };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw { statusCode: 401, message: 'Refresh token required' };
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    throw { statusCode: 401, message: 'Invalid refresh token' };
  }

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  return { accessToken };
};

const logoutUser = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: null });
};

export { registerUser, loginUser, refreshAccessToken, logoutUser };
