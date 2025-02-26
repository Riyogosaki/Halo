import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
{
 name:{
    type:String,
    required:true,
 },
},
);

const messageSending = new mongoose.model("Getting",messageSchema);

export default messageSending