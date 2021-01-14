const con = require("./../mysqlconnection");
const fs = require("fs");
const nodemailer = require('nodemailer');
const sendgridTransport = require("nodemailer-sendgrid-transport");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const Stripe = require('stripe');
const stripe = Stripe('sk_test_51I2toSFHfsebTuSvGpJN9fYM7mBYZpUVT6QoZmFHpQx6afwFM7BZCKuShO6VxEQDJJsKoz0ApJMtAhX0f4SljxVt00Nou6oP6P');
const uuid = require("uuid").v4;

const transport = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: "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"
    }
}))

function validate(user) {
    const schema = Joi.object({
        firstName: Joi.string().max(255).required(),
        lastName: Joi.string().max(255).required(),
        email: Joi.string().email().required(),
        city: Joi.string().max(255).required(),
        country: Joi.string().max(255).required(),
        status: Joi.string().max(20),
        password: Joi.string().regex(/^[0-9a-zA-Z]+$/).min(8).max(30),
        confirmPassword: Joi.string().regex(/[a-zA-Z0-9]/).min(8).max(30),
    });
    return schema.validate(user);

}

function validatelogin(user) {

    const schema = Joi.object({

        email: Joi.string().email().required(),
        password: Joi.string().regex(/^[0-9a-zA-Z]+$/).min(8).max(30)
    });
    return schema.validate(user);

}

exports.displayLandingPage = (req, res, next) => {
    res.render("index");
}

exports.signup = async (req, res, next) => {
    let newPath;
    if (req.file) {
        let oldPath = req.file.path;
        newPath = "public/Images/" + req.body.email + req.file.originalname;
        fs.rename(oldPath, newPath, () => {
        })
    }
    else {
        newPath = "/Images/avatar.png"
    }

    const dataToValidate = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        city: req.body.city,
        country: req.body.country,
        status: req.body.status,
    }

    const { error } = validate(dataToValidate);
    if (error) return res.render("errorBadRequest", { data: { message: error.details[0].message } });

    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    let password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const city = req.body.city;
    const country = req.body.country;
    const status = req.body.status;
    const phone = req.body.phone;
    const image = newPath;
    const salt = await bcrypt.genSalt(10);
    let encPass = await bcrypt.hash(password, salt);

    req.session.firstName = firstName;
    req.session.lastName = lastName;
    req.session.email = email;
    req.session.password = encPass;
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
            res.render("signup", { data: { error: true, message: "User Already Exists! Try Signing In Instead." } });
        }
        else {
            if (alreadyExists == false && password == confirmPassword) {

                transport.sendMail({
                    to: email,
                    from: 'thunyathep.s@outlook.com',
                    subject: 'Signup verification',
                    html: "<h1>Your activation code is " + code + " <h1>"
                }).then(resp => {
                    return res.render("verifyEmail", { data: { error: false } });
                }).catch(err => {
                    return res.status(400).json({ message: "Error while sending email.... Please try again" });
                })

            } else {
                return res.render("signup", { data: { error: true, message: "Password and Confirm Password don't matches" } });
            }
        }
    });

}

exports.displayLogin = (req, res, next) => {
    if (req.session.isLoggedIn) {
        let avatar = req.session.avatar;
        let myArray = (avatar.split("/"));
        let avatarPath = "/" + (myArray[1]) + "/" + (myArray[2]);

        let data = {
            user: req.session.user,
            avatar: avatarPath
        }
        res.redirect("dashboard");
    }
    else {
        res.render("login", {
            data: {
                error: false
            }
        });
    }
}

exports.displaySignup = (req, res, next) => {
    res.render("signup", { data: { error: false } });
}

exports.displayPricing = (req, res, next) => {
    res.render("pricing");
}

exports.verifyEmail = (req, res, next) => {
    const enteredCode = req.body.code;
    const validCode = (req.session.code);

    if (enteredCode == validCode) {
        let sql = "INSERT INTO accounts (firstName,lastName,email,password,city,country,status,phone,image) VALUES ('" + req.session.firstName + "','" + req.session.lastName + "','" + req.session.email + "','" + req.session.password + "','" + req.session.city + "','" + req.session.country + "','" + req.session.status + "','" + req.session.phone + "','" + req.session.image + "')";
        con.query(sql, function (err, result) {
            if (err) throw err;
            req.session.destroy();
            return res.redirect("login");
        });
    }
    else {
        return res.render("verifyEmail", { data: { error: true } });
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
        return res.render("verifyEmail", { data: { error: false } });
    }).catch(err => {
        return res.status(500).json({ message: "ERROR while sending email" });
    })
}

