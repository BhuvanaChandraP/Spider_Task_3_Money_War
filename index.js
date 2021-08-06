const express = require('express');
const app = express();
const User = require('./models/user');
const Product = require('./models/product');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const multer = require('multer');
const methodOverride = require('method-override');

var fs = require('fs'); 
let n ,i ,t;

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
app.set('views', path.join(__dirname, 'views'))

// app.use(express.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: false}));

app.use(methodOverride('_method'));

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







const storage = multer.diskStorage({
    destination: './public/uploads',
    filename: function(req, file, callback) {
        callback(null, file.fieldname + '-' + Date.now() + 
        path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 },
    fileFilter: function(req, file, callback) {
        checkFileType(file, callback);
    }
});


function checkFileType(file, callback, req, res) {
   
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if(mimetype && extname) {
        return callback(null, true);
    } else {
        alert('only images')
        callback("Error: Images only!");
    }
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
     n = foundUser.username;
     i = foundUser._id;
     t = foundUser.type;
    if (foundUser) {
        req.session.user_id = foundUser._id;
        res.redirect('/home')
    }
    else {
        req.flash("error", " Invalid User Name or Password");
        res.redirect('/login')
    }
})
app.get('/newproduct' , CheckAuth , async(req,res)=>{
    if(t !== "seller")
    {
        //alert("You are not a seller");
        res.redirect('/dashboard')
    }
    //const user = await User.findById(req.session.user_id)
    const user = await User.findById(req.session.user_id)
    console.log(i)
    // console.log(req.user)
    res.render('newproduct' )
})

app.post('/newproduct' ,upload.single('image'), CheckAuth , async(req,res)=>{

    //console.log(req.session.user_id)
    
    if(t !== "seller")
    {
        alert("You are not a seller");
        res.redirect('/dashboard')
    }
    const user = await User.findById(req.session.user_id)
    console.log(i)
    var newProduct = { 
		productname: req.body.productname, 
        description: req.body.description,
        tag:req.body.tag,
        owner:i,
        baseprice:req.body.baseprice,
        start : req.body.start,
        end:req.body.end,
		image: { 
			data: fs.readFileSync(path.join('./public/uploads/' + req.file.filename)), 
			contentType: 'image/png'
		} 
	} 
    
    Product.create(newProduct, function(err) {
        if(err) {
            console.log(err);
            req.flash('error_msg', 'Images only!');
            res.render('/secret', {
                            productname,
                            description,
                            image
                        });
        } else {
            req.flash('success', 'Product added successfully!');
            res.redirect('/dashboard');
        }
    })


   
})
app.get('/productdetails/:id' , CheckAuth , async(req,res)=>{
    let product = await Product.findById(req.params.id).populate('owner').populate('biders');
    res.render('productdetails' ,{product})
})
app.put('/product/:id', async (req, res) =>{
    let product = await Product.findById(req.params.id);
    let description1= { description : req.body.description}
    let baseprice1 = {baseprice : req.body.baseprice};
    let  tag1 = {tag:req.body.tag};
   
    try {
        product = await Product.findOneAndUpdate( {_id : req.params.id} , tag1 , {
            new: true
        });
        await product.save() ;
        product = await Product.findOneAndUpdate( {_id : req.params.id} , description1 , {
            new: true
        });
        await product.save() ;
        product = await Product.findOneAndUpdate( {_id : req.params.id} , baseprice1, {
            new: true
        });
        await product.save() ;
        console.log(product);
        //product = await product.save();
        req.flash('success', ' Update successfully ');
        res.redirect('/dashboard');
    }
    catch (err) {
        console.log(err);
        req.flash('error_msg', 'Please fill all the details!');
        res.render('edit', { product: product });  
    }
});
app.delete('/product/:id', async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('error', 'The product has been removed');
    res.redirect('/dashboard');
});
app.get('/product/:id', async  (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render('edit', {  product: product });
   
});
app.get('/home'  , async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.find({}).populate('owner').populate('biders')
  
    res.render('home' , {user:user , products})
})


app.get('/dashboard' ,async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.find({}).populate('owner').populate('biders')
    console.log(t)
    if(t === 'seller'){
        res.render('seller-dashboard' , {user:user , products})
    }
    else
    {
        res.render('buyer-dashboard' , {user:user , products})
    }

})


app.get('/secret'  , async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.find({}).populate('owner')
  
    res.render('secret' , {user:user , products})
})
app.get('/bid/:id' , async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.findById(req.params.id).populate('owner')
  
    res.render('bid' ,{user:user , products})
})
app.post('/bid/:id' , async(req,res)=>{
    let filter1 = {_id:req.params.id }
    const d1 = await Product.findOneAndUpdate( filter1 , { $push: {biders : i} }, {
        new: true
    });
    await d1.save()  
   
    const d2 = await Product.findOneAndUpdate( filter1 , { $push : {price:req.body.price} }, { new : true });
        
    await d2.save()  
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.findById(req.params.id).populate('owner')
    console.log(products);
    res.redirect('/home')
    //res.render('bid' ,{user:user , products})
})

app.get('/logout',(req,res)=>{
    //req.logout();
    req.flash('success',"Successfully Logged Out");
    res.redirect('/login');
})

app.listen(8080, () => {
    console.log("Serving on port 8080")
})