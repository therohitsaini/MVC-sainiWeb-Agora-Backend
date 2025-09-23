const { response } = require("express");
const bookAppointmentSchema = require("../Modal/bookAppointmentSchema");


const bookAppointmentController = async (request, response) => {
    const body = request.body;
    console.log("BODY", body)

    try {

        // if (
        //     // !body.userId ||
        //     // !body.consultantId ||
        //     !body.consultType ||
        //     !body.appointmentDate ||
        //     !body
        //     // !body.timeSlot
        // ) {
        //     return response.status(400).json({
        //         success: false,
        //         message: "Please provide all required fields",
        //     });
        // }

        const newAppointment = new bookAppointmentSchema({
            userName: body.userName,
            contactNumber: body.contactNumber,
            consultType: body.consultType,
            appointmentDate: body.appointmentDate,
            timeSlot: body.timeSlot,
            notes: body.notes || "",
            mode: body.mode || "online",
            payment: {
                amount: body.payment?.amount || 0,
                status: body.payment?.status || "pending",
                transactionId: body.payment?.transactionId || null,
            },
        });


        const savedAppointment = await newAppointment.save();

        return response.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            appointment: savedAppointment,
        });
    } catch (error) {
        console.error("Error booking appointment:", error);
        return response.status(500).json({
            success: false,
            message: "Server error. Could not book appointment.",
            error: error.message,
        });
    }
};



// const getConslterController = async (request, response) => {
//     try {
//         const consultors = await bookAppointmentSchema.find().select("consultType");
//         if (!consultors || consultors.length === 0) {
//             return response.status(400).send({ message: "Not Available..?" });
//         }
//         return response.status(200).send({ success: true, data: consultors });
//     } catch (error) {
//         console.log(error);
//         return response.status(500).send({ message: "Server error" });
//     }
// };

module.exports = { bookAppointmentController };
