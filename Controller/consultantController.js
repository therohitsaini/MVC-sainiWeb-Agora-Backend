
const { Conversation } = require("../Modal/Histroy");
const { User } = require("../Modal/userSchema");
const { find } = require("../Modal/userSchema");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const { ChatList } = require("../Modal/chatListSchema");


const randomAgoraUid = Math.floor(Math.random() * 1000000000);

const consultantController = async (req, res) => {
    try {
        const { shop_id } = req.params;
        console.log("shop_id", shop_id);
        const body = req.body;
        const file = req.file;
        console.log("body", body);
        console.log("file", file);
        if (!mongoose.Types.ObjectId.isValid(shop_id)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid shop ID" });
        }


        if (!shop_id) {
            return res
                .status(400)
                .json({ success: false, message: "Shop not found" });
        }

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
            shop_id: shop_id,
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

/**
 * login consultant
 * @param {login} req 
 * @param {*} res 
 * @returns 
 */

const loginConsultant = async (request, response) => {
    try {
        const body = request.body

        console.log("body", body);

        let find_User = await User.findOne({ email: body.email })


        if (!find_User) {
            return response.status(400).send({ massage: "Incrrect Details ...!" })
        }
        console.log("find_User", find_User);

        if (find_User.consultantStatus === false) {
            return response.status(403).send({ massage: "Your account is blocked. Please contact administrator." })
        }
        const compairPassword = await bcrypt.compare(body.password, find_User.password)
        if (!compairPassword) {
            return response.status(400).send({ massage: "Incrrect password ... ! " })
        }
        const Token = JWT.sign(find_User, JWT_SRCURITE_KEY, { expiresIn: '10h' })
        console.log("Token", Token);

        return response.send({ massage: "Sign in successfully ", userData: find_User, Token })

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
