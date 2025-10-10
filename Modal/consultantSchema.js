const mongoose = require("mongoose")

const consultantSchema = new mongoose.Schema(
    {
        fullName: {
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
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        profession: {
            type: String,
            required: true,
            trim: true,
        },
        specialization: {
            type: String,
            required: true,
            trim: true,
        },
        licenseNo: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        experience: {
            type: Number, // in years
            required: true,
            min: 0,
        },
        fees: {
            type: Number,
            required: true,
            min: 0,
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        consultantStatus: {
            type: Boolean,
            default: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        role: {
            type: String,
            default: "consultant"
        },
        language: {
            type: Array,
            required: true,
            trim: true,
        }
    },
    { timestamps: true }
);
const consultantSchemaExport = mongoose.model("consultant", consultantSchema);

module.exports = { consultantSchemaExport }
 