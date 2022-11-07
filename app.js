//jshint esversion:6

require('dotenv').config() // .env file 
const express = require('express');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const mongoose = require("mongoose");

// ** step 1: passport setup **
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const app = express();


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

// ** step 2: set express session to use with app **
app.use(session({                
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize()); // tell app to use passport and initialize it
app.use(passport.session()); // tell app to use passport for dealing with session

// connect to mongodb service
mongoose.connect('mongodb://localhost:27017/userDB');

// -- create a model: 1) create schema 2) setup model
const passwordSchema = new mongoose.Schema({
    email: String,
    password: String
});

// ** step 3: set up passport local mongoose **
passwordSchema.plugin(passportLocalMongoose); // this will be use to hash and salt our password

// -- create a model: 1) create schema 2) setup model
const User = new mongoose.model("user", passwordSchema);

// ** step 4: create local login strategy ** 
passport.use(User.createStrategy()); 

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res, next) => {
    res.render("home");
});

app.get('/register', (req, res, next) => {
    res.render("register");
});

app.get('/secrets', (req, res, next) => {
    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.post('/register', (req, res, next) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err){
            console.log(err);
            res.redirect('/register');
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect('/secrets');
            });
        }
    })
    
});

app.get('/login', (req, res, next) => {
    res.render("login");
});

app.post('/login', (req, res, next) => {
    
    const userLoginInfo = new User({
        username: req.body.username,
        password: req.body.password
    });

    // use "login" which is a passport function
    req.login(userLoginInfo, (err) => {
        if(err){
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect('/secrets');
            });
        }
    });
});

app.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/')
        }
    })
});

app.listen(3000, () => {
    console.log("Server on port 3001");
});