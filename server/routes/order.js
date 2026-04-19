import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  buyOrder,
  sellOrder,
  listMyOrders,
  cancelOrder,
  getOrderBook,
} from "../controllers/order.js";

const router = Router();

router.use(auth);

router.post("/buy", buyOrder);
router.post("/sell", sellOrder);
router.get("/", listMyOrders);
router.get("/book/:symbol", getOrderBook);
router.patch("/:id/cancel", cancelOrder);

export default router;
