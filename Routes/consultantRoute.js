const express = require("express")
const { consultantController } = require("../Controller/consultantController")
const consultantRoute = express.Router()



consultantRoute.post("/add-consultant", consultantController)

module.exports = { consultantRoute }