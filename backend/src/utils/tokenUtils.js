
import jwt from 'jsonwebtoken';

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const generateOfferToken = (payload) => {
  const ttlMinutes = parseInt(process.env.WAITLIST_OFFER_TTL_MINUTES || '15');
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: `${ttlMinutes}m`,
  });
};

const verifyOfferToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

export { generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateOfferToken,
  verifyOfferToken, };
