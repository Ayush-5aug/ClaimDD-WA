import express from "express";
import {
  authUser,
  deleteManager,
  deleteUser,
  getCreatedUser,
  getUserById,
  registerExecuter,
  registerManager,
  registerReviewer,
  registerOwner,
  updateManager,
  updateUser,
  sendVerificationLink,
  verifyVerificationLink,
  checkEmailVerified,
  forgotPwd,
  saveNewpwd,
  getReviewerId,
  getReviewerData,
  changePassword,
  setTrailLicense,
  getTrailLicense
} from "../controller/userController.js";
import { protect, owner, manager, reviewer } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/login", authUser);
router.post("/register", registerOwner);
router.post("/register-manager", protect, owner, registerManager);
router.post("/register-executer", protect, manager, registerExecuter);
router.post("/register-reviewer", protect, manager, registerReviewer);

router.get("/get-manager", protect, owner, getCreatedUser);
router.get("/get-reviewer-id/:email", protect, reviewer, getReviewerId);
router.get("/get-reviewer-data/:id", protect, reviewer, getReviewerData);
router.get("/get-executer", protect, manager, getCreatedUser);
router.get("/get-reviewer", protect, manager, getCreatedUser);
router.put("/edit-manager/:id", protect, owner, updateManager);
router.delete("/delete-manager/:id", protect, owner, deleteManager);
router.put("/edit-executer/:id", protect, manager, updateManager);
router.put("/edit-reviewer/:id", protect, manager, updateManager);
router.delete("/delete-executer/:id", protect, manager, deleteManager);
router.delete("/delete-reviewer/:id", protect, manager, deleteManager);
router.post("/sendVerificationLink", sendVerificationLink);
router.get("/verifyVerificationLink/:id", verifyVerificationLink);
router.get("/forgotPwd", forgotPwd);
router.post("/checkEmailVerified", checkEmailVerified);
router.post("/saveNewpwd", saveNewpwd);
router.post("/changePassword", protect, changePassword);
router.post("/setTrailLicense", protect, owner, setTrailLicense);
router.post("/getTrailLicense", protect, owner, getTrailLicense);
router
  .route("/:id")
  .get(protect, manager, getUserById)
  .delete(protect, manager, deleteUser)
  .put(protect, manager, updateUser);
export default router;
