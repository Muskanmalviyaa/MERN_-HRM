import mongoose from 'mongoose';

const overtimeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      index: true,
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: [true, 'Attendance reference is required'],
    },

    // ── Request details ───────────────────────────────────
    hoursRequested: {
      type: Number,
      required: [true, 'Hours requested is required'],
      min: [0.5, 'Minimum 0.5 hours can be requested'],
      max: [12, 'Maximum 12 hours can be requested'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for overtime is required'],
      trim: true,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },

    // ── Review ────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Approved', 'Rejected'],
        message: '{VALUE} is not a valid overtime status',
      },
      default: 'Pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNote: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'Review note cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

overtimeSchema.index({ status: 1 });

const Overtime = mongoose.model('Overtime', overtimeSchema);
export default Overtime;
