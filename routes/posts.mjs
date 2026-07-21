import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import { validatePostData } from "../middlewares/postValidation.mjs";

const postsRouter = Router();

// 1. POST /posts - Create a new post (with validation middleware)
postsRouter.post("/", validatePostData, async (req, res) => {
  const { title, image, category_id, description, content, status_id } = req.body;

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
    console.error("Database error in POST /posts:", error);
    return res.status(500).json({
      message: "Server could not create post because database connection",
    });
  }
});

// 2. GET /posts - Read all posts with pagination, category filter, and keyword search
postsRouter.get("/", async (req, res) => {
  try {
    const { category, keyword } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const offset = (page - 1) * limit;

    let conditions = [];
    let values = [];

    if (category) {
      values.push(category);
      conditions.push(`categories.name ILIKE $${values.length}`);
    }

    if (keyword) {
      values.push(`%${keyword}%`);
      conditions.push(
        `(posts.title ILIKE $${values.length} OR posts.description ILIKE $${values.length} OR posts.content ILIKE $${values.length})`
      );
    }

    let whereClause = "";
    if (conditions.length > 0) {
      whereClause = " WHERE " + conditions.join(" AND ");
    }

    // Query total count
    const countQuery = `
      SELECT count(*)
      FROM posts
      INNER JOIN categories ON posts.category_id = categories.id
      INNER JOIN statuses ON posts.status_id = statuses.id
      ${whereClause}
    `;
    const countResult = await connectionPool.query(countQuery, values);
    const totalPosts = Number(countResult.rows[0].count);

    // Query matching posts
    const postsValues = [...values, limit, offset];
    const postsQuery = `
      SELECT
        posts.id,
        posts.image,
        categories.name AS category,
        posts.title,
        posts.description,
        posts.date,
        posts.content,
        statuses.status AS status,
        posts.likes_count
      FROM posts
      INNER JOIN categories ON posts.category_id = categories.id
      INNER JOIN statuses ON posts.status_id = statuses.id
      ${whereClause}
      ORDER BY posts.id ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const postsResult = await connectionPool.query(postsQuery, postsValues);

    const totalPages = Math.ceil(totalPosts / limit) || 1;
    const nextPage = page < totalPages ? page + 1 : null;

    return res.status(200).json({
      totalPosts,
      totalPages,
      currentPage: page,
      limit,
      posts: postsResult.rows,
      nextPage,
    });
  } catch (error) {
    console.error("Database error in GET /posts:", error);
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

// 3. GET /posts/:postId - Read single post by ID
postsRouter.get("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const query = `
      SELECT
        posts.id,
        posts.image,
        categories.name AS category,
        posts.title,
        posts.description,
        posts.date,
        posts.content,
        statuses.status AS status,
        posts.likes_count
      FROM posts
      INNER JOIN categories ON posts.category_id = categories.id
      INNER JOIN statuses ON posts.status_id = statuses.id
      WHERE posts.id = $1
    `;

    const result = await connectionPool.query(query, [postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post",
      });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Database error in GET /posts/:postId:", error);
    return res.status(500).json({
      message: "Server could not read post because database connection",
    });
  }
});

// 4. PUT /posts/:postId - Update existing post (with validation middleware)
postsRouter.put("/:postId", validatePostData, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, image, category_id, description, content, status_id } = req.body;

    // Check if post exists
    const checkQuery = `SELECT id FROM posts WHERE id = $1`;
    const checkResult = await connectionPool.query(checkQuery, [postId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to update",
      });
    }

    const updateQuery = `
      UPDATE posts
      SET title = $1, image = $2, category_id = $3, description = $4, content = $5, status_id = $6
      WHERE id = $7
    `;
    const values = [title, image, category_id, description, content, status_id, postId];

    await connectionPool.query(updateQuery, values);

    return res.status(200).json({
      message: "Updated post sucessfully",
    });
  } catch (error) {
    console.error("Database error in PUT /posts/:postId:", error);
    return res.status(500).json({
      message: "Server could not update post because database connection",
    });
  }
});

// 5. DELETE /posts/:postId - Delete existing post
postsRouter.delete("/:postId", async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const checkQuery = `SELECT id FROM posts WHERE id = $1`;
    const checkResult = await connectionPool.query(checkQuery, [postId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to delete",
      });
    }

    const deleteQuery = `DELETE FROM posts WHERE id = $1`;
    await connectionPool.query(deleteQuery, [postId]);

    return res.status(200).json({
      message: "Deleted post sucessfully",
    });
  } catch (error) {
    console.error("Database error in DELETE /posts/:postId:", error);
    return res.status(500).json({
      message: "Server could not delete post because database connection",
    });
  }
});

export default postsRouter;
