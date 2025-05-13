// models/Memo.js
const mongoose = require('mongoose');

const memoSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Memo', memoSchema);