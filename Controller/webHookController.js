
const webhooksOrdersCreated = async (req, res) => {
    try {
        const data = req.body;
        console.log("Orders created webhook received:", data);
        res.status(200).send("Webhook received");
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while processing webhook"
        });
    }
}


const webhooksOrdersDeleted = async (req, res) => {
    try {
        const data = req.body;
        console.log("Orders deleted webhook received:", data);
        res.status(200).send("Webhook received");
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while processing webhook"
        });
    }
}

module.exports = {  webhooksOrdersCreated, webhooksOrdersDeleted };