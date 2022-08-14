import mongoose from "mongoose";

const reviewerDataSchema = mongoose.Schema(
  {
    projectId : {
        type : String,
        required: true,
    },
    claimantId : {
        type : String,
        required: true,
    },
    claim : {
        type : String,
        required: true,
    },
    reviewerId : {
        type : String,
        required: true,
    },
  },
  {
    timestamp: true,
  }
);

const ReviewerData = mongoose.model("ReviewerData", reviewerDataSchema);

export default ReviewerData;
