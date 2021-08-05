const mongoose = require('mongoose')
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt')


const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },   
    type:{
        type:String,
        required: true
    }
   

});

UserSchema.statics.findAndValidate = async function (username, password) {
    const foundUser = await this.findOne({ username });
    if(foundUser !== null){
    const isValid = await bcrypt.compare(password, foundUser.password);
    return isValid ? foundUser : false;
    }
    else{
       return false ; 
    }
}

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
})



const User = mongoose.model('User',UserSchema);
module.exports = User ;
