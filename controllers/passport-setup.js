const passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const con = require("./../mysqlconnection");

passport.use(new GoogleStrategy({
    clientID: process.env.googleClientId,
    clientSecret: process.env.googleClientSecret,
    callbackURL: process.env.googleCallbackURL
},
    function (accessToken, refreshToken, profile, cb) {
        //Search that profile.id in mysql 
        let emailToSearch = profile.emails[0].value;
        let imageToSave = profile.photos[0].value;
        con.query("SELECT * FROM accounts WHERE email='" + emailToSearch + "'", async (err, result, fields) => {
            if (err) throw err;
            if (!(result.length > 0)) {
                let sql = "INSERT INTO accounts (firstName,lastName,email,displayName) VALUES ('" + profile.name.givenName + "','" + profile.name.familyName + "','" + emailToSearch + "','" + profile.displayName  + "')";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    let userId = result.insertId;
                    let sql = "INSERT INTO userPlan (userId,planLevel) VALUES ('" + userId + "','" + "free" + "')";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        let sql = "INSERT INTO userAvatarImage (userId,avatarImageUrl) VALUES ('" + userId + "','" + imageToSave + "')";
                        con.query(sql, function (err, result) {
                            if (err) throw err;
                            return cb(null, profile);
                        })
                    })
                });
            }
        });
        return cb(null, profile);
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.facebookClientID,
    clientSecret: process.env.facebookClientSecret,
    callbackURL: process.env.facebookCallbackURL,
    profileFields: ['id', 'displayName', 'name', 'picture.type(large)', 'email']
},
    function (accessToken, refreshToken, profile, done) {
        let emailToSearch = profile.emails[0].value;
        let imageToSave = profile.photos[0].value;
        con.query("SELECT * FROM accounts WHERE email='" + emailToSearch + "'", async (err, result, fields) => {
            if (err) throw err;
            if (!(result.length > 0)) {
                let sql = "INSERT INTO accounts (firstName,lastName,email,displayName) VALUES ('" + profile.name.givenName + "','" + profile.name.familyName + "','" + emailToSearch + "','" + profile.displayName  + "')";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    let userId = result.insertId;
                    let sql = "INSERT INTO userPlan (userId,planLevel) VALUES ('" + userId + "','" + "free" + "')";
                    con.query(sql, function (err, result) {
                        if (err) throw err;
                        let sql = "INSERT INTO userAvatarImage (userId,avatarImageUrl) VALUES ('" + userId + "','" + imageToSave + "')";
                        con.query(sql, function (err, result) {
                            if (err) throw err;
                            return done(null, profile);
                        })
                    })
                });
            }
        });
        return done(null, profile);
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});