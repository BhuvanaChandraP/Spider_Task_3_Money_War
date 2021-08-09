const express = require('express');
const app = express();
const User = require('./models/user');
const Product = require('./models/product');
const Comment = require('./models/comment');
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
        req.flash("error", "Please Login to view the page");
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
        //req.flash("error", "Please upload a image");
        //alert('only images')
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
    
    const user = await User.findById(req.session.user_id)
    //console.log(i)
    res.render('newproduct' )
})

app.post('/newproduct' ,upload.single('image'), CheckAuth , async(req,res)=>{

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
app.get('/updatedetails/:id' , CheckAuth , async(req,res)=>{
    let comments = await Comment.findOne({_id : req.params.id}).populate('ownedBy').populate('product')
    res.render('update' ,{comments})

})
app.post('/updatedetails/:id' , CheckAuth , async(req,res)=>{
    let comments = await Comment.findOne({_id : req.params.id}).populate('ownedBy').populate('product')
    let comment2
    comment2 = await Comment.findOneAndUpdate( {_id : req.params.id} , {rating : req.body.rating} , {
        new: true
    });
    await comment2.save() ;
    comment2 = await Comment.findOneAndUpdate( {_id : req.params.id} , {comment : req.body.comment} , {
        new: true
    });
    await comment2.save() ;
    res.redirect(`/productdetails/${comments.product._id}`);
   // res.render('update' ,{comments})

})
app.delete('/updatedetails/:id/:proid', CheckAuth ,  async (req, res) => {
    const com = await Comment.findOneAndDelete({_id : req.params.id});
    
    const d2 = await Product.findOneAndUpdate( {commented : { $in :[i]}}, { $pull: {review : req.params.id} }, {
        new: true
    });
    await d2.save()
    const d1 = await Product.findOneAndUpdate( {commented : { $in :[i]}} , { $pull: {commented : i} }, {
        new: true
    });
    await d1.save() 
   
    const user = await User.findById(req.session.user_id)
    // let product = await Product.find(req.params.id).populate('owner').populate('biders').populate('review').populate('commented');
    let comments = await Comment.find({ product : req.params.proid}).populate('ownedBy').populate('product')
    let product = await Product.findById(req.params.proid).populate('owner').populate('biders').populate('review').populate('commented');
    //console.log(com);
    //console.log(d2);
    res.render('productdetails' ,{product , comments , user })
    
    //res.redirect(`/productdetails/${req.params.id}`);
});

app.get('/productdetails/:id' , CheckAuth , async(req,res)=>{
    let product = await Product.findById(req.params.id).populate('owner').populate('biders').populate('review').populate('commented');
    let comments = await Comment.find({product : req.params.id}).populate('ownedBy').populate('product')
    const user = await User.findById(req.session.user_id)
    //console.log(product);
    //comments = Comment.find({});
    res.render('productdetails' ,{product ,comments ,user })
})
app.post('/productdetails/:id' , CheckAuth , async(req,res)=>{
    const { rating , comment } = req.body;
    const comment1 = new Comment({ rating , comment , ownedBy: i ,product : req.params.id});
    await comment1.save();
    let update
    update = await Product.findOneAndUpdate( {_id : req.params.id} , {$push : {commented : i}} , {
        new: true
    });
    update.save();
    // comment1.save();
    let product = await Product.findById(req.params.id).populate('owner').populate('biders').populate('review').populate('commented');
    let comments = await Comment.find({product : req.params.id}).populate('ownedBy').populate('product')
    const user = await User.findById(req.session.user_id)
    //comments = Comment.find({});
    //res.send("able to add")
    res.render('productdetails' ,{product , comments , user })
})
// app.delete('/productdetails/:id', CheckAuth ,  async (req, res) => {
//     const com = await Comment.findOneAndDelete({product : req.params.id});
//     const d1 = await Product.findOneAndUpdate( {_id : req.params.id} , { $pull: {commented : i} }, {
//         new: true
//     });
//     await d1.save() 
//     const d2 = await Product.findOneAndUpdate( {_id : req.params.id} , { $pull: {review : req.params.id} }, {
//         new: true
//     });
//     await d2.save()
//     const user = await User.findById(req.session.user_id)
//     let product = await Product.findById(req.params.id).populate('owner').populate('biders').populate('review').populate('commented');
//     let comments = await Comment.find({product : req.params.id}).populate('ownedBy').populate('product')
//     //console.log(com);
//     console.log(d1);
//     res.render('productdetails' ,{product , comments , user })
    
//     //res.redirect(`/productdetails/${req.params.id}`);
// });



// app.put('/productdetails/:id', async (req, res) => {
//     await Comment.findOneAndDelete({product : req.params.id});
//     let comment2
//     comment2 = await Comment.findOneAndUpdate( {product : req.params.id} , {rating : req.body.rating} , {
//         new: true
//     });
//     await comment2.save() ;
//     comment2 = await Comment.findOneAndUpdate( {product : req.params.id} , {comment : req.body.comment} , {
//         new: true
//     });
//     await comment2.save() ;
//     res.redirect(`/productdetails/${req.params.id}`);
// });
app.put('/product/:id',  CheckAuth , async (req, res) =>{
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
        //console.log(product);
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
app.delete('/product/:id',  CheckAuth , async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    req.flash('error', 'The product has been removed');
    res.redirect('/dashboard');
});
app.get('/product/:id',  CheckAuth , async  (req, res) => {
    const product = await Product.findById(req.params.id);
    res.render('edit', {  product: product });
   
});
app.get('/home'  , async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    //const products = await Product.find({}).sort({"productname" : 1 }).populate('owner').populate('biders')
    //const products = await Product.find({}).sort({"baseprice" : -1 }).populate('owner').populate('biders') 
    const products = await Product.find({}).sort({"price" : -1 }).populate('owner').populate('biders')       //.sort({"productname" : 1 })
    //console.log(products);
    res.render('home' , {user:user , products , flg : "1"  , f:"1"})
})


app.get('/dashboard' , CheckAuth , async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.find({}).populate('owner').populate('biders')
    //console.log(t)
    res.render('seller-dashboard' , {user:user , products})
    // if(t === 'seller'){
    //     res.render('seller-dashboard' , {user:user , products})
    // }
    // else
    // {
    //     res.render('buyer-dashboard' , {user:user , products})
    // }

})


// app.get('/secret'  ,  CheckAuth , async(req,res)=>{
//     const user = await User.findById(req.session.user_id)
  
//     const products = await Product.find({}).populate('owner')
  
//     res.render('secret' , {user:user , products})
// })
app.get('/bid/:id' ,  CheckAuth ,  async(req,res)=>{
    const user = await User.findById(req.session.user_id)
  
    const products = await Product.findById(req.params.id).populate('owner')
  
    res.render('bid' ,{user:user , products})
})
app.post('/bid/:id' ,  CheckAuth ,  async(req,res)=>{
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
app.get('/search', CheckAuth ,  async (req, res) =>{
    res.redirect('/home');
});

//Case insensitive search using regular expression
app.post('/search', CheckAuth ,  async (req, res) => {
    const user = await User.findById(req.session.user_id)
    const { search } = req.body;
    //console.log(search);
    let products ;
    let products1 ;
   
    products = await Product.find( { productname: new RegExp(search, 'i') } ).populate('owner').populate('biders');
    //console.log(products);
       
    products1  = await Product.find({ tag : new RegExp(search, 'i') }).populate('owner').populate('biders') ;   
    console.log(products);   
    console.log(products1); 
   
    res.render('home' , {user , products : products , products1 : products1 , flg : "0" , f:"0"})     //, products1 : products1 


});
app.get('/sort', CheckAuth ,  async (req, res) =>{
    res.redirect('/home');
});

//Case insensitive search using regular expression
app.post('/sort', CheckAuth ,  async (req, res) => {
    const user = await User.findById(req.session.user_id)
    var products;
    //console.log(req.body.sort);
    if(req.body.sort == "alpha")
    {
        products = await Product.find({}).sort({"productname" : 1 }).populate('owner').populate('biders')
    }
    else if (req.body.sort == "baseprice")
    {
        products = await Product.find({}).sort({"baseprice" : -1 }).populate('owner').populate('biders') 
    }
    else if (req.body.sort == "bid")
    {
        products = await Product.find({}).sort({"price" : -1 }).populate('owner').populate('biders') 
    }
    else
    {
        products = await Product.find({}).populate('owner').populate('biders') 
    }
    //console.log(products);
    res.render('home' , {user , products , flg : "1" ,f:"1"}) 
     //const products = await Product.find({}).sort({"productname" : 1 }).populate('owner').populate('biders')
    //const products = await Product.find({}).sort({"baseprice" : -1 }).populate('owner').populate('biders') 
    

    // const { search } = req.body;
    // console.log(search);
    // let products ;
    // let products1 ;
   
    // products = await Product.find( { productname: new RegExp(search, 'i') } ).populate('owner');
    // //console.log(products);
       
    // products1  = await Product.find({ tag : new RegExp(search, 'i') }).populate('owner') ;   
    // console.log(products);   
   
        //, products1 : products1 


});
app.get('/logout',(req,res)=>{
    //req.logout();
    req.flash('success',"Successfully Logged Out");
    res.redirect('/login');
})

app.listen(8080, () => {
    console.log("Serving on port 8080")
})