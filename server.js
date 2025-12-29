// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// --- 1. DATABASE CONNECTION ---
// Replace the string below with your own MongoDB Connection String later
// For now, if you have MongoDB installed locally, use: 'mongodb://localhost:27017/habittracker'
// Or use a free Atlas Cloud URL.
const MONGO_URI = 'mongodb://localhost:27017/habittracker'; 

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// --- 2. DATABASE SCHEMA ---
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Will be hashed
    habits: { type: Array, default: [] },
    notes: { type: String, default: "" }
});

const User = mongoose.model('User', UserSchema);

// --- 3. API ROUTES ---

// REGISTER (SIGN UP)
app.post('/signup', async (req, res) => {
    const { username, password, defaultHabits } = req.body;

    try {
        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Hash the password (Security)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = new User({
            username,
            password: hashedPassword,
            habits: defaultHabits,
            notes: "Welcome! This data is stored in your own database."
        });

        await newUser.save();
        res.json({ message: "User created successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// LOGIN
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: "User not found" });

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        // Return user data (excluding password)
        res.json({
            username: user.username,
            habits: user.habits,
            notes: user.notes
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE DATA (SYNC)
app.post('/update-data', async (req, res) => {
    const { username, habits, notes } = req.body;
    
    try {
        await User.findOneAndUpdate({ username }, { habits, notes });
        res.json({ message: "Data saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// START SERVER
app.listen(5000, () => console.log('Server running on port 5000'));