
const { Conversation } = require("../Modal/Histroy");
const { User } = require("../Modal/userSchema");
const { find } = require("../Modal/userSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");


const randomAgoraUid = Math.floor(Math.random() * 1000000000);

// const consultantController = async (req, res) => {

//     try {
//         const body = req.body;
//         const file = req.file;
//         console.log("file", file);
//         console.log("body", body);
//         if (!body.fullName
//             || !body.email
//             || !body.password
//             || !body.phoneNumber
//             || !body.profession ||
//             !body.specialization ||
//             !body.licenseIdNumber ||
//             !body.yearOfExperience ||
//             !body.chargingPerMinute ||
//             !body.languages ||
//             !body.displayName ||
//             !body.gender ||
//             !body.houseNumber
//             || !body.streetArea
//             || !body.landmark
//             || !body.address
//             || !body.pincode
//             || !body.dateOfBirth
//             || !body.pancardNumber
//         ) {
//             return res.status(400).json({ success: false, message: "All fields are required" });
//         }
//         // const { fullName, email, phone, profession, specialization, licenseNo, experience, fees, bio, password, language } = req.body;
//         // if (!fullName || fullName.trim() === "") {
//         //     return res.status(400).json({ success: false, message: "Full name is required" });
//         // }
//         // if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//         //     return res.status(400).json({ success: false, message: "Valid email is required" });
//         // }
//         // if (!password || password.trim() === "") {
//         //     return res.status(400).json({ success: false, message: "Password is required" });
//         // }

//         // if (!phone || !/^\d{10,15}$/.test(phone)) {
//         //     return res.status(400).json({ success: false, message: "Valid phone number (10-15 digits) is required" });
//         // }

//         // if (!profession || profession.trim() === "") {
//         //     return res.status(400).json({ success: false, message: "Profession is required" });
//         // }

//         // if (!specialization || specialization.trim() === "") {
//         //     return res.status(400).json({ success: false, message: "Specialization is required" });
//         // }

//         // if (!licenseNo || licenseNo.trim() === "") {
//         //     return res.status(400).json({ success: false, message: "License number is required" });
//         // }

//         // if (experience === undefined || isNaN(experience) || experience < 0) {
//         //     return res.status(400).json({ success: false, message: "Valid experience (>=0) is required" });
//         // }

//         // if (fees === undefined || isNaN(fees) || fees < 0) {
//         //     return res.status(400).json({ success: false, message: "Valid fees (>=0) is required" });
//         // }
//         const hashPassword = await bcrypt.hash(body.password, 10)
//         const consultantDetails = new User({
//             fullname: body.fullName,
//             email: body.email,
//             phone: body.phoneNumber,
//             password: hashPassword,
//             profession: body.profession,
//             specialization: body.specialization,
//             licenseNo: body.licenseIdNumber,
//             experience: body.yearOfExperience,
//             fees: body.chargingPerMinute,
//             language: body.languages,
//             displayName: body.displayName,
//             gender: body.gender,
//             houseNumber: body.houseNumber,
//             streetArea: body.streetArea,
//             landmark: body.landmark,
//             address: body.address,
//             pincode: body.pincode,
//             dateOfBirth: body.dateOfBirth,
//             pan_cardNumber: body.pancardNumber,
//             isActive: true,
//             userType: "consultant",
//             consultantStatus: false,
//             agoraUid: randomAgoraUid
//             // consultantStatus: true,
//             // isActive: true,
//         });

//         // await consultantDetails.save();
//         res.status(201).json({ success: true, message: "Consultant created successfully" });
//     } catch (error) {
//         res.status(500).json({ success: false, message: error.message });
//     }
// };




