import mongoose from "mongoose";

const { Schema } = mongoose;

const discussionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 5, maxlength: 100 },
    content: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    comments: [
      {
        text: { type: String, required: true },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Discussion = mongoose.model("Discussion", discussionSchema);
export default Discussion;
