import mongoose from "mongoose";


const cCallSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    castingDirector: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cUser",
      required: true,
    },
    status: {
      type: String,
      default: "open"
    },
    aplicants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export const cCall = mongoose.model("cCall", cCallSchema);
