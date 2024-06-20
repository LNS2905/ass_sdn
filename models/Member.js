const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    membername: {
        type: String, required: true,
        unique: true,
    },
    password: { type: String, required: true },
    name: { type: String },
    YOB: { type: Number },
    isAdmin: { type: Boolean, default: false }
}, { timestamps: true });

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;