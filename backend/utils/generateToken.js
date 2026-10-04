import jwt from "jsonwebtoken";
import crypto from "crypto";
import envConfig from "../configs/envConfig.js";

export const ACCESS_TOKEN_EXPIRES = envConfig.JWT_ACCESS_EXPIRES || "1h";
export const REFRESH_TOKEN_EXPIRES = envConfig.JWT_REFRESH_EXPIRES || "30d";

/** Convert "30d" / "1h" / "15m" style values to milliseconds */
export function durationToMs(value, fallbackMs) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return amount * mult;
}

export function getRefreshMaxAgeMs() {
  return durationToMs(REFRESH_TOKEN_EXPIRES, 30 * 24 * 60 * 60 * 1000);
}

// Access Token (short-lived)
export const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    envConfig.JWT_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES }
  );
};

// Refresh Token (long-lived — keeps the user logged in)
export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      // unique per issue so rotations invalidate previous tokens
      tv: crypto.randomBytes(8).toString("hex"),
    },
    envConfig.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES }
  );
};

// password reset token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
