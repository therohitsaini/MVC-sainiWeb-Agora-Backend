const User = require("../Modal/userSchema");

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" })
        res.status(200).json({
            success: true,
            message: "Users retrieved successfully",
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch users",
            error: error.message
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id).select("-password")
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
        console.error("Error fetching user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch user",
            error: error.message
        });
    }
};

module.exports = { getAllUsers, getUserById };
