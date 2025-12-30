import mongoose from "mongoose";


const articleSchema = new mongoose.Schema({
    
  title: { type: String, required: true },
  url: { type: String, required: true, unique: true },
  publishedAt: { type: Date, required: true },
  content: { type: String, required: true },
  isUpdated: { type: Boolean, default: false },
}, { timestamps: true });

const Article = mongoose.model("Article", articleSchema);

export default Article;