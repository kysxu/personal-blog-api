import app from "../app.mjs";

export default async function handler(req, res) {
  try {
    return app(req, res);
  } catch (err) {
    console.error("Vercel Serverless Handler Error:", err);
    return res.status(500).json({
      error: "Serverless Handler Crash",
      message: err.message,
      stack: err.stack,
    });
  }
}
