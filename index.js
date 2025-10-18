const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const bodyParser = require("body-parser");
const { Server } = require("socket.io");
const { connectDB } = require("./Utils/db");
dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || process.env.MVC_BACKEND_PORT || 3001;
const server = http.createServer(app);
const { ioServer } = require("./server-io");
const { razerPayRoute } = require("./Routes/razerPayRoute");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());


const videoCallRouter = require("./Routes/videoCallRotes");
const { signinSignupRouter } = require("./Routes/signin-signupRoute");
const { userDetailsRouter } = require("./Routes/userDetailsRoutes");
const bookAppointmentRoute = require("./Routes/bookAppointmentRoute");
const { consultantRoute } = require("./Routes/consultantRoute");
const { employRoute } = require("./Routes/employRutes");
const shopifyRoute = require("./Shopify/shopifyRoute");
const shopifyController = require("./Shopify/shopifyController");




app.use("/api/video-call", videoCallRouter);
app.use("/api/auth", signinSignupRouter);
app.use("/api/users", userDetailsRouter);
app.use("/api/razerpay-create-order", razerPayRoute)
app.use("/api-consltor", bookAppointmentRoute)
app.use("/api-consultant", consultantRoute)
app.use("/api-employee", employRoute)
app.use("/app/install", shopifyController.createOrder);

ioServer(server);

server.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
});
