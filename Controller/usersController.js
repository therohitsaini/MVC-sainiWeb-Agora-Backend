const { User } = require("../Modal/userSchema");

const usersController = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select("-password");
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            data: user
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message: "Server error while fetching user",
     
        });
    }
}

module.exports = { usersController };