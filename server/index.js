import express from "express";
import cors from "cors";
import connectDB from "./utils/db.js";
import logger from "./middlewares/logger.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(logger);

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

connectDB().then(() => {
  app.listen(port, () => console.log(`Server listening on port ${port}`));
});
