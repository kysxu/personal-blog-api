import { Router } from "express";
import connectionPool from "../utils/db.mjs";
import supabase from "../utils/supabase.mjs";
import multer from "multer";

const postsRouter = Router();

// Configure Multer memory storage
const multerUpload = multer({ storage: multer.memoryStorage() });
const imageFileUpload = multerUpload.fields([
  { name: "imageFile", maxCount: 1 },
]);

// 1. POST /posts - Create a new post (supports multipart file upload & Supabase Storage)
postsRouter.post("/", imageFileUpload, async (req, res) => {
  try {
    const { title, description, content } = req.body;
    let category_id = req.body.category_id ? parseInt(req.body.category_id) : (req.body.category ? parseInt(req.body.category) : 1);
    if (isNaN(category_id)) category_id = 1;

    let status_id = req.body.status_id ? parseInt(req.body.status_id) : 1;
    if (isNaN(status_id)) status_id = 1;

    let imageUrl = req.body.image || "";

    // If an image file was uploaded via multipart/form-data
    if (req.files && req.files.imageFile && req.files.imageFile[0]) {
      const file = req.files.imageFile[0];
      const bucketName = "my-personal-blog";
      const filePath = `posts/${Date.now()}_${file.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Storage Upload Error:", error);
        return res.status(500).json({
          message: "Failed to upload image to Supabase Storage",
          error: error.message,
        });
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      imageUrl = publicUrlData.publicUrl;
    }

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required." });
    }

    const query = `
      INSERT INTO posts (title, image, category_id, description, content, status_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [title, imageUrl, category_id, description || "", content, status_id];

    const result = await connectionPool.query(query, values);

    return res.status(201).json({
      message: "Created post successfully",
      post: result.rows[0],
    });
  } catch (error) {
    console.error("Database error in POST /posts:", error);
    return res.status(500).json({
      message: "Server could not create post",
      error: error.message,
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
      ORDER BY posts.id DESC
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
      message: "Server could not read post",
      error: error.message,
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

// 4. PUT /posts/:postId - Update existing post (supports multipart image upload)
postsRouter.put("/:postId", imageFileUpload, async (req, res) => {
  try {
    const { postId } = req.params;
    const { title, description, content } = req.body;

    let category_id = req.body.category_id ? parseInt(req.body.category_id) : (req.body.category ? parseInt(req.body.category) : 1);
    if (isNaN(category_id)) category_id = 1;

    let status_id = req.body.status_id ? parseInt(req.body.status_id) : 1;
    if (isNaN(status_id)) status_id = 1;

    let imageUrl = req.body.image || "";

    // If a new image file was uploaded via multipart/form-data
    if (req.files && req.files.imageFile && req.files.imageFile[0]) {
      const file = req.files.imageFile[0];
      const bucketName = "my-personal-blog";
      const filePath = `posts/${Date.now()}_${file.originalname}`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        console.error("Supabase Storage Upload Error on PUT:", error);
        return res.status(500).json({
          message: "Failed to upload image to Supabase Storage",
          error: error.message,
        });
      }

      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
      imageUrl = publicUrlData.publicUrl;
    }

    // Check if post exists
    const checkQuery = `SELECT id, image FROM posts WHERE id = $1`;
    const checkResult = await connectionPool.query(checkQuery, [postId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message: "Server could not find a requested post to update",
      });
    }

    // Keep existing image if no new image or image URL is provided
    if (!imageUrl) {
      imageUrl = checkResult.rows[0].image;
    }

    const updateQuery = `
      UPDATE posts
      SET title = $1, image = $2, category_id = $3, description = $4, content = $5, status_id = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      title || checkResult.rows[0].title,
      imageUrl,
      category_id,
      description !== undefined ? description : "",
      content || checkResult.rows[0].content,
      status_id,
      postId,
    ];

    const updateResult = await connectionPool.query(updateQuery, values);

    return res.status(200).json({
      message: "Updated post successfully",
      post: updateResult.rows[0],
    });
  } catch (error) {
    console.error("Database error in PUT /posts/:postId:", error);
    return res.status(500).json({
      message: "Server could not update post",
      error: error.message,
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

// 6. GET /posts/admin - Admin list of all posts from database
postsRouter.get("/admin", async (req, res) => {
  try {
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
      LEFT JOIN categories ON posts.category_id = categories.id
      LEFT JOIN statuses ON posts.status_id = statuses.id
      ORDER BY posts.id DESC
    `;
    const result = await connectionPool.query(query);
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error("Database error in GET /posts/admin:", error);
    return res.status(500).json({ message: "Server could not read admin posts", error: error.message });
  }
});

// 7. DELETE /posts/admin/:postId - Admin delete post from database
postsRouter.delete("/admin/:postId", async (req, res) => {
  try {
    const { postId } = req.params;
    const checkQuery = `SELECT id FROM posts WHERE id = $1`;
    const checkResult = await connectionPool.query(checkQuery, [postId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: "Post not found to delete" });
    }

    await connectionPool.query(`DELETE FROM posts WHERE id = $1`, [postId]);
    return res.status(200).json({ message: "Deleted post successfully" });
  } catch (error) {
    console.error("Database error in DELETE /posts/admin/:postId:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default postsRouter;
