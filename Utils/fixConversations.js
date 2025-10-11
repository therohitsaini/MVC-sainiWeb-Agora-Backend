// const mongoose = require("mongoose");
// const { Conversation } = require("../Modal/Histroy");

// // Utility function to fix conversations that don't have end times
// const fixIncompleteConversations = async () => {
//     try {
//         console.log("🔍 Looking for incomplete conversations...");
        
//         const incompleteConversations = await Conversation.find({
//             endTime: { $exists: false }
//         });
        
//         console.log(`Found ${incompleteConversations.length} incomplete conversations`);
        
//         for (const conv of incompleteConversations) {
//             const endTime = new Date();
//             const durationSeconds = Math.floor((endTime - conv.startTime) / 1000);
            
//             await Conversation.findByIdAndUpdate(conv._id, {
//                 endTime: endTime,
//                 durationSeconds: durationSeconds
//             });
            
//             console.log(`✅ Fixed conversation ${conv._id}: Duration ${durationSeconds} seconds`);
//         }
        
//         console.log("🎉 All conversations fixed!");
        
//     } catch (error) {
//         console.error("❌ Error fixing conversations:", error);
//     }
// };

// // Run the fix if this file is executed directly
// if (require.main === module) {
//     // You'll need to connect to your database first
//     // mongoose.connect("your-mongodb-connection-string");
//     // fixIncompleteConversations().then(() => process.exit());
// }

// module.exports = { fixIncompleteConversations };
