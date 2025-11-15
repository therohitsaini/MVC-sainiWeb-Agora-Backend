
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");


const generateToken = async (req, res) => {
   try {
      const { channelName, uid } = req.body;
      
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


const generateVoiceToken = async (req, res) => {
   try {
      const { channelName, uid } = req.body;

      

      if (!channelName || !uid) {
         return res.status(400).json({
            error: "channelName and uid are required"
         });
      }

      const appId = process.env.AGORA_APP_ID;
      const appCertificate = process.env.AGORA_APP_CERTIFICATE;

      console.log("Environment check:", {
         appId: appId ? "Set" : "Missing",
         appCertificate: appCertificate ? "Set" : "Missing"
      });

      if (!appId || !appCertificate) {
         return res.status(500).json({
            error: "Agora credentials not configured. Please check your environment variables.",
            details: {
               appId: appId ? "Set" : "Missing",
               appCertificate: appCertificate ? "Set" : "Missing"
            }
         });
      }
      const token = RtcTokenBuilder.buildTokenWithUid(
         appId,
         appCertificate,
         channelName,
         uid,
         RtcRole.PUBLISHER,
         0
      );
      console.log("Token generated successfully for:", { channelName, uid });
      res.json({
         token,
         appId: appId,
         channelName,
         uid,
         callType: "voice"
      });
   } catch (error) {
      console.error("Error generating voice token:", error);
      res.status(500).json({
         error: "Failed to generate voice token",
         details: error.message
      });
   }
}

module.exports = { generateToken, generateVoiceToken };