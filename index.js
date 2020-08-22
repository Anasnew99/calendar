require("dotenv").config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
app.set('view engine', 'ejs');
mongoose.connect(process.env.MONGODB_CONNECT, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
},(err)=>{
    if(!err){
        console.log("Success: Connected to MongoDB atlas.");
    }else{
        console.log("Error: [MongoDB Connection] :\n",err);
    }
});
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

const eventSchema = new mongoose.Schema({
    
    userId : String
});
eventSchema.plugin(findOrCreate);
eventSchema.plugin(passportLocalMongoose);
const Events = new mongoose.model("event", eventSchema);
let data="Hello";
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://serene-cliffs-75189.herokuapp.com/auth/google/calendar"
  },
  function(accessToken, refreshToken, profile, cb) {
    Events.findOrCreate({
    
      userId: profile.id
    }, function(err, user) {
      return cb(err, user);
    });
  }
));

app.get('/',(req,res)=>{
    if(req.isAuthenticated()){
        res.send(data);
    }
res.render('login');
})
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile']
}));
app.get('/auth/google/calendar',
  passport.authenticate('google', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    console.log("Succesfully Logged in With Google ");
    res.redirect('/');
});

app.listen(process.env.PORT||3000, function() {
    console.log(" Server succesfully started ");
});