
import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

const register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, adminSecret } = req.body;
    const result = await authService.registerUser({ name, email, password, role, phone, adminSecret });

    console.log('\n[API Success] 🟢 User registered successfully:', {
      name: result.user.name,
      email: result.user.email,
      role: result.user.role,
    });

    return successResponse(
      res,
      { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
      'Registration successful',
      201
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    return successResponse(
      res,
      { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
      'Login successful'
    );
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshAccessToken(refreshToken);
    return successResponse(res, result, 'Token refreshed');
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);
    return successResponse(res, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return successResponse(res, { user: req.user.toPublicJSON() }, 'User profile retrieved');
};

export { register, login, refresh, logout, getMe };
