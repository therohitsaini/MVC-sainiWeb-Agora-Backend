
const { Conversation } = require("../Modal/Histroy");
const { User } = require("../Modal/userSchema");
const { find } = require("../Modal/userSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { ChatList } = require("../Modal/chatListSchema");



/**
 * Create a new consultant
 * @param {Object} req - Request object with shop_id in params, body data, and profileImage file
 * @param {Object} res - Response object
 */

const consultantController = async (req, res) => {
    try {
        const { shop_id } = req.params;
        const body = req.body;
        // const file = req.file;
        console.log("___________body___________", body);

        // Validate shop_id
        if (!shop_id || !mongoose.Types.ObjectId.isValid(shop_id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid shop ID"
            });
        }

        // Validate required fields
        const requiredFields = [
            'fullName', 'email', 'password', 'phoneNumber', 'profession',
            'specialization', 'licenseIdNumber', 'yearOfExperience',
            'chargingPerMinute', 'languages', 'displayName', 'gender',
            'houseNumber', 'streetArea', 'landmark', 'address',
            'pincode', 'dateOfBirth', 'pancardNumber'
        ];

        const missingFields = requiredFields.filter(field => !body[field]);
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
                missingFields
            });
        }

        // Validate profile image
        // if (!file) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Profile image is required"
        //     });
        // }

        // Check if email already exists
        const existingEmail = await User.findOne({ email: body.email.toLowerCase().trim() });
        if (existingEmail) {
            return res.status(400).json({
                success: false,
                message: "Email already exists. Please use a different email."
            });
        }

        // Check if license number already exists
        const existingLicense = await User.findOne({ licenseNo: body.licenseIdNumber });
        if (existingLicense) {
            return res.status(400).json({
                success: false,
                message: "License number already exists. Please use a different license number."
            });
        }

        // Create uploads/consultants directory if it doesn't exist
        const uploadFolder = path.join("uploads", "consultants");
        if (!fs.existsSync(uploadFolder)) {
            fs.mkdirSync(uploadFolder, { recursive: true });
        }

        // Save profile image
        // const fileName = `${Date.now()}-${file.originalname}`;
        // const savePath = path.join(uploadFolder, fileName);
        // await fs.promises.writeFile(savePath, file.buffer);
        // const imageURL = savePath;

        // Generate unique agoraUid
        let randomAgoraUid;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            randomAgoraUid = Math.floor(100000 + Math.random() * 900000);
            const existingAgoraUid = await User.findOne({ agoraUid: randomAgoraUid });
            if (!existingAgoraUid) {
                break;
            }
            attempts++;
            if (attempts >= maxAttempts) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to generate unique Agora UID. Please try again."
                });
            }
        } while (true);

        // Parse languages array
        let languagesArray;
        try {
            languagesArray = JSON.parse(body.languages);
        } catch (error) {
            return res.status(400).json({
                success: false,
                message: "Invalid languages format. Expected JSON array."
            });
        }
        const hashPassword = await bcrypt.hash(body.password, 10);
        console.log("hashPassword", hashPassword);
        // Create consultant document
        const consultantDetails = new User({
            shop_id,
            fullname: body.fullName,
            email: body.email.toLowerCase().trim(),
            phone: body.phoneNumber,
            password: hashPassword,
            profession: body.profession,
            specialization: body.specialization,
            licenseNo: body.licenseIdNumber,
            experience: String(body.yearOfExperience),
            fees: String(body.chargingPerMinute),
            language: languagesArray,
            displayName: body.displayName,
            gender: body.gender,
            houseNumber: body.houseNumber,
            streetArea: body.streetArea,
            landmark: body.landmark,
            address: body.address,
            pincode: body.pincode,
            dateOfBirth: new Date(body.dateOfBirth),
            pan_cardNumber: body.pancardNumber,
            // profileImage: imageURL,
            isActive: true,
            agoraUid: randomAgoraUid,
            userType: "consultant",
            consultantStatus: false,
        });

        await consultantDetails.save();

        return res.status(201).json({
            success: true,
            message: "Consultant created successfully",
            consultantId: consultantDetails._id
        });

    } catch (error) {
        console.error("Error in consultantController:", error);

        // Handle MongoDB duplicate key error
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                success: false,
                message: `${field} already exists. Please use a different value.`
            });
        }

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: "Validation error",
                errors
            });
        }

        // Generic error response
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
};

