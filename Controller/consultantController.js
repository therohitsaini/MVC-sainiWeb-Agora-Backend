
const { Conversation } = require("../Modal/Histroy");
const User = require("../Modal/userSchema");
const { find } = require("../Modal/userSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");


const consultantController = async (req, res) => {

    try {
        const { fullName, email, phone, profession, specialization, licenseNo, experience, fees, bio, password, language } = req.body;


        if (!fullName || fullName.trim() === "") {
            return res.status(400).json({ success: false, message: "Full name is required" });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Valid email is required" });
        }
        if (!password || password.trim() === "") {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        if (!phone || !/^\d{10,15}$/.test(phone)) {
            return res.status(400).json({ success: false, message: "Valid phone number (10-15 digits) is required" });
        }

        if (!profession || profession.trim() === "") {
            return res.status(400).json({ success: false, message: "Profession is required" });
        }

        if (!specialization || specialization.trim() === "") {
            return res.status(400).json({ success: false, message: "Specialization is required" });
        }

        if (!licenseNo || licenseNo.trim() === "") {
            return res.status(400).json({ success: false, message: "License number is required" });
        }

        if (experience === undefined || isNaN(experience) || experience < 0) {
            return res.status(400).json({ success: false, message: "Valid experience (>=0) is required" });
        }

        if (fees === undefined || isNaN(fees) || fees < 0) {
            return res.status(400).json({ success: false, message: "Valid fees (>=0) is required" });
        }
        const hashPassword = await bcrypt.hash(password, 10)
        const consultantDetails = new User({
            fullname: fullName,
            email,
            phone,
            password: hashPassword,
            profession,
            specialization,
            licenseNo,
            experience,
            fees,
            bio,
            role: "consultant",
            language,
        });

        await consultantDetails.save();

        res.status(201).json({ success: true, data: consultantDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getConsultant = async (req, res) => {
    try {
        const findConsultant = await User.find({ role: "consultant" })
        if (!findConsultant) {
            return res.status(400).send({ message: "Consultant is undifind..??" })
        }
        return res.status(200).send({ success: true, findConsultant })

    } catch (error) {
        console.log(error)
    }
}
const updateConsultantStatus = async (request, response) => {
    try {
        const { id } = request.params;
        const { status } = request.body
        console.log(id, status)
        const updateConsultantStatus = await User.findByIdAndUpdate(id, { consultantStatus: status });
        return response.status(200).send({ success: "true", updateConsultantStatus })

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}

const getConsultantById = async (request, response) => {
    try {
        const { id } = request.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!id) {
            return response.status(400).json({ message: 'Consultant ID is required' });
        }
        const consultant = await User.findById(id).select("-password");
        return response.status(200).send({ success: true, consultant });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}

const getConsultantHistory = async (request, response) => {
    try {
        const { id } = request.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!id) {
            return response.status(400).json({ message: 'Consultant ID is required' });
        }
        const history = await Conversation.find({ consultantId: id });
        const userHistory = [];
        for (const item of history) {
            userHistory.push(
                {
                    userId: item.userId,
                    user: item.userSnapshot,
                    type: item.type,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    durationSeconds: item.durationSeconds
                }
            )
        }
        return response.status(200).send({ success: true, userHistory });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}

const getConsultantAllUser = async (request, response) => {
    try {
        const { id } = request.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!id) {
            return response.status(400).json({ message: 'Consultant ID is required' });
        }
        const consultantUser = await Conversation.find({ consultantId: id });
        const userData = [];
        for (const item of consultantUser) {
            userData.push(
                {
                    userId: item.userId,
                    user: item.userSnapshot,
                    type: item.type,
                    startTime: item.startTime,
                    endTime: item.endTime,
                    durationSeconds: item.durationSeconds
                }
            )
        }
        console.log(consultantUser)
        if (!consultantUser) {
            return response.status(400).json({ message: 'Consultant user not found' });
        }
        return response.status(200).send({ success: true, userData });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}

const getConsultantAllUserHistory = async (request, response) => {
    try {
        const historyConsultantUser = await Conversation.find();
        if (!historyConsultantUser) {
            return response.status(400).json({ message: 'History consultant user not found' });
        }
        return response.status(200).send({ success: true, historyConsultantUser });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}


module.exports = {
    consultantController,
    getConsultant,
    updateConsultantStatus,
    getConsultantById,
    getConsultantHistory,
    getConsultantAllUser,
    getConsultantAllUserHistory
}
