// const mongoose = require('mongoose');
// mongoose.connect('mongodb://localhost:27017/e-com');

// const ProductSchema = new mongoose.Schema({
//     name: String,
//     price: Number,
//     Brandname: String
// });

// const saveInDB = async () => {
//     const Product = mongoose.model('product', ProductSchema);
//     let data = new Product(

//         {
//             name: " Sonu suhani",
//             price: 3498,
//             Brandname: "Suhani Dynasty"
//         }
//     );
//     const result = await data.save();
//     console.log(result);
// }
// saveInDB();

// const updateInDb = async () => {
//     const Product = mongoose.model('products', ProductSchema);
//     let data = await Product.updateOne({
//         name: "ankush",
//         $set: { price: 700 }
//     })
//     console.log(data);
// }

// const deleteInDb = async () => {
//     const Product = mongoose.model('products', ProductSchema);
//     let data = await Product.deleteOne({ name: 'M18' });
//     console.log(data);
// }

// const findInDb = async () => {
//     const Product = mongoose.model('products', ProductSchema);
//     let data = await Product.find({ name: 'M18' });
//     console.log(data);
// }
const express = require('express');
require('./config');
const Product = require('./product');

const app =express();
app.use(express.json());
app.post("/create", async (req,resp) =>{
    let data = new Product(req.body);
    let result = await data.save();
    console.log(req.body);
resp.send("Done");
});

// app.get("/list", async(req,resp)=>{
// let data1= new Product.find();
// resp.send(data1);

// });
app.delete("/delete/:id",async(req,resp) =>{
    console.log(req.params);
    let data =await Product.deleteOne(req.params)
    resp.send(data);
})

app.listen(5000);