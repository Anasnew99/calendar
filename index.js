require("dotenv").config();
const express = require('express');
const app = express();
const ejs = require('ejs');
const {google} = require('googleapis');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const findOrCreate = require('mongoose-findorcreate');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
app.set('view engine', 'ejs');
let {OAuth2} = google.auth;
let oAuth2Client = new OAuth2(process.env.GOOGLE_CLIENT_ID,process.env.GOOGLE_CLIENT_SECRET);
let calendar;
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
passport.use(Events.createStrategy());
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://serene-cliffs-75189.herokuapp.com/auth/google/calendar"
  },
  function(accessToken, refreshToken, profile, cb) {
      oAuth2Client.setCredentials({refresh_token:refreshToken,api_key:process.env.API_KEY,access_token:accessToken});
      calendar = google.calendar({version:"v3",auth:oAuth2Client});
    Events.findOrCreate({
    
      userId: String(profile.id)
    }, function(err, user) {
      return cb(err, user);
    });
  }
));
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    Events.findById(id, function(err, user) {
      done(err, user);
    });
  });
  let e = [];
app.get('/',(req,res)=>{
    if(req.isAuthenticated()){
        calendar.events.list({
            calendarId: 'primary',
            timeMin: (new Date()).toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
          }, (err, respo) => {
            if (err) return console.log('The API returned an error: ' + err);
            const events = res.data.items;
            if (events.length) {
              console.log('Upcoming 10 events:');
              events.map((event, i) => {
                const start = event.start.dateTime || event.start.date;
                e.push(`${start} - ${event.summary}`);
              });
              res.render('events',{events});
            } else {
              console.log('No upcoming events found.');
              res.send('No Up Coming Events');
            }
          });
        
    
    }else{
        res.render('login');
    }

})
app.get('/auth/google',
  passport.authenticate('google', {
    scope: ['profile','https://www.googleapis.com/auth/calendar.events']
}));
app.get('/auth/google/calendar',
  passport.authenticate('google', {
    failureRedirect: '/'
  }),
  function(req, res) {
    console.log("Succesfully Logged in With Google ");
    res.redirect('/');
});

app.listen(process.env.PORT||3000, function() {
    console.log(" Server succesfully started ");
});