const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
require('dotenv').config();
const process = require('process');

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));