import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isOwner: {
      type: Boolean,
      required: true,
      default: false,
    },
    isManager: {
      type: Boolean,
      required: true,
      default: false,
    },
    isExecuter: {
      type: Boolean,
      required: true,
      default: false,
    },
    isReviewer: {
      type: Boolean,
      required: true,
      default: false,
    },
    companyName: {
      type: String,
      required: false,
    },
    designation: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: false,
    },
    city: {
      type: String,
      required: false,
    },
    country: {
      type: String,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamp: true,
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
