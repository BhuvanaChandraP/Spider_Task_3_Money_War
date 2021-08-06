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
    image: {
        data: Buffer, 
		contentType: String 
    }
   
});

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;