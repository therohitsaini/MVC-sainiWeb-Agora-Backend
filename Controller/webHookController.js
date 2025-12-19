const webhooksOrdersPaid = async (req, res) => {
    try {
        const data = req.body;
        console.log("Orders paid webhook received:", data);
        // Yahan payment verify karke DB update karna
        res.status(200).send("Webhook received");
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while processing webhook"
        });
    }
}
module.exports = { webhooksOrdersPaid };