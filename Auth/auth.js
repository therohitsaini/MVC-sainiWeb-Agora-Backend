// const { request, response } = require("express");
const JWT = require("jsonwebtoken")
const dotenv = require("dotenv");
dotenv.config();



const verify_Token = async (request) => {
   try {
      const auth = request.headers.authorization || request.headers.Authorization
      console.log("auth", auth)
      if (!auth) {
         return false
      }
      const token = auth.split(" ").pop()
      const jwt_ = JWT.verify(token, process.env.JWT_SECRET_KEY || "hytfrdghbgfcfcrfffff")

      if (jwt_) {
         return jwt_
      } else {
         return false
      }
   } catch (err) {
      console.log("token is invalid ", err)
      return false
   }
}
module.exports = { verify_Token }