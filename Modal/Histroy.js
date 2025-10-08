const mongoose = require("mongoose");

const SnapshotSchema = new mongoose.Schema(
   {
      name: String,
      email: String,
      phone: String,
   },
   { _id: false }
);

const ConversationSchema = new mongoose.Schema(
   {
      consultantId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Consultant",
         required: true,
      },
      userId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
         required: true,
      },
      userSnapshot: SnapshotSchema, // user details at the time of call
      consultantSnapshot: SnapshotSchema, // consultant details at the time of call
      type: {
         type: String,
         enum: ["audio", "video", "chat"],
         default: "audio",
      },
      startTime: { type: Date, required: true },
      endTime: { type: Date },
      durationSeconds: { type: Number, default: 0 },
      transcript: { type: String },
      recordingUrl: { type: String },
      rating: {
         score: { type: Number, min: 1, max: 5 },
         feedback: String,
      },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
   },
   { timestamps: true }
);

ConversationSchema.index({ consultantId: 1, startTime: -1 });
ConversationSchema.index({ userId: 1, startTime: -1 });

const Conversation = mongoose.model("Conversation", ConversationSchema);

module.exports = { Conversation };
