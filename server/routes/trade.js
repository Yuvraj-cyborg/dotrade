import { Router } from "express";
import auth from "../middlewares/auth.js";
import { listTrades } from "../controllers/trade.js";

const router = Router();

router.use(auth);
router.get("/", listTrades);

export default router;
