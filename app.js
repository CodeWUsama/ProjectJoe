const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require("path");
const session = require("express-session");
const routes = require("./routes/user");
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: "secret_key",
    saveUninitialized: false,
    resave:false
}))

app.use(express.json())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", routes);
app.use("/user", routes);

app.listen(8080);

