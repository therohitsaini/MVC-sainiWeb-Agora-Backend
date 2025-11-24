const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        // userId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "ragisterUser",
        //     required: true,
        // },
        // consultantId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "ragisterUser",
        //     required: true,
        // },
        userName: {
            type: String,
            required: true,
        },
        contactNumber: {
            type: Number,
            require: true
        },
        consultType: {
            type: String,
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        timeSlot: {
            type: String,
            // required: true,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
        },
        notes: {
            type: String,
            default: "",
        },
        mode: {
            type: String,
            enum: ["online", "offline"],
            default: "online",
        },
        payment: {
            amount: {
                type: Number,
                default: 0
            },
            status: {
                type: String,
                enum: ["pending", "paid", "failed", "refunded"],
                default: "pending",
            },
            transactionId: { type: String },
        },
    },
    { timestamps: true }
);

// Model already exists check karo - duplicate model name se bachne ke liye
module.exports = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);
