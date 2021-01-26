const con = require("./../mysqlconnection");
const fs = require("fs");
const nodemailer = require('nodemailer');
const sendgridTransport = require("nodemailer-sendgrid-transport");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const stripe = require("stripe")(process.env.stripeTK);

const transport = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.sendGridKey
    }
}))

function validate(user) {
    const schema = Joi.object({
        firstName: Joi.string().max(255).required(),
        lastName: Joi.string().max(255).required(),
        displayName: Joi.string().max(255).required(),
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
    res.render("index.ejs");
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
        displayName: req.body.displayName
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
    const displayName = req.body.displayName;
    const image = newPath;
    const middleName = req.body.middleName;
    const salt = await bcrypt.genSalt(10);
    let encPass = await bcrypt.hash(password, salt);

    req.session.firstName = firstName;
    req.session.lastName = lastName;
    req.session.middleName = middleName;
    req.session.displayName = displayName;
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
        if (err) {
            res.render("errorBadRequest", { data: { message: err.message } })
            throw err;
        }
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
                    return res.render("errorBadRequest", { data: { message: err.message } })
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
    res.render("pricing", { apiKey: process.env.stripePK });
}

exports.verifyEmail = (req, res, next) => {
    const enteredCode = req.body.code;
    const validCode = (req.session.code);

    if (enteredCode == validCode) {
        let sql = "INSERT INTO accounts (firstName,middleName,lastName,displayName,email,password,city,country,phone) VALUES ('" + req.session.firstName + "','" + req.session.middleName + "','" + req.session.lastName + "','" + req.session.displayName + "','" + req.session.email + "','" + req.session.password + "','" + req.session.city + "','" + req.session.country + "','" + req.session.phone + "')";
        con.query(sql, function (err, result) {
            if (err) {
                res.render("errorBadRequest", { data: { message: err.message } })
                throw err;
            }
            let userId = result.insertId;
            let sql = "INSERT INTO userAvatarImage (userId,imageSource) VALUES ('" + userId + "','" + req.session.image + "')";
            con.query(sql, function (err, result) {
                let sql = "INSERT INTO userPlan (userId,planLevel) VALUES ('" + userId + "','" + "free" + "')";
                con.query(sql, function (err, result) {
                    if (err) {
                        res.render("errorBadRequest", { data: { message: err.message } })
                        throw err;
                    }
                    req.session.destroy();
                    return res.redirect("login");
                })
            })
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
        if (err) {
            return res.render("errorBadRequest", { data: { message: err.message } });
        }
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
        if (err) {
            return res.render("errorBadRequest", { data: { message: err.message } })
        }
    })
}

exports.postLogin = async (req, res, next) => {

    const { error } = validatelogin(req.body);
    if (error) return res.render("errorBadRequest", { data: { message: error.details[0].message } });

    const email = req.body.email;
    const password = req.body.password;

    con.query("SELECT * FROM accounts WHERE email='" + email + "'", async (err, result, fields) => {
        if (err) {
            res.render("errorBadRequest", { data: { message: err.message } })
            throw err;
        }
        if (result.length > 0) {
            let validPass = result[0].password;
            const isValid = await bcrypt.compare(password, validPass);
            if (isValid) {
                req.session.isLoggedIn = true;
                req.session.displayName = result[0].displayName;
                req.session.email = req.body.email;
                let sql = "Select * FROM useravatarimage where userId='" + result[0].userId + "'";
                con.query(sql, (err, result) => {
                    if (err) {
                        res.render("errorBadRequest", { data: { message: err.message } })
                        throw err;
                    }
                    req.session.avatar = result[0].imageSource;
                })
                con.query("SELECT * FROM userPlan where userId='" + result[0].userId + "'", (err, result, fields) => {
                    if (err) {
                        res.render("errorBadRequest", { data: { message: err.message } })
                        throw err;
                    }
                    if (result.length > 0) {
                        req.session.plan = result[0].planLevel;
                        return res.redirect("/dashboard");
                    }
                })
            }
            else {
                let data = {
                    error: true,
                    message: "Incorrect Password"
                }
                res.render("login", { data: data })
            }
        }
        else {
            let data = {
                error: true,
                message: "User don't exist. Signup Instead."
            }
            res.render("login", { data: data })
        }
    });

}

exports.displayDashbaord = (req, res, next) => {
    let expiringAt;
    let sql = "Select * from accounts where email='" + req.session.email + "'";
    con.query(sql, (err, result) => {
        if (err) throw err;
        if (result) {
            let userId = result[0].userId;
            let sql = "Select * from userPlan where userId='" + userId + "'";
            con.query(sql, (err, result) => {
                if (err) throw err;
                if (result) {
                    let expireAt = result[0].expireAt;
                    if (expireAt) {
                        let currDate = Math.round(new Date().getTime() / 1000);
                        if (currDate < expireAt) {
                            let temp = new Date(expireAt * 1000);;
                            expiringAt = temp;
                        }
                    }
                    let avatarPath;
                    let data;
                    let showUpgradePlan = req.session.plan == "free" ? true : false;
                    if (req.session.googleAuth) {
                        avatarPath = req.session.avatar;
                        data = {
                            user: req.session.googleUser,
                            avatar: avatarPath,
                            showUpdateProfile: true,
                            showUpgradePlan: showUpgradePlan,
                            expiringAt: expiringAt
                        }
                    }
                    else {
                        //error line
                        let avatar = req.session.avatar;
                        if (avatar) {
                            let myArray = (avatar.split("/"));
                            avatarPath = "/" + (myArray[1]) + "/" + (myArray[2]);
                        }
                        else {
                            avatarPath="/Images/avatar.png"
                        }
                        data = {
                            user: req.session.displayName,
                            avatar: avatarPath,
                            showUpgradePlan: showUpgradePlan,
                            expiringAt: expiringAt
                        }
                    }
                    res.render("dashboard", { data: data });
                }
            })
        }
    })
}

exports.logout = (req, res, next) => {
    req.session.destroy();
    req.session = null;
    req.logout();
    res.redirect("/login");
}

exports.searchAccount = (req, res, next) => {
    res.render("forgotPass-email", { data: { error: false } });
}

exports.verifyAccount = (req, res, next) => {
    req.session.email = req.body.email;
    con.query("SELECT * FROM accounts WHERE email='" + req.session.email + "'", async (err, result, fields) => {
        if (err) {
            res.render("errorBadRequest", { data: { message: err.message } })
            throw err;
        }
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
                if (err) {
                    res.render("errorBadRequest", { data: { message: err.message } })
                    throw err;
                }
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

exports.resetPassword = async (req, res, next) => {
    const salt = await bcrypt.genSalt(10);
    let encPass = await bcrypt.hash(req.body.password, salt);

    if (req.body.password == req.body.confirmPassword) {
        var sql = "UPDATE accounts SET password = '" + encPass + "' WHERE email = '" + req.session.email + "'";
        con.query(sql, function (err, result) {
            if (err) {
                res.render("errorBadRequest", { data: { message: err.message } })
                throw err;
            }
            req.session.destroy();
            return res.redirect("login");
        });
    }
    else {
        return res.render("forgotPass-reset", { data: { error: true } });
    }
}

exports.displayCompleteProfile = (req, res) => {
    res.render("completeProfile");
}

exports.completeProfile = (req, res) => {

    const city = req.body.city;
    const country = req.body.country;
    const phone = req.body.phone;

    var sql = "UPDATE accounts SET city = '" + city + "'," + "country='" + country + "'," + "phone='" + phone + "' WHERE email = '" + req.session.email + "'";
    con.query(sql, function (err, result) {
        if (err) {
            res.render("errorBadRequest", { data: { message: err.message } })
            throw err;
        }
        return res.redirect("/dashboard");
    });

}

exports.payment = async (req, res) => {

    try {
        const price = await stripe.prices.create({
            product: process.env.prod_id,
            unit_amount: 1900,
            currency: 'usd',
            recurring: {
                interval: 'month',
            },
        })

        const customer = await stripe.customers.create({
            email: req.body.stripeEmail,
            source: req.body.stripeToken
        });

        stripe.subscriptions.create({
            customer: customer.id,
            items: [{
                price: price.id,
            }],
        }).then(stripeRes => {
            let sql = "Select * from accounts where email='" + req.session.email + "'";
            con.query(sql, function (err, result) {
                if (err) {
                    res.render("errorBadRequest", { data: { message: err.message } })
                    throw err;
                }
                let sql = "UPDATE userPlan SET planLevel = 'premium', subscriptionId='" + stripeRes.id + "' ,subscriptionSince='" + (new Date()) + "' , expireAt=NULL WHERE userId = '" + result[0].userId + "'";
                con.query(sql, function (err, result) {
                    if (err) {
                        res.render("errorBadRequest", { data: { message: err.message } })
                        throw err;
                    }
                    req.session.plan = "premium";
                    res.redirect("/dashboard");
                });
            });
        }).catch(err => {
            req.session.plan = "free";
            res.redirect("/dashboard");
        })

    } catch (error) {
        res.render("errorBadRequest", { data: { message: error.message } })
    }

}

exports.cancelSubscription = (req, res) => {
    try {
        let sql = "Select * from accounts where email='" + req.session.email + "'";
        con.query(sql, function (err, result) {
            if (err) throw err;
            let sql = "Select * from userPlan where userId='" + result[0].userId + "'";
            con.query(sql, function (err, result) {
                if (err) {
                    res.render("errorBadRequest", { data: { message: err.message } })
                    throw err;
                }
                stripe.subscriptions.update(result[0].subscriptionId, { cancel_at_period_end: true })
                    .then(stripeRes => {
                        let cancelAt = stripeRes.cancel_at;
                        let sql = "Update userPlan set expireAt='" + cancelAt + "'  where userId='" + result[0].userId + "'";
                        con.query(sql, (err, result) => {
                            if (err) {
                                res.render("errorBadRequest", { data: { message: err.message } })
                                throw err;
                            }
                            else {
                                res.redirect("/dashboard");
                            }
                        })
                    });
            });
        });
    }
    catch (err) {
        res.render("errorBadRequest", { data: { message: err.message } })
    }
}