import express from "express";
import multer from 'multer';
//import { download } from "express/lib/response";
import {
  AddProject,
  getCreatedProject,
  deleteProject,
  updateProject,
  getProjectById,
  updateProjectData,
  getProjectDataById,
  assignExecuterToProject,
  removeExecuterFromProject,
  getAssignedExecuter,
  getExecuterProject,
  getRates,
  getQuantum,
  updateQuantum,
  updateRates,
  checkRates,
  getPreviewData,
  deletePreviewData,
  addDataToProject,
  editRowData,
  downloadTemplate,
  deleteCellPreviewData,
  editCellData,
  addDataToProjectwithDate,
  searchData,
  searchDataWithDates,
  getEvents,
  saveLicenseData,
  getLicenseData,
  updateLicenseValidity,
  getAllLicenseKeyData,
  upgradeLicense,
  getManagerProjects,
  getAvailableLicenseKeys,
  getAllClaims,
  assignProjectToReviewer,
  showassignProjectOfReviewer,
  getLicenseDates,
  deleteEvent,
  editEvent,
  getManagersCount,
  getClaimantCount,
  getExecutorCount,
  getActiveProjectsCount,
  getLicenseInfo,
  uploadImage,
  getImage,
  getProjectName,
  getManagerExecutorNames,
  deactivateLicenseKey,
  unassignClaimFromReviewer,
  getActiveLicenseCount,
  validateLicenseEmail
} from "../controller/projectController.js";
import { protect, manager, owner, executer } from "../middleware/authMiddleware.js";
const router = express.Router();

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './templates/assets/')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname)
    console.log("Sahi h", file)
  }
})

const fileFilter = (req, file, cb) => {
  // reject a file
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
      cb(null, true)
  }
  else {
      cb(null, false)
  }
  
}

const upload = multer({storage: storage, 
  limits : {
      fileSize: 1024 * 1024 * 5
  },
  fileFilter : fileFilter,
})

router.post("/create-project", protect, manager, AddProject);
router.get("/get-all-project/:id", protect, getCreatedProject);
router.get("/get-all-claims/:id", protect, getAllClaims);
router.post("/getAvailableLicenseKeys", protect, manager, getAvailableLicenseKeys);
router.get("/get-executer-project/:id", protect, getExecuterProject);
router.get("/getManagersCount/:id", protect, owner, getManagersCount);
router.delete("/delete-project/:id", protect, manager, deleteProject);
router.post("/delete-event", protect, executer, deleteEvent);
router.post("/getClaimantCount", protect, owner, getClaimantCount);
router.post("/getExecutorCount", protect, owner, getExecutorCount);
router.post("/getActiveProjectsCount", protect, owner, getActiveProjectsCount);
router.post("/edit-event", protect, executer, editEvent);
router.put("/update-project/:id", protect, manager, updateProject);
router.post("/update-project-data/:id", protect, executer, updateProjectData);
router.post("/uploadImage/:id", protect, executer, upload.single('file'), uploadImage);
router.get("/getImage/:path", getImage);
router.get("/getProjectName/:id", getProjectName);
router.get("/get-project-data/:id", protect, getProjectDataById);
router.get("/getLicenseInfo/:id", protect, manager, getLicenseInfo);
router.get("/get-project/:id", protect, manager, getProjectById);
router.post("/assign-executer", protect, manager, assignExecuterToProject);
router.post("/remove-executer", protect, manager, removeExecuterFromProject);
router.get("/assign-executer/:id", protect, manager, getAssignedExecuter);
router.get("/rates/:id", protect, executer, getRates);
router.post("/rates/:id", protect, executer, checkRates);
router.get("/quantum/:id", protect, executer, getQuantum);
router.put("/rates/:id", protect, executer, updateRates);
router.put("/quantum/:id", protect, executer, updateQuantum);
router.post("/get-preview-data", protect, executer, getPreviewData);
router.post("/delete-preview-data", protect, executer, deletePreviewData);
router.post("/addDataToProject", protect, executer, addDataToProject);
router.post("/editRowData", protect, executer, editRowData);
router.get("/download/:id", protect, executer, downloadTemplate);
router.post("/delete-cell-preview-data", protect, executer, deleteCellPreviewData);
router.post("/editCellData", protect, executer, editCellData);
router.post("/addDataToProjectWithDate", protect, executer, addDataToProjectwithDate);
router.post("/searchData", protect, executer, searchData);
router.post("/searchDataWithDates", protect, executer, searchDataWithDates);
router.post("/getEvents", protect, getEvents);
router.post("/saveLicenseData", saveLicenseData);
router.post("/getLicenseData", protect, owner, getLicenseData);
router.post("/updateLicenseValidity", protect, owner, updateLicenseValidity);
router.post("/getAllLicenseKeyData", protect, owner, getAllLicenseKeyData);
router.post("/upgradeLicense", protect, owner, upgradeLicense);
router.post("/getManagerProjects", protect, owner, getManagerProjects);
router.post("/assignProjectToReviewer", protect, manager, assignProjectToReviewer);
router.get("/showassignProjectOfReviewer/:id", protect, manager, showassignProjectOfReviewer);
router.get("/getLicenseDates/:id", protect, executer, getLicenseDates);
router.post("/getManagerExecutorNames", getManagerExecutorNames);
router.post("/deactivateLicenseKey", deactivateLicenseKey);
router.post("/unassignClaimFromReviewer", unassignClaimFromReviewer);
router.post("/getActiveLicenseCount", getActiveLicenseCount);
router.post("/validateLicenseEmail", validateLicenseEmail);
export default router;
