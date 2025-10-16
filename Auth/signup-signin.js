const User = require("../Modal/userSchema")
const { consultantSchemaExport } = require("../Modal/consultantSchema")
const bcrypt = require("bcrypt")
const JWT = require("jsonwebtoken");
const { verify_Token } = require("./auth");
const JWT_SRCURITE_KEY = process.env.JWT_SECRET_KEY || "hytfrdghbgfcfcrfffff"


const generateAgoraUid = () => Math.floor(100000 + Math.random() * 900000);
const signUp = async (request, response) => {

   try {
      const body = request.body
      const password = body.password
      const findEmail = await User.findOne({ email: body.email })
      const obj_Length = Object.keys(body)
      if (obj_Length.length == 0) {
         return response.status(400).send({ massage: "Empty ...!" })
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(body.email)) {
         return response.status(400).send({ message: "Invalid Email...!" });
      }
      if (body.email == "@gmail.com") {
         return response.status(400).send({ massage: "Invailid Email r.....!" })
      }

      if (findEmail) {
         return response.status(400).send({ massage: "Email is Alredy Exsist ...!" })
      }

      if (
         password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$&*]/.test(password)
      ) {
         return response.status(400).send({
            massageReq: "Password must be at least 8 characters and include ( [a-z],[A-Z],[0-9],[!@#$&*] )"
         });
      }

      const hashPassword = await bcrypt.hash(password, 10)
      const agoraUid = generateAgoraUid();
      const object = new User({

         fullname: body.fullname,
         email: body.email,
         password: hashPassword,
         agoraUid: agoraUid,
         walletBalance: 100,
      })
      await object.save()
      return response.status(201).send({ massage: "sign up sucessfully ...!" })

   } catch (err) {
      console.log(err)
      return response.status(400).send({ massage: "sign up field ...!", err })
   }
}

const signIn = async (request, response) => {
   try {
      const body = request.body
    
      let find_User = await User.findOne({ email: body.email })

      if (!find_User) {
         find_User = await consultantSchemaExport.findOne({ email: body.email })
      }
      if (!find_User) {
         return response.status(400).send({ massage: "Incrrect Details ...!" })
      }
      
      if (find_User.consultantStatus === false) {
         return response.status(403).send({ massage: "Your account is blocked. Please contact administrator." })
      }
      
      const compairPassword = await bcrypt.compare(body.password, find_User.password)

      if (!compairPassword) {
         return response.status(400).send({ massage: "Incrrect password ... ! " })
      }
      const Token = JWT.sign(body, JWT_SRCURITE_KEY, { expiresIn: '10h' })

      return response.send({ massage: "Sign in successfully ", data: Token, userData: find_User })

   } catch (err) {
      return response.status(400).send({ massage: "Server Error ...!", err })

   }
}

const tokenVerify = async (request, response) => {
   try {
      const verify = await verify_Token(request)
    
      if (!verify) {
         return response.status(401).send({ message: "Token is not verified" })
      } else {
         return response.status(200).send({ message: "Token verified successfully", user: verify })
      }
   } catch (err) {
      console.log("Token verification error:", err)
      return response.status(401).send({ message: "Token is not found or invalid" })
   }
}


const authenticateToken = async (request, response, next) => {
   try {
      const verify = await verify_Token(request)
      if (!verify) {
         return response.status(401).send({ message: "Access denied. Token is not verified" })
      }
      request.user = verify
      next()
   } catch (err) {
      console.log("Authentication error:", err)
      return response.status(401).send({ message: "Access denied. Invalid token" })
   }
}

module.exports = { signUp, signIn, tokenVerify, authenticateToken }