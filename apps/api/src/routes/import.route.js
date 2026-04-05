const express = require("express");
const { importTelcoByPath, importTelcoByUpload, importCustomByUpload } = require("../controllers/import.controller");
const { upload } = require("../middleware/upload.middleware");
const { authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/telco/path", authorizeRoles("admin", "manager"), importTelcoByPath);
router.post("/telco/upload", authorizeRoles("admin", "manager"), upload.single("file"), importTelcoByUpload);
router.post("/custom/upload", authorizeRoles("admin", "manager"), upload.single("file"), importCustomByUpload);

module.exports = { importRouter: router };
