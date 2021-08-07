const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    rating: {
        type: Number,
       
    },
    comment: {
        type: String,
       
    },
    ownedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    product:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Product'
    }
   
});

const Comment = mongoose.model('Comment', CommentSchema);

module.exports = Comment;