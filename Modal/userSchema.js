// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema({
//     fullname: {
//         type: String,
//         required: [true, "fullname is required"],
//         unique: false,
//         trim: true,
//         minlength: [3, "fullname must be at least 3 characters long"],
//         maxlength: [30, "fullname cannot exceed 30 characters"]
//     },
//     email: {
//         type: String,
//         required: [true, "Email is required"],
//         unique: true,
//         trim: true,
//         lowercase: true,
//         match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"]
//     },
//     password: {
//         type: String,
//         required: [true, "Password is required"],
//         minlength: [6, "Password must be at least 6 characters long"]
//     },
//     agoraUid: {
//         type: Number,
//         unique: true
//     },
//     walletBalance: {
//         type: Number,
//         default: 100
//     },
//     isActive: {
//         type: Boolean,
//         default: false
//     },
//     role: {
//         type: String,
//         default: "user"
//     },
//     consultantStatus: {
//         type: Boolean,
//         default: true
//     }
// }, {
//     timestamps: true // Adds createdAt and updatedAt fields
// });

// // Create and export the User model
// const User = mongoose.model("ragisterUser", userSchema);

// module.exports = User;


const mongoose = require("mongoose");

const registerUserSchema = new mongoose.Schema(
    {
        // Common fields
        fullname: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        role: {
            type: String,
            enum: ["user", "consultant"],
            default: "user",
        },

        // USER-SPECIFIC FIELDS
        agoraUid: {
            type: Number,
            unique: true,
            sparse: true, // important so MongoDB allows null values
        },
        walletBalance: {
            type: Number,
            
        },

        // CONSULTANT-SPECIFIC FIELDS
        phone: {
            type: String,
            trim: true,
        },
        profession: {
            type: String,
            trim: true,
        },
        specialization: {
            type: String,
            trim: true,
        },
        licenseNo: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },
        experience: {
            type: Number,
            min: 0,
        },
        fees: {
            type: Number,
            min: 0,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        language: {
            type: [String],
        },
        consultantStatus: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("newUser", registerUserSchema);

module.exports = User;

