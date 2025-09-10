const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();



const PORT = process.env.PORT || process.env.MVC_BACKEND_PORT || 3001;
const bodyParser = require("body-parser");

const videoCallRouter = require("./Routes/videoCallRotes");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use("/api/video-call", videoCallRouter);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

