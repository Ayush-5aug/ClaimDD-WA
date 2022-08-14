import express from "express";
import {
  AddClaimant,
  getCreatedClaimant,
  deleteClaimant,
  updateClaimant,
  getClaimantById,
  getExecuterClaimant,
} from "../controller/claimantController.js";
import {
  protect,
  owner,
  manager,
  executer,
} from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create-claimant", protect, manager, AddClaimant);
router.get("/get-all-claimant", protect, manager, getCreatedClaimant);
router.get("/get-executer-claimant", protect, executer, getExecuterClaimant);
router.delete("/delete-claimant/:id", protect, manager, deleteClaimant);
router.put("/update-claimant/:id", protect, manager, updateClaimant);
router.get("/get-claimant/:id", protect, manager, getClaimantById);
export default router;
