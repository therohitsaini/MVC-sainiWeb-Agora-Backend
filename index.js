const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const { connectDB } = require("./Utils/db");
dotenv.config();

// Connect to MongoDB
connectDB();



const PORT = process.env.PORT || process.env.MVC_BACKEND_PORT || 3001;
const bodyParser = require("body-parser");
const videoCallRouter = require("./Routes/videoCallRotes");
const { signinSignupRouter } = require("./Routes/signin-signupRoute");
const { userDetailsRouter } = require("./Routes/userDetailsRoutes");
const { callRouter } = require("./Routes/callRoutes");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());




app.use("/api/video-call", videoCallRouter);
app.use("/api/auth", signinSignupRouter);
app.use("/api/users", userDetailsRouter);
app.use("/api/calls", callRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

