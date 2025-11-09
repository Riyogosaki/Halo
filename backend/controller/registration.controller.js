
import messageSending from "../model/sending.model.js";

 
 export const getProducts = async ( req,res)=>{
        try {
           const taking = await messageSending.find({});
        res.status(200).json({success:true,data:taking})
       
        } catch (error) {
           console.error("Internal Server Error:",error.message);
           res.status(500).json({success:false,message:"Internal Server Error"});
        }
};

 export const createProducts = async (req,res)=>{
        const {name}= req.body;
       
        try {
              
              const data = await new messageSending({name});
              const result = await data.save();
              
              res.status(201).json({ success: true, data: result });
        } catch (error) {
           console.error("Internal Server Error", error.message);
           res.status(500).json({ success: false, message: "Something is Problem in Internal Sever" });
       
        }

};
