import express from "express";
import cors from "cors";
import postsRouter from "./routes/posts.mjs";
import profilesRouter from "./routes/profiles.mjs";
import authRouter from "./routes/auth.mjs";

const app = express();
const port = process.env.PORT || 4000;

app.use(express.json());

// ✅ CORS configuration (allow all origins for API access)
app.use(cors());

// ✅ Root route (GET /)
app.get("/", (req, res) => {
  return res.status(200).json({ message: "Personal Blog API is running on Vercel!" });
});

// ✅ Health Check API (GET /health)
app.get("/health", (req, res) => {
  return res.status(200).json({ message: "OK" });
});

// ✅ Register Express Routers
app.use("/posts", postsRouter);
app.use("/api/posts", postsRouter);
app.use("/profiles", profilesRouter);
app.use("/auth", authRouter);

// Only listen on port when running locally (not on Vercel Serverless)
if (!process.env.VERCEL) {
  app.listen(port, () => {
    console.log(`Server is running at ${port}`);
  });
}

export default app;
