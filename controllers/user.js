const con = require("./../mysqlconnection");
const fs = require("fs");
const nodemailer = require('nodemailer');
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transport = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}))

exports.displayLandingPage = (req, res, next) => {
    res.render("index");
}

exports.signup = (req, res, next) => {
    let oldPath = req.file.path;
    let newPath = "images/" + req.file.originalname;
    fs.rename(oldPath, newPath, () => {
        console.log("Path updated");
    })
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const city = req.body.city;
    const country = req.body.country;
    const status = req.body.status;
    const phone = req.body.phone;
    const image = newPath;

    req.session.firstName = firstName;
    req.session.lastName = lastName;
    req.session.email = email;
    req.session.password = password;
    req.session.city = city;
    req.session.country = country;
    req.session.phone = phone;
    req.session.image = image;
    req.session.status = status;

    let alreadyExists = false;
    let code = Number.parseInt(1000 + Math.random() * 9000);
    req.session.code = code;

    con.query("SELECT * FROM accounts WHERE email='" + email + "'", function (err, result, fields) {
        if (err) throw err;
        if (result.length > 0) {
            alreadyExists = true;
            res.status(400).json({ message: "User already exists" });
        }
    });

    if (alreadyExists === false && password === confirmPassword) {

        transport.sendMail({
            to: email,
            from: 'thunyathep.s@outlook.com',
            subject: 'Signup verification',
            html: "<h1>Your activation code is " + code + " <h1>"
        }).then(resp => {
            console.log(resp);
            return res.render("verifyEmail");
        }).catch(err => {
            console.log(err);
        })


    }
}

exports.displayLogin = (req, res, next) => {
    res.render("login");
}

exports.displaySignup = (req, res, next) => {
    res.render("signup");
}

exports.verifyEmail = (req, res, next) => {
    const enteredCode = req.body.code;
    const validCode = (req.session.code);

    if (enteredCode == validCode) {
        let sql = "INSERT INTO accounts (firstName,lastName,email,password,city,country,status,phone,image) VALUES ('" + req.session.firstName + "','" + req.session.lastName + "','" + req.session.email + "','" + req.session.password + "','" + req.session.city + "','" + req.session.country + "','" + req.session.status + "','" + req.session.phone + "','" + req.session.image + "')";
        con.query(sql, function (err, result) {
            if (err) throw err;
            return res.render("login");
        });
    }
    else {
        return res.status(500).json({message:"eror"})
    }
}

exports.resendEmail = (req, res, next) => {
    let code = Number.parseInt(1000 + Math.random() * 9000);

    req.session.code = code;

    transport.sendMail({
        to: req.session.email,
        from: 'thunyathep.s@outlook.com',
        subject: 'Signup verification',
        html: "<h1>Your activation code is " + code + " <h1>"
    }).then(resp => {
        console.log(resp);
        return res.render("verifyEmail");
    }).catch(err => {
        console.log(err);
    })
}