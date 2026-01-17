const express = require("express")
const { consultantController,
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
} = require("../Controller/consultantController")
const consultantRoute = express.Router()
const multer = require("multer");
const { verifyShopifyToken } = require("../MiddleWare/ShopifyMiddleware/verifyShopifyToken");
const upload = multer({ storage: multer.memoryStorage() });


consultantRoute.post("/add-consultant/:shop_id", upload.single("profileImage"), consultantController)
consultantRoute.get("/api-find-consultant/:shop_id", getConsultant)
consultantRoute.put("/api-consultant-update-status/:id", updateConsultantStatus)
consultantRoute.get("/consultantid/:id", getConsultantById)
consultantRoute.get("/consultant-history/:id", getConsultantHistory)
consultantRoute.get("/consultant-all-user/:id", getConsultantAllUser)
consultantRoute.get("/consultant-all-user-history", getConsultantAllUserHistory)
consultantRoute.delete('/delete-consultant/:id', deleteConsultant);
consultantRoute.get("/consultant-by-shop-id-and-consultant-id/:shop_id/:consultant_id", getConsultantByShopIdAndConsultantId);
consultantRoute.post("/login-consultant", loginConsultant);
consultantRoute.get("/get/chat-list/:shop_id/:consultant_id", getChatListByShopIdAndConsultantId);


module.exports = { consultantRoute }

