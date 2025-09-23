

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "../frontend")));

// MongoDB connection
const mongoURI = "mongodb://127.0.0.1:27017/street_safety"; // update if using Atlas
mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define a hazard schema
const hazardSchema = new mongoose.Schema({
    type: String,
    lat: Number,
    lng: Number,
    risk: String,
    warning: String
});

const Hazard = mongoose.model("Hazard", hazardSchema);

// API endpoint to get all hazards
app.get("/api/hazards", async (req, res) => {
    try {
        const hazards = await Hazard.find();
        res.json(hazards);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve map.html as default route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/map.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
