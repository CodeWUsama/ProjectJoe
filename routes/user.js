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
router.get("/pricing",  isAuthorized.authroize, userController.displayPricing);
router.get("/signup", userController.displaySignup);
router.get("/completeProfile", isAuthorized.authroize, userController.displayCompleteProfile);
router.post("/verifyEmail", userController.verifyEmail);
router.get("/resendEmail", userController.resendEmail);
router.get("/resendCode", userController.resendCode);
router.get("/dashboard", isAuthorized.authroize, userController.displayDashbaord);
router.get("/searchAccount", userController.searchAccount);
router.get("/logout", userController.logout);
router.post("/verifyAccount", userController.verifyAccount);
router.post("/verifyCode", userController.verifyCode);
router.post("/resetPassword", userController.resetPassword);
router.post("/completeProfile", isAuthorized.authroize, userController.completeProfile);
router.post("/payment",  isAuthorized.authroize, userController.payment);

module.exports = router;