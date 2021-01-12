const passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const con = require("./../mysqlconnection");

passport.use(new GoogleStrategy({
    clientID: "174429280947-46eii4ni8g207a9sldkdfoafjgoo1ha7.apps.googleusercontent.com",
    clientSecret: "JB1B2zBENKp2QwJbW4pijjvn",
    callbackURL: "http://localhost:8080/google/callback"
},
    function (accessToken, refreshToken, profile, cb) {
        //Search that profile.id in mysql if not found 
        let emailToSearch = profile.emails[0].value;
        con.query("SELECT * FROM accounts WHERE email='" + emailToSearch + "'", async (err, result, fields) => {
            if (err) throw err;
            if (!(result.length > 0)) {
                let sql = "INSERT INTO accounts (firstName,lastName,email,status,image) VALUES ('" + profile.name.givenName + "','" + profile.name.familyName + "','" + emailToSearch + "','" + "free" + "','" + profile.photos[0].value + "')";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    return cb(null, profile);
                });
            }
        });
        return cb(null, profile);
    }
));

passport.use(new FacebookStrategy({
    clientID: "406109940646865",
    clientSecret: "18073a628e75e6629fdf19992ac879a7",
    callbackURL: "http://localhost:8080/facebook/callback",
    profileFields: ['id', 'displayName', 'name', 'picture.type(large)', 'email']
},
    function (accessToken, refreshToken, profile, done) {
        let emailToSearch = profile.emails[0].value;
        con.query("SELECT * FROM accounts WHERE email='" + emailToSearch + "'", async (err, result, fields) => {
            if (err) throw err;
            if (!(result.length > 0)) {
                let sql = "INSERT INTO accounts (firstName,lastName,email,status,image) VALUES ('" + profile.name.givenName + "','" + profile.name.familyName + "','" + emailToSearch + "','" + "free" + "','" + profile.photos[0].value + "')";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    return done(null, profile);
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