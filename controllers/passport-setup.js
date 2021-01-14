const passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
const con = require("./../mysqlconnection");

passport.use(new GoogleStrategy({
    clientID: "701851902748-umfgqbhon1di9f714ko9c4j1fflvvq85.apps.googleusercontent.com",
    clientSecret: "td6HDZNu-9u83DX3rENstGGs",
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
    clientID: "236540824578144",
    clientSecret: "d812e4ebc0ecc8ef78a6b750996acfd7",
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