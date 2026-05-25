import { Router } from "express";
import { chatWithAi } from "../controllers/ai.controller.js";

const router = Router();

router.route("/chat").post(chatWithAi);

export default router;

