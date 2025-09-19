
const Razorpay = require('razorpay');
const crypto = require('crypto');
// aapke DB ka model
const dotenv = require('dotenv');
const User = require('../Modal/userSchema');
dotenv.config();


const razorpay = new Razorpay({
    key_id: process.env.RZP_KEY_ID || "rzp_test_RJ31PhSmp5nbLQ",
    key_secret: process.env.RZP_KEY_SECRET || "I9MA5kEoyVzD4197MaAfYlGv"
});


const createOrderController = async (req, res) => {
    try {
        const { amountINR, userId } = req.body;
        const order = await razorpay.orders.create({
            amount: amountINR * 100,
            currency: 'INR',
            receipt: `wallet_${userId}_${Date.now()}`
        });
        console.log("order", order)
        res.json({ success: true, order });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
}

/** Verify Payment & Add Wallet Balance
 * POST /api/razerpay-verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amountINR }  
 * 
 */

const verifyPaymentController = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, amountINR } = req.body;

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RZP_KEY_SECRET)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {
            // payment authentic -> add money to wallet
            await User.findByIdAndUpdate(userId, { $inc: { walletBalance: amountINR } });
            return res.json({ success: true, message: 'Wallet recharged successfully' });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


module.exports = { createOrderController, verifyPaymentController };
