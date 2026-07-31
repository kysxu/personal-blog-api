import { Router } from "express";
import supabase from "../utils/supabase.mjs";
import connectionPool from "../utils/db.mjs";

const authRouter = Router();

// ✅ Register User (POST /auth/register)
authRouter.post("/register", async (req, res) => {
  const { email, password, username, name } = req.body;

  if (!email || !password || !username || !name) {
    return res.status(400).json({ error: "Please fill in all required fields" });
  }

  try {
    // 1. Check if username is already taken in database
    const usernameCheckQuery = `
      SELECT * FROM users
      WHERE username = $1
    `;
    const usernameCheckValues = [username];
    const { rows: existingUser } = await connectionPool.query(
      usernameCheckQuery,
      usernameCheckValues
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ error: "This username is already taken" });
    }

    // 2. Sign up user via Supabase Auth
    const { data, error: supabaseError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (supabaseError) {
      if (supabaseError.code === "user_already_exists") {
        return res
          .status(400)
          .json({ error: "User with this email already exists" });
      }
      return res
        .status(400)
        .json({ error: supabaseError.message || "Failed to create user. Please try again." });
    }

    if (!data.user) {
      return res.status(400).json({ error: "Failed to create user in authentication provider." });
    }

    const supabaseUserId = data.user.id;

    // 3. Insert user info into PostgreSQL users table
    const query = `
      INSERT INTO users (id, username, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [supabaseUserId, username, name, "user"];
    const { rows } = await connectionPool.query(query, values);

    return res.status(201).json({
      message: "User created successfully",
      user: rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ error: "An error occurred during registration" });
  }
});

// ✅ Login User (POST /auth/login)
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(400).json({ error: error.message || "Invalid credentials" });
    }

    const supabaseUserId = data.user.id;
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;
    const { rows } = await connectionPool.query(query, [supabaseUserId]);

    const userProfile = rows[0] || {};

    return res.status(200).json({
      message: "Login successful",
      session: data.session,
      user: {
        id: data.user.id,
        email: data.user.email,
        username: userProfile.username,
        name: userProfile.name,
        role: userProfile.role,
        profilePic: userProfile.profile_pic,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "An error occurred during login" });
  }
});

// ✅ Get Current User Info (GET /auth/get-user)
authRouter.get("/get-user", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Unauthorized or token expired" });
    }

    const supabaseUserId = data.user.id;
    const query = `
      SELECT * FROM users
      WHERE id = $1
    `;
    const values = [supabaseUserId];
    const { rows } = await connectionPool.query(query, values);

    if (!rows.length) {
      return res.status(404).json({ error: "User record not found in database" });
    }

    return res.status(200).json({
      id: data.user.id,
      email: data.user.email,
      username: rows[0].username,
      name: rows[0].name,
      role: rows[0].role,
      profilePic: rows[0].profile_pic,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Reset Password (PUT /auth/reset-password)
authRouter.put("/reset-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { oldPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: Token missing" });
  }

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old password and new password are required" });
  }

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: oldPassword,
    });

    if (loginError) {
      return res.status(400).json({ error: "Invalid old password" });
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default authRouter;
