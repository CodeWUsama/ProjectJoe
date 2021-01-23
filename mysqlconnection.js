var mysql = require('mysql');

let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "thesunestate"
});
module.exports = con;