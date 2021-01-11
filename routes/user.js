const express = require('express');
const router = express.Router();
const userController = require('./../controllers/user');
const multer = require("multer");
const upload = multer({ dest: "/public/Images/" });
const isAuthorized = require("./../controllers/authorize");

router.get("/", userController.displayLandingPage);
router.post("/signup", upload.single("img"), userController.signup);
router.get("/login", userController.displayLogin);
router.post("/login", userController.postLogin);
router.get("/pricing", userController.displayPricing);
router.get("/signup", userController.displaySignup);
router.post("/verifyEmail", userController.verifyEmail);
router.get("/resendEmail", userController.resendEmail);
router.get("/dashboard", isAuthorized.authroize, userController.displayDashbaord);
router.get("/logout", userController.logout);

module.exports = router;