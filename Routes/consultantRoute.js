const express = require("express")
const { consultantController, getConsultant, updateConsultantStatus } = require("../Controller/consultantController")
const consultantRoute = express.Router()



consultantRoute.post("/add-consultant", consultantController)
consultantRoute.get("/api-find-consultant", getConsultant)
consultantRoute.put("/api-consultant-update-status/:id", updateConsultantStatus)

module.exports = { consultantRoute }