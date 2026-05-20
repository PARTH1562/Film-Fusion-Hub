import mongoose from "mongoose";

const { Schema } = mongoose;

const pollSchema = new Schema(
  {
    question: { type: String, required: true, trim: true, minlength: 5, maxlength: 200 },
    options: [
      {
        text: { type: String, required: true },
        votes: { type: Number, default: 0 },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    voters: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  {
    timestamps: true,
  }
);

export const Poll = mongoose.model("Poll", pollSchema);
export default Poll;
