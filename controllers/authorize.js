let con = require("./../mysqlconnection");

exports.authroize = (req, res, next) => {
    if (req.session.isLoggedIn) {

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
                            if (currDate >= expireAt) {
                                req.session.plan = "free";
                                let sql1 = "Update userPlan set expireAt=NULL, subscriptionSince=NULL, subscriptionId=NULL, planLevel='free' where userId='" + userId + "'";
                                con.query(sql1, (err, result) => {
                                    if (err) {
                                        res.render("errorBadRequest", { data: { message: err.message } })
                                        throw err;
                                    }
                                });
                            }
                        }
                    }
                })
            }
        }) 
        next();
    }
    else {
        return res.render("login", { data: { error: true, message: "Please Login First To Continue" } });
    }
}