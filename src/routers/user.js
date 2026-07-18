import express from "express";
import { getAllUsers } from "../controllers/userController.js";
import { requireAuth } from "../utils/auth.js";

const router = express.Router();

//Get all users

router.get("/", requireAuth, getAllUsers);

export default router;
