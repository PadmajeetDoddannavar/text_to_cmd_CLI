import mongoose from 'mongoose';

const textNoteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  password: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null
  }
});

// Add TTL index for auto-deletion of expired notes
textNoteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TextNote = mongoose.model('TextNote', textNoteSchema);