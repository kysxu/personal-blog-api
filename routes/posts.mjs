import { Router } from "express";
import connectionPool from "../utils/db.mjs";

const postsRouter = Router();

postsRouter.post("/", async (req, res) => {
  const { title, image, category_id, description, content, status_id } = req.body;

  if (
    !title ||
    !image ||
    !category_id ||
    !description ||
    !content ||
    !status_id
  ) {
    return res.status(400).json({
      message: "Server could not create post because there are missing data from client",
    });
  }

  try {
    const query = `
      INSERT INTO posts (title, image, category_id, description, content, status_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const values = [title, image, category_id, description, content, status_id];

    await connectionPool.query(query, values);

    return res.status(201).json({
      message: "Created post sucessfully",
    });
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
});

export default postsRouter;
