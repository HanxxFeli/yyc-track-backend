/**
 * AdminLog Model
 *
 * Immutable audit trail for all admin and moderation actions.
 *
 * For flagged feedback, the lifecycle is:
 *   1. Feedback is flagged by a user → flagStatus: 'pending' (needs review)
 *   2. Admin approves or rejects the flag → action: 'approve' | 'reject'
 *   3. Record is immediately archived → flagStatus: 'archived' on the Feedback doc
 *      The outcome field here records what the decision was for historical display.
 *
 * For user account actions:
 *   action: 'suspend' | 'reinstate'
 *   outcome is not used — the action itself is self-explanatory.
 *
 * This collection should never be modified after creation.
 *
 * Owned by: Hans
 */

const mongoose = require('mongoose');

const adminLogSchema = new mongoose.Schema(
    {
        /** The admin user who performed the action */
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Admin ID is required'],
        },

        /**
         * The type of action taken.
         *
         *   approve   → admin reviewed a flagged feedback and approved it
         *               (feedback stays visible, moves to archived)
         *   reject    → admin reviewed a flagged feedback and rejected it
         *               (feedback hidden from users, moves to archived)
         *   suspend   → user account was suspended
         *   reinstate → suspended user account was reinstated
         */
        action: {
            type: String,
            enum: {
                values: ['approve', 'reject', 'suspend', 'reinstate'],
                message: "Action must be 'approve', 'reject', 'suspend', or 'reinstate'",
            },
            required: [true, 'Action is required'],
        },

        /**
         * The outcome recorded for the archived history view.
         *
         * For flagged feedback actions:
         *   'approved' → flag was dismissed, feedback remains visible on station page
         *   'rejected' → flag was upheld, feedback is hidden from users
         *
         * Not used for user account actions (suspend/reinstate) — leave null.
         */
        outcome: {
            type: String,
            enum: {
                values: ['approved', 'rejected', null],
                message: "Outcome must be 'approved' or 'rejected'",
        },
            default: null,
        },

        /** Whether the action targeted a feedback entry or a user account */
        targetType: {
            type: String,
            enum: {
                values: ['feedback', 'user'],
                message: 'Target type must be feedback or user',
            },
            required: [true, 'Target type is required'],
        },

        /**
         * The MongoDB ObjectId of the document that was acted upon.
         * References either a Feedback or User document depending on targetType.
         */
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Target ID is required'],
            },

            /** Optional admin note explaining the reason for the action */
            note: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true, // createdAt = when the action was taken
    }
);

// Index for fetching the archived history of a specific feedback entry
adminLogSchema.index({ targetId: 1, targetType: 1 });

// Index for filtering the log by action type (e.g. all approvals, all rejections)
adminLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('AdminLog', adminLogSchema);