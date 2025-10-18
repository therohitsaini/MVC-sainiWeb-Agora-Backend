const shopifyController = {
    createOrder: async (req, res) => {
        console.log("req", req)
        console.log("res", res)
        const { products } = req.body;
        console.log("products", products)
        res.status(200).json({ message: "Order created successfully" });
        // try {
        //     const order = await Order.create({ products });
        //     res.status(201).json(order);
        // } catch (error) {
        //     res.status(500).json({ message: error.message });
        // }
    }
    
}
module.exports = shopifyController;