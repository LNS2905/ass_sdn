const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Watch = require('../models/Watch');
const authMiddleware = require('../middleware/verify');

// Post a comment on a watch
router.post('/:watchId', authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
        const { rating, content } = req.body;
        const watch = await Watch.findById(req.params.watchId);
        if (!watch) {
            return res.render('error', { message: 'Watch not found', memberInformation: req.session.member });
        }

        // Check if the member has already commented on this watch
        const existingComment = await Comment.findOne({ author: req.session.member._id, watch: req.params.watchId });
        if (existingComment) {
            return res.render('error', { message: 'You have already commented on this watch', memberInformation: req.session.member });
        }

        const comment = new Comment({ rating, content, author: req.session.member._id, watch: req.params.watchId });
        await comment.save();

        watch.comments.push(comment._id);
        await watch.save();

        res.redirect(`/watches/${req.params.watchId}`);
    } catch (error) {
        console.error('Error posting comment:', error);
        res.render('error', { message: 'Error posting comment', error, memberInformation: req.session.member });
    }
});

// Edit a comment
router.post('/edit/:commentId', authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
        const { rating, content } = req.body;
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.render('error', { message: 'Comment not found', memberInformation: req.session.member });
        }

        if (comment.author.toString() !== req.session.member._id.toString()) {
            return res.render('error', { message: 'You are not authorized to edit this comment', memberInformation: req.session.member });
        }

        comment.rating = rating;
        comment.content = content;
        await comment.save();

        res.redirect(`/watches/${comment.watch}`);
    } catch (error) {
        console.error('Error editing comment:', error);
        res.render('error', { message: 'Error editing comment', error, memberInformation: req.session.member });
    }
});

// Delete a comment
router.post('/delete/:commentId', authMiddleware.ensureAuthenticated, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.commentId);

        if (!comment) {
            return res.render('error', { message: 'Comment not found', memberInformation: req.session.member });
        }

        if (comment.author.toString() !== req.session.member._id.toString()) {
            return res.render('error', { message: 'You are not authorized to delete this comment', memberInformation: req.session.member });
        }

        await Comment.findByIdAndDelete(comment._id);

        const watch = await Watch.findById(comment.watch);
        watch.comments.pull(comment._id);
        await watch.save();

        res.redirect(`/watches/${comment.watch}`);
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.render('error', { message: 'Error deleting comment', error, memberInformation: req.session.member });
    }
});

module.exports = router;