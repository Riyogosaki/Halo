const mongoose = require('mongoose');

const ProductSchema =new mongoose.Schema({
    name:String,
    Price:Number,
    Brandname:String
});
 module.exports = mongoose.model('product',ProductSchema);