const consultantController = async (req, res) => {
    try {
        const body = req.body;
        const file = req.file;
        console.log("file", file);
        console.log("body", body);

        if (
            !body.fullName ||
            !body.email ||
            !body.password ||
            !body.phoneNumber ||
            !body.profession ||
            !body.specialization ||
            !body.licenseIdNumber ||
            !body.yearOfExperience ||
            !body.chargingPerMinute ||
            // !body.languages ||
            !body.displayName ||
            !body.gender ||
            !body.houseNumber ||
            !body.streetArea ||
            !body.landmark ||
            !body.address ||
            !body.pincode ||
            !body.dateOfBirth ||
            !body.pancardNumber
        ) {
            return res
                .status(400)
                .json({ success: false, message: "All fields are required" });
        }

        if (!file) {
            return res
                .status(400)
                .json({ success: false, message: "Profile image is required" });
        }

        const uploadFolder = path.join("uploads", "consultants");

        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder, { recursive: true });
        }

        const fileName = Date.now() + "-" + file.originalname;
        const savePath = path.join(uploadFolder, fileName);

        fs.writeFileSync(savePath, file.buffer);

        const imageURL = savePath;
        const hashPassword = await bcrypt.hash(body.password, 10);
        const consultantDetails = new User({
            fullname: body.fullName,
            email: body.email,
            phone: body.phoneNumber,
            password: hashPassword,
            profession: body.profession,
            specialization: body.specialization,
            licenseNo: body.licenseIdNumber,
            experience: body.yearOfExperience,
            fees: body.chargingPerMinute,
            language: body.languages,
            displayName: body.displayName,
            gender: body.gender,
            houseNumber: body.houseNumber,
            streetArea: body.streetArea,
            landmark: body.landmark,
            address: body.address,
            pincode: body.pincode,
            dateOfBirth: body.dateOfBirth,
            pan_cardNumber: body.pancardNumber,
            profileImage: imageURL,
            isActive: true,
            agoraUid: randomAgoraUid,
            userType: "consultant",
            consultantStatus: false,
        });
        console.log("consultantDetails", consultantDetails);
        await consultantDetails.save();

        res.status(201).json({ success: true, message: "Consultant created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// const getConsultant = async (req, res) => {
//     try {
//         const findConsultant = await User.find({ userType: "consultant" }).select("-password")
//         if (!findConsultant) {
//             return res.status(400).send({ message: "Consultant is undifind..??" })
//         }
//         return res.status(200).send({ success: true, findConsultant })

//     } catch (error) {
//         console.log(error)
//     }
// }
const getConsultant = async (req, res) => {
    try {

        let consultants = await User.find({ userType: "consultant" }).select("-password");
        // console.log("consultants", consultants);
        consultants = consultants.map(item => {
            return {
                ...item._doc,
                profileImage: item.profileImage
                    ? `${req.protocol}://${req.get("host")}/${item.profileImage.replace(/\\/g, "/")}`
                    : null
            };
        });

        return res.status(200).send({ success: true, findConsultant: consultants });

    } catch (error) {
        console.log(error);
        res.status(500).send({ success: false, message: error.message });
    }
};

const updateConsultantStatus = async (request, response) => {
    try {
        const { id } = request.params;
        console.log("id", id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!id) {
            return response.status(400).json({ message: 'Consultant ID is required' });
        }
        const consultant = await User.findById(id);
        if (!consultant) {
            return res.status(404).json({ message: "Consultant not found" });
        }
        console.log("consultant", consultant);

        // Toggle ONLY consultantStatus
        consultant.consultantStatus = !consultant.consultantStatus;
        await consultant.save();
        return response.status(200).send({
            success: true,
            message: "Status updated successfully",
            status: consultant.consultantStatus,
        });

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

/**
 * delete consultant
 * @param {string} id 
 * @returns {Promise<{success: boolean, message: string}>}
 */
const deleteConsultant = async (request, response) => {
    try {
        const { id } = request.params;
        console.log("id", id);
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!id) {
            return response.status(400).json({ message: 'Consultant ID is required' });
        }
        const deleteConsultant = await User.findByIdAndDelete(id);
        // console.log("deleteConsultant", deleteConsultant);
        if (!deleteConsultant) {
            return response.status(400).json({ message: 'Consultant not found' });
        }
        return response.status(200).send({ success: true, message: 'Consultant deleted successfully' });
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
    getConsultantAllUserHistory,
    deleteConsultant
}
