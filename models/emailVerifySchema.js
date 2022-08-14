import mongoose from "mongoose";

const emailVerifySchema = mongoose.Schema(
  {
    email : {
        type : String,
    },
    isVerified : {
        type : Boolean,
    },
    userType : {
      type : String,
    }
  },
  {
    timestamp: true,
  }
);

const emailVerify = mongoose.model("emailVerify", emailVerifySchema);

export default emailVerify;
