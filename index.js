const express = require('express');
const app = express();
const User = require('./models/user');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');


mongoose.connect('mongodb://localhost:27017/money-war', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("Mongo connection open")
    })
    .catch(err => {
        console.log("Mongo connection error")
        console.log(err)
    })

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);






app.set('view engine', 'ejs');
app.set('views', 'views');

app.use(express.urlencoded({ extended: true }));

const sessionConfig = {
    secret: 'thisshouldbeabettersecret!',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, 
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig))
// app.use(session({ secret: 'secret' }))
app.use(flash());

app.use((req,res,next)=>{
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})

const CheckAuth = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login')
    }
    next();
}

app.get('/', (req, res) => {
    res.send('THIS IS THE HOME PAGE')
})

app.get('/register', (req, res) => {
    res.render('register')
})
app.post('/register', async (req, res) => {
    try{
        const { email , username , password ,type } = req.body;
        const user = new User({  email , username , password ,type })
        await user.save();
        req.session.user_id = user._id;
        res.redirect('/login')
    }
    catch(err){
        console.log(err);
        if (err.message == "A user with the given username is already registered") {
                req.flash("error", "Name is already in use");
        }
        else if (err.keyValue.email) {
        req.flash("error", "Email is already in use");
        } else if (err.keyValue.username) {
        req.flash("error", "Name is already in use");
        } else {
        req.flash("error", "Sorry! Unable to register");
        }
        res.redirect("/register");
    }   
})


app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user_id = foundUser._id;
        //res.redirect('/');
        //res.render('secret' ,{user:req.user})
        res.redirect('/secret')
    }
    else {
        req.flash("error", " Invalid User Name or Password");
        res.redirect('/login')
    }
})
app.get('/secret' , CheckAuth , async(req,res)=>{
    const user = await User.findById(req.session.user_id)
    res.render('secret' , {user:user})
})

app.listen(8080, () => {
    console.log("Serving on port 8080")
})