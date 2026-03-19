const express = require("express");
const router = express.Router();
const { protect, protectAdmin } = require("../middleware/auth");
const {
  submitFeedback,
  getFeedbackByStation,
  getMyFeedback,
  deleteFeedback,
  getPendingFeedback,
  getArchivedFeedback,
  approveFeedback,
  adminDeleteFeedback,
} = require("../controllers/feedbackController");

// ─────────────────────────────────────────────
// PUBLIC
// ─────────────────────────────────────────────
router.get("/station/:stationId", getFeedbackByStation);

// ─────────────────────────────────────────────
// PRIVATE (logged in users)
// ─────────────────────────────────────────────
router.get("/mine", protect, getMyFeedback);
router.post("/", protect, submitFeedback);
router.delete("/:feedbackId", protect, deleteFeedback);

// ─────────────────────────────────────────────
// ADMIN
// Note: specific admin routes must come before /:feedbackId
// to avoid Express matching "admin" as a feedbackId
// ─────────────────────────────────────────────
router.get("/admin/pending", protectAdmin, getPendingFeedback);
router.get("/admin/archived", protectAdmin, getArchivedFeedback);
router.patch("/admin/:feedbackId/approve", protectAdmin, approveFeedback);
router.delete("/admin/:feedbackId", protectAdmin, adminDeleteFeedback);

module.exports = router;