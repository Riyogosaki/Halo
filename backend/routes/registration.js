import express from'express';
import {getProducts,createProducts} from "../controller/registration.controller.js"

const router = express.Router();

router.get("/", getProducts);
router.post("/",createProducts);

export default router