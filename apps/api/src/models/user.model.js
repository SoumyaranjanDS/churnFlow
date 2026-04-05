const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["admin", "manager", "agent"],
      default: "agent",
      index: true,
    },
    defaultTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    lastSelectedTenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    emailVerificationTokenHash: {
      type: String,
      select: false,
    },
    emailVerificationExpiresAt: {
      type: Date,
      select: false,
    },
    emailVerificationSentAt: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
    passwordResetSentAt: {
      type: Date,
      select: false,
    },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.comparePassword = async function comparePassword(plainPassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.createEmailVerificationToken = function createEmailVerificationToken(ttlMinutes = 60) {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");

  this.emailVerificationTokenHash = tokenHash;
  this.emailVerificationExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  this.emailVerificationSentAt = new Date();

  return plainToken;
};

userSchema.methods.isValidEmailVerificationToken = function isValidEmailVerificationToken(plainToken) {
  if (!plainToken || !this.emailVerificationTokenHash || !this.emailVerificationExpiresAt) {
    return false;
  }

  if (this.emailVerificationExpiresAt.getTime() < Date.now()) {
    return false;
  }

  const incomingHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  const stored = Buffer.from(this.emailVerificationTokenHash, "utf8");
  const incoming = Buffer.from(incomingHash, "utf8");

  if (stored.length !== incoming.length) {
    return false;
  }

  return crypto.timingSafeEqual(stored, incoming);
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken(ttlMinutes = 30) {
  const plainToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(plainToken).digest("hex");

  this.passwordResetTokenHash = tokenHash;
  this.passwordResetExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  this.passwordResetSentAt = new Date();

  return plainToken;
};

userSchema.methods.isValidPasswordResetToken = function isValidPasswordResetToken(plainToken) {
  if (!plainToken || !this.passwordResetTokenHash || !this.passwordResetExpiresAt) {
    return false;
  }

  if (this.passwordResetExpiresAt.getTime() < Date.now()) {
    return false;
  }

  const incomingHash = crypto.createHash("sha256").update(plainToken).digest("hex");
  const stored = Buffer.from(this.passwordResetTokenHash, "utf8");
  const incoming = Buffer.from(incomingHash, "utf8");

  if (stored.length !== incoming.length) {
    return false;
  }

  return crypto.timingSafeEqual(stored, incoming);
};

userSchema.methods.clearPasswordResetToken = function clearPasswordResetToken() {
  this.passwordResetTokenHash = undefined;
  this.passwordResetExpiresAt = undefined;
  this.passwordResetSentAt = undefined;
};

const User = mongoose.model("User", userSchema);

module.exports = { User };
