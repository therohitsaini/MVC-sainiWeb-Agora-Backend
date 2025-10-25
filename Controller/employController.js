const mongoose = require("mongoose");
const {User} = require("../Modal/userSchema");
const bcrypt = require("bcrypt");

const employController = async (req, res) => {
    try {
        const { fullname, email, password, role, address, city, state, zip, country, dateOfBirth, } = req.body;
        console.log(req.body);
        // if (!fullname || !email || !password || !role) {
        //     return res.status(400).json({ message: "All fields are required" });
        // }
        const user = await User.findOne({ email: email });  
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            fullname,
            email,
            password: hashPassword,
            role,
            address,
            city,
            state,
            zip,
            country,
            userType: "employee",
            // dateOfBirth
        });
        await newUser.save();
        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.log(error);
    }
}

module.exports = { employController };