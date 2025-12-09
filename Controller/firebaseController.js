const { User } = require("../Modal/userSchema");

const firebaseGetToken = async (req, res) => {
    try {
        const { token, userId, shopId } = req.body;
        console.log(req.body);

        if (!token || !userId || !shopId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const user = await User.findOne({ _id: userId, shop_id: shopId });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        await User.updateOne(
            { _id: userId, shop_id: shopId },
            {
                $set: {
                    firebaseToken: {
                        token,
                        updatedAt: new Date(),
                        userAgent: req.headers["user-agent"] || "",
                        browser: req.headers["sec-ch-ua"] || "",
                        os: req.headers["sec-ch-ua-platform"] || "",
                    }
                }
            }
        );

        return res.status(200).json({
            success: true,
            message: "Token stored successfully",
            token
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = { firebaseGetToken };
