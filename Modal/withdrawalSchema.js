const WithdrawalSchema = new mongoose.Schema({
    consultantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Consultant",
        required: true
    },

    shopId: String,

    amount: {
        type: Number,
        required: true
    },

    note: String,

    status: {
        type: String,
        enum: ["pending", "paid", "rejected"],
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    paidAt: Date
});
const WithdrawalRequest = mongoose.model("WithdrawalRequest", WithdrawalSchema);

module.exports = { WithdrawalRequest }
