const express = require('express');
const router = express.Router();
const userController = require('./../controllers/user');
const multer = require("multer");
const upload = multer({ dest: "images/" });

router.get("/", userController.displayLandingPage);
router.post("/postSignup", upload.single("img"), userController.signup);
router.get("/login", userController.displayLogin);
router.get("/signup", userController.displaySignup);
router.get("/verifyEmail", (req, res) => {
    res.render("verifyEmail");
})
router.post("/verifyEmail", userController.verifyEmail);
router.get("/resendEmail", userController.resendEmail);

module.exports = router;