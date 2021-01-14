exports.authroize = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    }
    else {
        return res.render("errorBadRequest", { data: { message: "Please Login First To Continue" } });
    }
}