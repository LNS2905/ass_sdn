const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    rating: { type: Number, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    watch: { type: mongoose.Schema.Types.ObjectId, ref: 'Watch', required: true }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;