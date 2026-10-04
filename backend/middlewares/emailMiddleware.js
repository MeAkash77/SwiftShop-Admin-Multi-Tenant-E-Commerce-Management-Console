import { body, validationResult } from "express-validator";

/** Keep emails as trim + lowercase only — do not strip Gmail dots/aliases. */
export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .trim()
    .toLowerCase(),
  body("password")
    .isString()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || "Invalid login details",
        errors: errors.array(),
      });
    }
    next();
  },
];

export const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Valid email is required")
    .trim()
    .toLowerCase(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array()[0]?.msg || "Invalid email",
        errors: errors.array(),
      });
    }
    next();
  },
];
