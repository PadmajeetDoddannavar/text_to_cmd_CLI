import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { TextNote } from './models/TextNote.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('TextShare API is running');
});

// Create or update a text note
app.post('/api/notes', async (req, res) => {
  try {
    const { name, content, password, expiresIn } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ message: 'Name and content are required' });
    }

    // Calculate expiration date if provided
    let expirationDate = null;
    if (expiresIn) {
      expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + parseInt(expiresIn));
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Check if note with this name already exists
    let note = await TextNote.findOne({ name });
    
    if (note) {
      // Update existing note
      note.content = content;
      if (hashedPassword) note.password = hashedPassword;
      if (expirationDate) note.expiresAt = expirationDate;
      await note.save();
    } else {
      // Create new note
      note = new TextNote({
        name,
        content,
        password: hashedPassword,
        expiresAt: expirationDate
      });
      await note.save();
    }

    res.status(201).json({ 
      message: 'Note saved successfully',
      name: note.name
    });
  } catch (error) {
    console.error('Error saving note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a text note
app.get('/api/notes/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const note = await TextNote.findOne({ name });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note has expired
    if (note.expiresAt && new Date() > note.expiresAt) {
      await TextNote.deleteOne({ _id: note._id });
      return res.status(404).json({ message: 'Note has expired and been deleted' });
    }

    // If note has password, don't send content directly
    if (note.password) {
      return res.status(200).json({ 
        name: note.name,
        hasPassword: true,
        content: null,
        createdAt: note.createdAt,
        expiresAt: note.expiresAt
      });
    }

    res.status(200).json({
      name: note.name,
      content: note.content,
      hasPassword: false,
      createdAt: note.createdAt,
      expiresAt: note.expiresAt
    });
  } catch (error) {
    console.error('Error retrieving note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify password and get protected note
app.post('/api/notes/:name/access', async (req, res) => {
  try {
    const { name } = req.params;
    const { password } = req.body;
    
    const note = await TextNote.findOne({ name });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if note has expired
    if (note.expiresAt && new Date() > note.expiresAt) {
      await TextNote.deleteOne({ _id: note._id });
      return res.status(404).json({ message: 'Note has expired and been deleted' });
    }

    // Verify password
    if (!note.password) {
      return res.status(400).json({ message: 'This note is not password protected' });
    }

    const isPasswordValid = await bcrypt.compare(password, note.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({
      name: note.name,
      content: note.content,
      createdAt: note.createdAt,
      expiresAt: note.expiresAt
    });
  } catch (error) {
    console.error('Error accessing protected note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});