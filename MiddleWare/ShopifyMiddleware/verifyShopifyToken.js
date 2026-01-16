const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();

 const verifyShopifyToken = (req, res, next) => {
    try {
        const auth = req.headers.authorization || req.headers.Authorization;

        if (!auth?.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing token" });
        }

        const token = auth.split(" ")[1];

        const payload = jwt.verify(
            token,
            process.env.SHOPIFY_API_SECRET
        );

        // values Shopify guarantees
        req.shop = payload.dest.replace("https://", "");
        req.shopifyUserId = payload.sub;

        next();
    } catch (err) {
        return res.status(401).json({
            message: "Invalid Shopify session token",
        });
    }
};
module.exports = { verifyShopifyToken };