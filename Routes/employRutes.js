const express = require("express");
const { employController } = require("../Controller/employController");
const employRoute = express.Router();

employRoute.post("/add-employee", employController);

module.exports = { employRoute };