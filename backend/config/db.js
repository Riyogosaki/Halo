import mongoose from "mongoose";

 const connectDb = async() =>{

  try {
      const data = await mongoose.connect(process.env.MONGO_URI);
      console.log(`server is Connected:${data.connection.host}`);

  } catch (error) {
    console.error("MONGOOSE IS NOT CONNECTED",error.message);
    process.exit(1);
  }
}
export default connectDb