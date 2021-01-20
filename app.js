const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require("path");
const session = require("express-session");
const routes = require("./routes/user");
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
const passport = require("passport");
const con = require('./mysqlconnection');
require("./controllers/passport-setup");
app.use(session({
    secret: "secret_key",
    saveUninitialized: false,
    resave: false
}))

app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", routes);
app.use(passport.initialize());
app.use(passport.session());

app.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/facebook',
    passport.authenticate('facebook', { scope: ['email'] }));

app.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        req.session.plan = req.user.plan;
        req.session.isLoggedIn = true;
        req.session.googleAuth = true;
        req.session.googleUser = req.user.displayName;
        req.session.email = req.user.emails[0].value;
        req.session.avatar = req.user.photos[0].value;
        con.query("SELECT * FROM accounts where email='" + req.user.emails[0].value + "'", async (err, result, fields) => {
            if (err) throw err;
            if (result.length > 0) {
                let sql = "Select * FROM userPlan where userId='" + result[0].userId + "'";
                con.query(sql, (err, result) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        req.session.plan = result[0].planLevel;
                        res.redirect('/dashboard');
                    }

                })
            }
            else {
                req.session.plan = "free";
                res.redirect("/dashboard");
            }
        })
    });

app.get('/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function (req, res) {
        req.session.plan = req.user.plan;
        req.session.isLoggedIn = true;
        req.session.googleAuth = true;
        req.session.email = req.user.emails[0].value;
        req.session.googleUser = req.user.displayName;
        req.session.avatar = req.user.photos[0].value;
        con.query("SELECT * FROM accounts where email='" + req.user.emails[0].value + "'", async (err, result, fields) => {
            if (err) throw err;
            if (result.length > 0) {
                let sql = "Select * FROM userPlan where userId='" + result[0].userId + "'";
                con.query(sql, (err, result) => {
                    if (err) throw err;
                    if (result.length > 0) {
                        req.session.plan = result[0].planLevel;
                        res.redirect('/dashboard');
                    }

                })
            }
            else {
                req.session.plan = "free";
                res.redirect("/dashboard");
            }
        })
    });

app.listen(8080);

