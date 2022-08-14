import expressAsyncHandler from "express-async-handler";
import Claimant from "../models/claimantSchema.js";
import LicenseKey from "../models/licenseKey.js";
import ProjectData from "../models/projectDataSchema.js";
import Project from "../models/projectSchema.js";
import TrailLicense from "../models/trialLicense.js";

const AddClaimant = expressAsyncHandler(async (req, res) => {
  const { name } = req.body;
  const nameExist = await Claimant.findOne({ name, createdBy: req.user._id });
  if (nameExist) {
    console.log("Present hai")
    res.status(400);
    res.json({ err: "Name already exists!" });
  }
  else {
    const claimant = await Claimant.create({
      name,
      createdBy: req.user._id,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country
    });
    if (claimant) {
      res.status(201).json({
        claimant,
      });
    } else {
      res.status(400);
      res.json({ err: "Invalid Claimant data" });
    }
  }
});

const getCreatedClaimant = expressAsyncHandler(async (req, res) => {
  const claimant = await Claimant.find({ createdBy: req.user._id });
  if (claimant) {
    res.status(200).json(claimant);
  } else {
    res.status(404);
    res.json({ err: "Claimant not found" });
  }
});

const getExecuterClaimant = expressAsyncHandler(async (req, res) => {
  const claimant = await Claimant.find({ assignedExecuter: req.user._id });
  if (claimant) {
    res.status(200).json(claimant);
  } else {
    res.status(404);
    res.json({ err: "Claimant not found" });
  }
});

async function releaseLicenseUponProjectDeletion(projects) {
  for (let i = 0; i < projects.length; i++) {
    const licenseKey = await LicenseKey.findOne({projectId: projects[i]._id})
    if (licenseKey) {
      licenseKey.projectId = "Not yet assigned"
      await licenseKey.save();
    }
    else {
      const trailLicense = await TrailLicense.find({projectId: projectId})
      if (trailLicense) {
        trailLicense.projectId = "Not yet assigned"
        await trailLicense.save();
      }
      else {
        console.log("Return false")
        return false
      }
    }
  }
  return true
}

const deleteClaimant = expressAsyncHandler(async (req, res, id) => {
  const claimant = await Claimant.findById(req.params.id);
  console.log(claimant, req.params.id)
  if (claimant) {
    await claimant.remove();
    const project = await Project.find({claimantId: req.params.id}); // multiple projects v ho skte hai
    console.log(project)
    if (project) {
      if (await !releaseLicenseUponProjectDeletion(project)) {
        res.status(404);
        res.json({ err: "License Key Not found" });
      }
      // deleting from Project & ProjectData Table
      for (let i = 0; i < project.length; i++) {
        await project[i].remove();
        const projectData = await ProjectData.findOne({projectId: project[i]._id})
        if (projectData) {
          await projectData.remove();
        }
      }
    }
    res.json({ message: "Claimant removed" });
  } else {
    res.status(404);
    res.json({ err: "Claimant not found" });
  }
});

const updateClaimant = expressAsyncHandler(async (req, res) => {
  const claimant = await Claimant.findById(req.params.id);
  if (claimant) {
    const nameExist = await Claimant.findOne({
      name: req.body.name,
      createdBy: claimant.createdBy,
    });
    /*if (nameExist) {
      res.status(401).json({ err: "Claimant exists!" });
    }*/
    claimant.name = req.body.name || claimant.name;
    claimant.address = req.body.address || claimant.address;
    claimant.city = req.body.city || claimant.city;
    claimant.country = req.body.country || claimant.country;
    const updateClaimant = await claimant.save();

    res.json({
      updateClaimant,
    });
  } else {
    res.status(404);
    res.json({ err: "Claimant not found" });
  }
});

const getClaimantById = expressAsyncHandler(async (req, res) => {
  const claimant = await Claimant.findById(req.params.id);
  if (claimant) {
    res.status(200).json(claimant);
  } else {
    res.status(404);
    res.json({ err: "Claimant not found" });
  }
});

export {
  AddClaimant,
  getCreatedClaimant,
  deleteClaimant,
  updateClaimant,
  getClaimantById,
  getExecuterClaimant,
};
