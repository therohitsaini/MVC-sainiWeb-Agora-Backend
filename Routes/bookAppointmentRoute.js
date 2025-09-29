const express = require("express")
const { bookAppointmentController,  } = require("../Controller/bookAppointmentController")
const { authenticateToken } = require("../Auth/signup-signin")
const bookAppointmentRoute = express.Router()

// Protected route - require authentication
bookAppointmentRoute.post("/book-appointment", authenticateToken, bookAppointmentController)
// bookAppointmentRoute.get("/get-consltor", getConslterController)

module.exports =  bookAppointmentRoute ;