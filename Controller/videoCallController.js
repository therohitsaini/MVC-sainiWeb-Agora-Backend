
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");


const generateToken = async (req, res) => {
   try {
      const { channelName, uid } = req.body;

      // Validate required fields
      if (!channelName || !uid) {
         return res.status(400).json({
            error: "channelName and uid are required"
         });
      }


      if (!process.env.AGORA_APP_ID || !process.env.AGORA_APP_CERTIFICATE) {
         return res.status(500).json({
            error: "Agora credentials not configured. Please check your .env file."
         });
      }

      const token = RtcTokenBuilder.buildTokenWithUid(
         process.env.AGORA_APP_ID,
         process.env.AGORA_APP_CERTIFICATE,
         channelName,
         uid,
         RtcRole.PUBLISHER,
         0
      );

      res.json({
         token,
         appId: process.env.AGORA_APP_ID,
         channelName,
         uid
      });
   } catch (error) {
      console.error("Error generating token:", error);
      res.status(500).json({
         error: "Failed to generate token"
      });
   }
}


module.exports = { generateToken };