exports.resendCode = (req, res, next) => {
    let code = Number.parseInt(1000 + Math.random() * 9000);
    req.session.code = code;
    transport.sendMail({
        to: req.session.email,
        from: 'thunyathep.s@outlook.com',
        subject: 'Signup verification',
        html: "<h1>Your activation code is " + code + " <h1>"
    }).then(resp => {
        return res.render("forgotPass-code", { data: { error: false } });
    }).catch(err => {
        return res.status(500).json({ message: "ERROR while sending email" });
    })
}

exports.postLogin = async (req, res, next) => {

    const { error } = validatelogin(req.body);
    if (error) return res.render("errorBadRequest", { data: { message: error.details[0].message } });

    const email = req.body.email;
    const password = req.body.password;

    con.query("SELECT * FROM accounts WHERE email='" + email + "'", async (err, result, fields) => {
        if (err) throw err;
        if (result.length > 0) {
            let validPass = result[0].password;
            const isValid = await bcrypt.compare(password, validPass);
            if (isValid) {
                req.session.isLoggedIn = true;
                req.session.user = (result[0].firstName + " " + result[0].lastName);
                req.session.avatar = result[0].image;
                return res.redirect("/dashboard");
            }
            else {
                let data = {
                    error: true
                }
                res.render("login", { data: data })
            }
        }
        else {
            let data = {
                error: true
            }
            res.render("login", { data: data })
        }
    });

}

exports.displayDashbaord = (req, res, next) => {

    let avatarPath;
    let data;

    if (req.session.googleAuth) {
        avatarPath = req.session.avatar;
        data = {
            user: req.session.googleUser,
            avatar: avatarPath
        }
    }

    else {
        let avatar = req.session.avatar;
        let myArray = (avatar.split("/"));
        avatarPath = "/" + (myArray[1]) + "/" + (myArray[2]);
        data = {
            user: req.session.user,
            avatar: avatarPath
        }
    }

    res.render("dashboard", { data: data });
}

exports.logout = (req, res, next) => {
    req.session.destroy();
    req.session = null;
    req.logout();
    res.redirect("/login");
}

exports.paymentStripe = (req, res, next) => {
    const product = req.body.product;
    const token = req.body.token;
    const idempontencyKey = uuid();

    return stripe.customers.create({
        email: token.email,
        source: token.id
    }).then(customer => {
        stripe.charges.create({
            amount: product.price * 100,
            currency: "usd",
            customer: customer.id,
            receipt_email: token.email,
            description: product.description,
            shipping: {
                name: token.card.name,
                address: {
                    country: token.card.address_country
                }
            }
        }, { idempontencyKey })
    }).then(result => {
        res.status(200).json(result);
    }).catch(err => {
        console.log(err);
    })
}

exports.searchAccount = (req, res, next) => {
    res.render("forgotPass-email", { data: { error: false } });
}

exports.verifyAccount = (req, res, next) => {
    req.session.email = req.body.email;
    con.query("SELECT * FROM accounts WHERE email='" + req.session.email + "'", async (err, result, fields) => {
        if (err) throw err;
        if (result.length > 0) {
            let code = Number.parseInt(1000 + Math.random() * 9000);
            req.session.code = code;
            transport.sendMail({
                to: req.session.email,
                from: 'thunyathep.s@outlook.com',
                subject: 'Signup verification',
                html: "<h1>Your activation code is " + code + " <h1>"
            }).then(resp => {
                return res.render("forgotPass-code", { data: { error: false } });
            }).catch(err => {
                return res.status(500).json({ message: "ERROR while sending email" });
            })
        }
        else {
            let data = { error: true }
            res.render("forgotPass-email", { data: data })
        }
    });
}

exports.verifyCode = (req, res, next) => {
    const enteredCode = req.body.code;
    const validCode = (req.session.code);

    if (enteredCode == validCode) {
        return res.render("forgotPass-reset", { data: { error: false } });
    }
    else {
        return res.render("forgotPass-code", { data: { error: true } });
    }
}

exports.resetPassword = async(req, res, next) => {
    const salt = await bcrypt.genSalt(10);
    let encPass = await bcrypt.hash(req.body.password, salt);

    if (req.body.password == req.body.confirmPassword) {
        var sql = "UPDATE accounts SET password = '" + encPass + "' WHERE email = '" + req.session.email + "'";
        con.query(sql, function (err, result) {
            if (err) throw err;
            req.session.destroy();
            return res.redirect("login");
        });
    }
    else {
        return res.render("forgotPass-reset", { data: { error: true } });
    }
}