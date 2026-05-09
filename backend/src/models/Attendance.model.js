import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    latitude:  { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  { _id: false },
);

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },

    // ── Punch times ───────────────────────────────────────
    punchIn: {
      type: Date,
      required: [true, 'Punch-in time is required'],
    },
    punchOut: {
      type: Date,
      default: null,
    },

    // ── Selfie (Base64 data-URL or a hosted URL) ──────────
    selfieImage: {
      type: String,
      default: null,
    },

    // ── Location ──────────────────────────────────────────
    location: {
      type: locationSchema,
      default: null,
    },

    // ── Hours & Shift ─────────────────────────────────────
    totalWorkingHours: {
      type: Number,
      default: null,
      min: [0, 'Working hours cannot be negative'],
    },
    shiftStatus: {
      type: String,
      enum: {
        values: ['Completed', 'Incomplete'],
        message: '{VALUE} is not a valid shift status',
      },
      default: 'Incomplete',
    },

    // ── Validation ────────────────────────────────────────
    validationStatus: {
      type: String,
      enum: {
        values: ['Pending', 'Valid', 'Invalid'],
        message: '{VALUE} is not a valid validation status',
      },
      default: 'Pending',
    },
    validationRemarks: {
      type: String,
      default: null,
      trim: true,
    },
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    validatedAt: {
      type: Date,
      default: null,
    },

    // ── Overtime ──────────────────────────────────────────
    overtimeRequestStatus: {
      type: String,
      enum: {
        values: ['None', 'Pending', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid overtime status',
      },
      default: 'None',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// ── Compound index for fast "today's record" lookups ──────
attendanceSchema.index({ user: 1, punchIn: -1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
