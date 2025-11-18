const express = require("express")
const { consultantController,
   getConsultant,
   updateConsultantStatus,
   getConsultantById,
   getConsultantHistory,
   getConsultantAllUser,
   getConsultantAllUserHistory,
   deleteConsultant
} = require("../Controller/consultantController")
const consultantRoute = express.Router()



consultantRoute.post("/add-consultant", consultantController)
consultantRoute.get("/api-find-consultant", getConsultant)
consultantRoute.put("/api-consultant-update-status/:id", updateConsultantStatus)
consultantRoute.get("/consultantid/:id", getConsultantById)
consultantRoute.get("/consultant-history/:id", getConsultantHistory)
consultantRoute.get("/consultant-all-user/:id", getConsultantAllUser)
consultantRoute.get("/consultant-all-user-history", getConsultantAllUserHistory)
consultantRoute.delete('/delete-consultant/:id', deleteConsultant);
module.exports = { consultantRoute }

