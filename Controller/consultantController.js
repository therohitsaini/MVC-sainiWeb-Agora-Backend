const { consultantSchemaExport } = require("../Modal/consultantSchema")


const consultantController = async (req, res) => {
    try {
        const { fullName, email, phone, profession, specialization, licenseNo, experience, fees, bio } = req.body;
      

        if (!fullName || fullName.trim() === "") {
            return res.status(400).json({ success: false, message: "Full name is required" });
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Valid email is required" });
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

        const consultantDetails = new consultantSchemaExport({
            fullName,
            email,
            phone,
            profession,
            specialization,
            licenseNo,
            experience,
            fees,
            bio,
        });

        await consultantDetails.save();

        res.status(201).json({ success: true, data: consultantDetails });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { consultantController }
