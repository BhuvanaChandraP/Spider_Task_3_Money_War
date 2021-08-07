const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productname: {
        type: String,
       
    },
    description: {
        type: String,
       
    },
    tag: {
        type: String,
        
    },
    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    baseprice:{
        type:Number
    },
    biders:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'User'  
    },
    price:{
        type:[Number]
    },
    start:{
        type:Date
    },
    end:{
        type:Date
    },
    review:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'Comment'
    },
    commented:{
        type:[mongoose.Schema.Types.ObjectId],
        ref:'User' 
    },
    image: {
        data: Buffer, 
		contentType: String 
    }
   
   
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;