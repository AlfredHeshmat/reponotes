const express = require("express");
const pool = require("../config/db");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE repository
router.post("/", protect, async (req, res) => {
  try {
    const { github_repo, github_url, language, is_favorite } = req.body;

    if (!github_repo || !github_url) {
      return res.status(400).json({
        success: false,
        message: "github_repo and github_url are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO repositories 
       (user_id, github_repo, github_url, language, is_favorite)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        github_repo,
        github_url,
        language || null,
        is_favorite || false,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Repository created successfully",
      repository: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create repository",
      error: error.message,
    });
  }
});

// GET all repositories for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM repositories 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      repositories: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch repositories",
      error: error.message,
    });
  }
});

// GET single repository
router.get("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM repositories 
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Repository not found",
      });
    }

    res.json({
      success: true,
      repository: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch repository",
      error: error.message,
    });
  }
});

// UPDATE repository
router.put("/:id", protect, async (req, res) => {
  try {
    const { github_repo, github_url, language, is_favorite } = req.body;

    const result = await pool.query(
      `UPDATE repositories
       SET github_repo = $1,
           github_url = $2,
           language = $3,
           is_favorite = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        github_repo,
        github_url,
        language || null,
        is_favorite || false,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Repository not found or not authorized",
      });
    }

    res.json({
      success: true,
      message: "Repository updated successfully",
      repository: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update repository",
      error: error.message,
    });
  }
});

// DELETE repository
router.delete("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM repositories
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Repository not found or not authorized",
      });
    }

    res.json({
      success: true,
      message: "Repository deleted successfully",
      repository: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete repository",
      error: error.message,
    });
  }
});

module.exports = router;