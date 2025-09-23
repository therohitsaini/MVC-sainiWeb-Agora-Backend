const express = require("express")
const { bookAppointmentController,  } = require("../Controller/bookAppointmentController")
const bookAppointmentRoute = express.Router()


bookAppointmentRoute.post("/book-appointment", bookAppointmentController)
// bookAppointmentRoute.get("/get-consltor", getConslterController)

module.exports =  bookAppointmentRoute ;