var mysql = require('mysql');

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database:"testdb2"
});
con.connect(function (err) {
    if (err) {
        throw err;
    };
    console.log("Mysql Connected!");
});

module.exports=con