import "dotenv/config";
import express from "express";
import cors from "cors";
import postsRouter from "./routes/posts.mjs";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// ✅ CORS configuration for local and deployed Frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173", // Frontend local (Vite)
      "http://localhost:3000", // Frontend local (React)
      "https://your-frontend.vercel.app", // Deployed Frontend URL placeholder
    ],
  })
);

// ✅ Health Check API (GET /health)
app.get("/health", (req, res) => {
  return res.status(200).json({ message: "OK" });
});

app.use("/posts", postsRouter);

app.get("/profiles", (req, res) => {
  return res.json({
    data: {
      name: "john",
      age: 20,
    },
  });
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

export default app;
