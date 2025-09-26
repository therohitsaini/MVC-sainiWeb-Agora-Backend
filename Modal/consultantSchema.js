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
            maxlength: 1000, // optional limit
        },
    },
    { timestamps: true }
);
const consultantSchemaExport = mongoose.model("consultant", consultantSchema);

module.exports = { consultantSchemaExport }
