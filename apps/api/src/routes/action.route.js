const express = require("express");
const { createAction, listActions, updateAction } = require("../controllers/action.controller");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", authorizeRoles("admin", "manager", "agent"), createAction);
router.get("/", authorizeRoles("admin", "manager", "agent"), listActions);
router.patch("/:actionId", authorizeRoles("admin", "manager"), updateAction);

module.exports = { actionRouter: router };
