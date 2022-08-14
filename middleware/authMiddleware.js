import jwt from "jsonwebtoken";
import expressAsyncHandler from "express-async-handler";
import User from "../models/userSchema.js";

const protect = expressAsyncHandler(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_TOKEN);
      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      res.json({
        err: "Not authorized token failed",
      });
    }
  }
  if (!token) {
    res.status(401);
    res.json({
      err: "Not authorized !!!",
    });
  }
});

const owner = (req, res, next) => {
  if (req.user && req.user.isOwner) {
    next();
  } else {
    res.status(401);
    res.json({
      err: "Not authorized not an owner!",
    });
  }
};

const manager = (req, res, next) => {
  if (req.user && req.user.isManager) {
    next();
  } else {
    res.status(401);
    res.json({
      err: "Not authorized not an manager!",
    });
  }
};

const executer = (req, res, next) => {
  if (req.user && req.user.isExecuter) {
    next();
  } else {
    res.status(401);
    res.json({
      err: "Not authorized not an executer!",
    });
  }
};

const reviewer = (req, res, next) => {
  if (req.user && req.user.isReviewer) {
    next();
  } else {
    res.status(401);
    res.json({
      err: "Not authorized not an Reviewer!",
    });
  }
};

export { protect, owner, manager, executer, reviewer };
