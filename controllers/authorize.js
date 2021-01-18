exports.authroize = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    }
    else {
        return res.render("login", { data: { error: true, message: "Please Login First To Continue" } });
    }
}