/**
 * login consultant
 * @param {login} req 
 * @param {*} res 
 * @returns 
 */

const loginConsultant = async (request, response) => {
    try {
        const body = request.body

        let find_User = await User.findOne({ email: body.email })
        if (!find_User) {
            return response.status(400).send({ massage: "Incrrect Details ...!" })
        }
        if (find_User.consultantStatus === false) {
            return response.status(403).send({ massage: "Your account is blocked. Please contact administrator." })
        }
        // console.log("body.password find_User.password", body.password, find_User.password);
     
        // console.log("compairPassword", {success: true, message: "Sign in successfully ", userData: find_User});
        // const Token = JWT.sign(find_User, JWT_SRCURITE_KEY, { expiresIn: '10h' })
        // console.log("Token", Token);

        return response.send({ massage: "Sign in successfully ", userData: find_User,})

    } catch (err) {
        return response.status(400).send({ massage: "Server Error ...!", err })

    }
}


const getConsultant = async (req, res) => {
    try {
        const { shop_id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(shop_id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid shop ID" });
        }
        let consultants = await User.find({ userType: "consultant", shop_id: shop_id }).select("-password");
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

/**
 * get consultant by shop id and consultant id 
 * @param {string} shop_id 
 * @returns {Promise<{success: boolean, message: string, consultants: User[]}>}
 */
const getConsultantByShopIdAndConsultantId = async (request, response) => {
    try {
        const { shop_id, consultant_id } = request.params;


        if (!mongoose.Types.ObjectId.isValid(shop_id)) {
            return response.status(400).json({ message: 'Invalid shop ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(consultant_id)) {
            return response.status(400).json({ message: 'Invalid consultant ID' });
        }
        if (!consultant_id || !shop_id) {
            return response.status(400).json({ message: 'Consultant Shop  ID is required' });
        }
        const consultant = await User.findOne({ _id: consultant_id, shop_id: shop_id });


        return response.status(200).send({ success: true, consultant });
    }
    catch (error) {
        console.error(error);
        return response.status(500).json({ message: 'Server error' });
    }
}


/**
 * get chat list by shop id and consultant id
 * @param {string} shop_id 
 * @param {string} consultant_id 
 * @returns {Promise<{success: boolean, message: string, chatList: ChatList[]}>}
 */
const getChatListByShopIdAndConsultantId = async (request, response) => {
    try {
        const { shop_id, consultant_id } = request.params;


        if (!mongoose.Types.ObjectId.isValid(shop_id)) {
            return response.status(400).json({ message: 'Invalid shop ID' });
        }
        const chatList = await ChatList.find({ shop_id: shop_id, receiverId: consultant_id }).populate("senderId").populate("receiverId").populate("shop_id");
        if (!chatList) {
            return response.status(400).json({ message: 'Chat list not found' });
        }

        const payload = chatList.map(item => {
            return {
                chatListId: item._id,

                sender: {
                    id: item.senderId?._id,
                    fullname: item.senderId?.fullname,
                    profileImage: item.senderId?.profileImage,
                    email: item.senderId?.email,
                    isActive: item.senderId?.isActive
                },

                receiver: {
                    id: item.receiverId?._id,
                    fullname: item.receiverId?.fullname,
                    profileImage: item.receiverId?.profileImage,
                },

                shop: {
                    id: item.shop_id?._id,
                    shop: item.shop_id?.shop
                },
                isRequest: item.isRequest,
                lastMessage: item.lastMessage,
                isChatAccepted: item.senderId?.isChatAccepted,
                updatedAt: item.updatedAt,
                createdAt: item.createdAt
            };
        });

        return response.status(200).send({ success: true, message: 'Chat list fetched successfully', payload });
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
    deleteConsultant,
    getConsultantByShopIdAndConsultantId,
    loginConsultant,
    getChatListByShopIdAndConsultantId
}
