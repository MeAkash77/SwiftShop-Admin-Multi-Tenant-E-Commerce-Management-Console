
/**
 * User model — accounts for superAdmin | vendor | customer.
 * Credentials, OTP, refresh token; tenantId reserved for future use.
 * Live tenancy uses Store.vendorId + Product.vendor (docs/03-DATABASE-MODULES.md).
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: ['superAdmin', 'vendor', 'customer'],
    default :"customer",
    required: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  refreshToken: {
    type: String,
    select: false
  },
  passwordResetToken: {
  type: String,
  default: null
},

passwordResetExpires: {
  type: Date,
  default: null
},
  // Profile Image Fields
  profileImage: {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    thumbnail: { type: String, default: null },
    uploadedAt: { type: Date, default: null }
  },

  // OTP Fields
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  otp: {
    code: { type: String, select: false, default: null },
    type: { type: String, enum: ['email_verification', 'phone_verification', 'password_reset', 'login'], select: false },
    expiresAt: { type: Date, select: false, default: null },
    attempts: { type: Number, default: 0, select: false },
    createdAt: { type: Date, default: Date.now, select: false }
  },

  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  tenantId: { type: String, default: null }

}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Clear OTP method
userSchema.methods.clearOTP = async function () {
  this.otp = { code: null, type: null, expiresAt: null, attempts: 0 };
  await this.save({ validateBeforeSave: false });
};

// Check if OTP is expired
userSchema.methods.isOTPExpired = function () {
  return this.otp.expiresAt && this.otp.expiresAt < new Date();
};

// Increment OTP attempts
userSchema.methods.incrementOTPAttempts = async function () {
  this.otp.attempts += 1;
  await this.save({ validateBeforeSave: false });
};

userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ tenantId: 1 });

const userModel = mongoose.model('User', userSchema);
export default userModel;

