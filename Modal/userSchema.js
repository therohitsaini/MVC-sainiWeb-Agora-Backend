const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "fullname is required"],
        unique: false,
        trim: true,
        minlength: [3, "fullname must be at least 3 characters long"],
        maxlength: [30, "fullname cannot exceed 30 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters long"]
    },
    agoraUid: {
        type: Number,
        unique: true
    },
    walletBalance: {
        type: Number,
        default: 100
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Create and export the User model
const User = mongoose.model("ragisterUser", userSchema);

module.exports = User;
