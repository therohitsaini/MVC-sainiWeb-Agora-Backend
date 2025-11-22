const mongoose = require("mongoose");

const registerUserSchema = new mongoose.Schema(
    {
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
        shop_id: {
            type: String,
        },
        password: {
            type: String,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // User Type
        userType: {
            type: String,
            required: true,
        },

        displayName: {
            type: String,
            required: true,
        },

        phone: {
            type: String,
            required: true,
        },

        // Consultant Details
        experience: {
            type: String,
            required: true,
        },
        fees: {
            type: String,
            required: true,
        },
        language: {
            type: Array,
            required: true,
        },
        bio: {
            type: String,
            // required: true,
        },
        gender: {
            type: String,
            required: true,
        },

        // Address Fields
        houseNumber: {
            type: String,
            required: true,
        },
        streetArea: {
            type: String,
            required: true,
        },
        landmark: {
            type: String,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        pincode: {
            type: String,
            required: true,
        },

        dateOfBirth: {
            type: Date,
            required: true,
        },

        pan_cardNumber: {
            type: String,
            required: true,
        },

        // User-specific
        agoraUid: {
            type: Number,
            unique: true,
            sparse: true, // null values ko ignore karega - duplicate error se bachayega
        },
        walletBalance: {
            type: Number,
            default: 0
        },

        profession: {
            type: String,
            required: true,
        },
        specialization: {
            type: String,
            required: true,
        },
        licenseNo: {
            type: String,
            required: true,
        },
        consultantStatus: {
            type: Boolean,

        },
        profileImage: {
            type: String,
            // required: true,
            default: null,
        },

        // Shopify
        shopifyCustomerId: {
            type: String,
            sparse: true,
            trim: true,
        }
    },
    { timestamps: true }
);

// Model already exists check karo - duplicate model name se bachne ke liye
const User = mongoose.models.ragisterUser || mongoose.model("ragisterUser", registerUserSchema);

module.exports = { User };
