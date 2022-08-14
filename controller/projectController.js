import expressAsyncHandler from "express-async-handler";
import ProjectData from "../models/projectDataSchema.js";
import Project from "../models/projectSchema.js";
import Claimant from "../models/claimantSchema.js";
import Rates from "../models/ratesSchema.js";
import Quantum from "../models/quantumSchema.js";
import License from "../models/licenseSchema.js";
import LicenseKey from "../models/licenseKey.js";
import ReviewerData from "../models/reviewerData.js";
import User from "../models/userSchema.js";
import TrailLicense from "../models/trialLicense.js";
import e from "express";

const AddProject = expressAsyncHandler(async (req, res) => {
  try {
    const { name, claimantId, assignedLicenseKey } = req.body;
    console.log("!!!", req.body)
    const nameExist = await Project.findOne({ name, claimantId });
    if (nameExist) {
      res.status(400);
      res.json({ err: "Name already exists!" });
    }
    else {
      const project = await Project.create({
        name,
        claimantId,
        createdBy: req.user._id,
        assignedLicenseKey,
      });
      if (project) {
        // update ProjectId for LicenseKey
        const licenseKey = await LicenseKey.findOne({licenseKey : assignedLicenseKey})
        if (licenseKey) {
          licenseKey['projectId'] = project._id
          const updatedLicenseKey = await licenseKey.save();
        }
  
        // If is license Key is a trail key
        if (assignedLicenseKey.substring(0,5) == 'trail') {
          const trailLicense = await TrailLicense.findOne({licenseKey : assignedLicenseKey})
          trailLicense['projectId'] = project._id
          const updatedTrailLicenseKey = await trailLicense.save();
        }
  
        const projectData = await ProjectData.create({
          createdBy: req.user._id,
          projectId: project._id,
        });
        if (projectData) {
          console.log(projectData, project);
          const x = await Rates.find()
          console.log(x[0].projectRatesContractCommitments)
          const rates = await Rates.create({
            projectData: projectData._id,
            project: project._id,
          });
          console.log('Add Project-----------------')
          const quantum = await Quantum.create({
            projectData: projectData._id,
            project: project._id,
          });
          if (rates && quantum)
            res.status(201).json({
              project,
            });
        }
      } else {
        res.status(400);
        res.json({ err: "Invalid Project data" });
      }
    }
  } 
  catch (error) {
    console.log(error);
  }
});

async function getExecutorName(id) {
  const user = await User.findOne({_id: id, isExecuter: true})
  if (user) {
    return user['userName']
  }
  else {
    return "Not found"
  }
}

const getCreatedProject = expressAsyncHandler(async (req, res) => {
  let result = []
  const project = await Project.find({
    claimantId: req.params.id,
    createdBy: req.user._id,
  });

  if (project) {
    for (let i = 0; i < project.length; i++) {
      let obj = {}
      obj.id = project[i]['_id']
      obj.name = project[i]['name']
      obj.assignedLicenseKey = project[i]['assignedLicenseKey']
      obj.assignedExecuter = await getExecutorName(project[i]['assignedExecuter'][0])
      result.push(obj)
    }
    res.status(200).json(result);
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const getExecuterProject = expressAsyncHandler(async (req, res) => {
  const project = await Project.find({
    claimantId: req.params.id,
    assignedExecuter: req.user._id,
  });
  if (project) {
    res.status(200).json(project);
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

async function releaseLicenseUponProjectDeletion(projectId) {
    const licenseKey = await LicenseKey.findOne({projectId: projectId})
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
  return true
}

const deleteProject = expressAsyncHandler(async (req, res, id) => {
  const project = await Project.findById(req.params.id);

  if (project) {
    if (project.createdBy.equals(req.user._id)) {
      await project.remove();
      if (await !releaseLicenseUponProjectDeletion(req.params.id)) {
        res.status(404);
        res.json({ err: "License Key Not found" });
      }
      const projectData = await ProjectData.findOne({
        projectId: req.params.id,
      });
      await projectData.remove();
      res.json({ message: "Project removed" });
    } else {
      res.status(401);
      res.json({ err: "Unauthorized action" });
    }
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const getEvents = expressAsyncHandler(async (req, res) => {
  let eventList = []
  const projectData = await ProjectData.findOne({projectId: req.body.projectId});
  if (projectData) {
    projectData['events'].forEach(event => {
      eventList.push(event)
    })
    res.json({ data: eventList });
  }
});

const deletePreviewData = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.field
  if (req.body.selectedtab == "dashboard/rates") {
    const rates = await Rates.findOne({ project: req.body.projectId });
    console.log(rates)
    var table = rates[attribute]
    var entryToBeDeleted = req.body.deleteRow
    for (var index in table) {
      if(JSON.stringify(table[index])==JSON.stringify(entryToBeDeleted)) {
        table.splice(index, 1)
      }
    }
    console.log(table) // deleted ab save kr do
    rates.attribute = table
    const updatedRates = await rates.save();
    res.status(200).json(table);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    var table = quantum[attribute]
    var entryToBeDeleted = req.body.deleteRow
    for (var index in table) {
      if(JSON.stringify(table[index])==JSON.stringify(entryToBeDeleted)) {
        table.splice(index, 1)
      }
    }
    console.log(table) // deleted ab save kr do
    quantum.attribute = table
    const updatedQuantum = await quantum.save();
    res.status(200).json(table);
  }
});

const deleteCellPreviewData = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.field
  var dataIndex = req.body.dataIndex;
  if (req.body.selectedtab == "dashboard/rates") {
    const rates = await Rates.findOne({ project: req.body.projectId });
    var table = rates[attribute]
    var rowIndex = req.body.rowIndex
    var columnIndex = req.body.columnIndex
    var arr1 = table[dataIndex] 
    var arr = arr1[rowIndex]
    arr[columnIndex] = "0"
    arr1[rowIndex] = arr
    table[dataIndex] = arr1
    //table[rowIndex][columnIndex] = "0" // pta nhi aise dikaat q ho rha h
    rates.attribute = table
    const updatedRates = await rates.save();
    res.status(200).json(table);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    var table = quantum[attribute]
    var rowIndex = req.body.rowIndex
    var columnIndex = req.body.columnIndex
    var arr1 = table[dataIndex] 
    var arr = arr1[rowIndex]
    arr[columnIndex] = "0"
    arr1[rowIndex] = arr
    table[dataIndex] = arr1
    //table[rowIndex][columnIndex] = "0" // pta nhi aise dikaat q ho rha h
    quantum.attribute = table
    const updatedQuantum = await quantum.save();
    res.status(200).json(table);
  }
});

const addDataToProjectwithDate = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.attribute
  var data = req.body.data
  if (req.body.selectedtab == "dashboard/rates") {
    const rates = await Rates.findOne({ project: req.body.projectId });
    rates[attribute] = data
    const updatedRates = await rates.save();
    res.status(200).json(rates[attribute]);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    quantum[attribute] = data
    const updatedQuantum = await quantum.save();
    res.status(200).json(quantum[attribute]);
  }
});

const addDataToProject = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.attribute
  var data = req.body.data
  if (req.body.selectedtab == "dashboard/rates") {
    const rates = await Rates.findOne({ project: req.body.projectId });
    rates[attribute].push(data)
    const updatedRates = await rates.save();
    res.status(200).json(rates[attribute]);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    quantum[attribute].push(data)
    const updatedQuantum = await quantum.save();
    res.status(200).json(quantum[attribute]);
  }
});

const editCellData = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.attribute
  var data = req.body.data
  var rowIndex = req.body.rowIndex
  var columnIndex = req.body.columnIndex
  var dataIndex = req.body.dataIndex
  if (req.body.selectedtab == "dashboard/rates") 
  {
    const rates = await Rates.findOne({ project: req.body.projectId });
    var table = rates[attribute]
    var subTable = table[dataIndex]
    var row = subTable[rowIndex]
    row[columnIndex] = data
    subTable[rowIndex] = row
    table[dataIndex] = subTable
    rates[attribute]= table
    const updatedRates = await rates.save();
    res.status(200).json(rates[attribute]);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    var table = quantum[attribute]
    var subTable = table[dataIndex]
    var row = subTable[rowIndex]
    row[columnIndex] = data
    subTable[rowIndex] = row
    table[dataIndex] = subTable
    quantum[attribute]= table
    const updatedQuantum = await quantum.save();
    res.status(200).json(quantum[attribute]);
  }
});

const editRowData = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.attribute
  var data = req.body.data
  var index = req.body.index
  console.log(index)
  console.log(req.body)
  if (req.body.selectedtab == "dashboard/rates") 
  {
    const rates = await Rates.findOne({ project: req.body.projectId });
    rates[attribute][index] = data
    const updatedRates = await rates.save();
    res.status(200).json(rates[attribute]);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    quantum[attribute][index] = data
    const updatedQuantum = await quantum.save();
    res.status(200).json(quantum[attribute]);
  }
});

const searchDataWithDates = expressAsyncHandler(async (req, res) => {
  var attribute = req.body.field
  var result = []
  var searchedItem = req.body.searchedItem
  var dataIndex = req.body.dataIndex
  if (req.body.selectedtab == "dashboard/rates") 
  {
    const rates = await Rates.findOne({ project: req.body.projectId });
    var data = rates[attribute][dataIndex]
    let i = -1
    data.splice(0, 1)
    data.forEach((element) => {
      i = i + 1
      var regexString = element.join( "|" )
      const pattern = new RegExp(searchedItem, "i")
      console.log(regexString.search(pattern));
      console.log(regexString)
      if (regexString.search(pattern) != -1) {
        let obj = {}
        obj.index = i
        obj.data = element
        result.push(obj)
        console.log("hello", element)
      }
    })
    res.status(200).json(result);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    var data = quantum[attribute][dataIndex]
    let i = -1
    data.splice(0, 1)
    data.forEach((element) => {
      i = i + 1
      var regexString = element.join( "|" )
      const pattern = new RegExp(searchedItem, "i")
      console.log(regexString.search(pattern));
      console.log(regexString)
      if (regexString.search(pattern) != -1) {
        let obj = {}
        obj.index = i
        obj.data = element
        result.push(obj)
        console.log("hello", element)
      }
    })
    res.status(200).json(result);
  }
});

const searchData = expressAsyncHandler(async (req, res) => {
  var result = []
  var attribute = req.body.field
  var searchedItem = req.body.searchedItem
  if (req.body.selectedtab == "dashboard/rates") 
  {
    console.log(req.body)
    const rates = await Rates.findOne({ project: req.body.projectId });
    var data = rates[attribute]
    let i = -1
    data.splice(0, 1)
    data.forEach((element) => {
      i = i + 1
      var regexString = element.join( "|" )
      const pattern = new RegExp(searchedItem, "i")
      console.log(regexString.search(pattern));
      console.log(regexString)
      if (regexString.search(pattern) != -1) {
        let obj = {}
        obj.index = i
        obj.data = element
        result.push(obj)
        console.log("hello", element)
      }
    })
    res.status(200).json(result);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    var data = quantum[attribute]
    let i = -1
    data.splice(0, 1)
    data.forEach((element) => {
      i = i + 1
      var regexString = element.join( "|" )
      const pattern = new RegExp(searchedItem, "i")
      console.log(regexString.search(pattern));
      console.log(regexString)
      if (regexString.search(pattern) != -1) {
        let obj = {}
        obj.index = i
        obj.data = element
        result.push(obj)
        console.log("hello", element)
      }
    })
    res.status(200).json(result);
  }
});

const downloadTemplate = expressAsyncHandler(async (req, res) => {
  var fileName = req.query.filename
  if (fileName === "tenderRatesLabour") {
    res.download('templates/assets/T7-Rate-Labour (Ten).xlsx')
  }
  if (fileName === "tenderRatesMaterial") {
    res.download('templates/assets/T6-Rate-Material (Ten).xlsx')
  }
  if (fileName === "projectRatesUtilities") {
    res.download('templates/assets/T5-Rate-Utilities.xlsx')
  }
  if (fileName === "projectRatesEquipmentTransport") {
    res.download('templates/assets/T4-Rate-Equipment.xlsx')
  }
  if (fileName === "projectRatesSiteAdministrationStaff") {
    res.download('templates/assets/T3-Rate-Project Admins.xlsx')
  }
  if (fileName === "projectRatesSiteFacilities") {
    res.download('templates/assets/T2-Rate-Site Requirements.xlsx')
  }
  if (fileName === "projectRatesContractCommitments") {
    res.download('templates/assets/T1-Rate-Contractual Commitments.xlsx')
  }
  if (fileName === "actualRatesLabour") {
    res.download('templates/assets/T8-HrlyRate-Actual Manpower.xlsx')
  }

  // for quantum
  if (fileName === "otherUnpaidClaim") {
    res.download('templates/assets/T20-Quantum-Unpaid.xlsx')
  }
  if (fileName === "otherDamages") {
    res.download('templates/assets/T19-Quantum-Damages.xlsx')
  }
  if (fileName === "otherSubcontractorClaims") {
    res.download("templates/assets/T18-Quantum-Subcontractor'sClaim.xlsx")
  }
  if (fileName === "labourRemobilisation") {
    res.download('templates/assets/T17-Quantum-Remobilisation.xlsx')
  }
  if (fileName === "labourDemobilisation") {
    res.download('templates/assets/T16-Quantum-Demobilisation.xlsx')
  }
  if (fileName === "labourProductivity") {
    res.download('templates/assets/T15-Quantum-Productivity.xlsx')
  }
  if (fileName === "workResourcesUtilities") {
    res.download('templates/assets/T14-Quantum-Resoruce-Utility.xlsx')
  }
  if (fileName === "workResourcesMaterial") {
    res.download('templates/assets/T13-Quantum-Resoruce-Material.xlsx')
  }
  if (fileName === "workResourcesManpowerWork") {
    res.download('templates/assets/T12-Quantum-Resoruce-Manpower-Work.xlsx')
  }
  if (fileName === "siteResourcesTransport") {
    res.download('templates/assets/T11-Quantum-Resoruce-Transport.xlsx')
  }
  if (fileName === "siteResourcesEquipment") {
    res.download('templates/assets/T10-Quantum-Resoruce-Equipment.xlsx')
  }
  if (fileName === "siteResourcesManpowerAdmin") {
    res.download('templates/assets/T9-Quantum-Resoruce-Manpower-Admin.xlsx')
  }
});

const updateProject = expressAsyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  console.log(project)
  if (project) {
    if (project.createdBy.equals(req.user._id)) {
      const nameExist = await Project.findOne({
        name: req.body.name,
        claimantId: project.claimantId,
      });
      if (nameExist) {
        res.status(401).json({ err: "Project exists!" });
      }
      project.name = req.body.name || project.name;
      const updateProject = await project.save();
      res.json({
        updateProject,
      });
    } else {
      res.status(401);
      res.json({ err: "Unauthorized action" });
    }
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const getProjectById = expressAsyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (project) {
    if (project.createdBy.equals(req.user._id)) {
      res.status(200).json(project);
    } else {
      res.status(401);
      res.json({ err: "Unauthorized action" });
    }
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const getProjectDataById = expressAsyncHandler(async (req, res) => {
  console.log("$$", req.params.id)
  const projectData = await ProjectData.findOne({ projectId: req.params.id });
  console.log(projectData)
  if (projectData) {
    console.log('->', projectData)
    res.status(200).json(projectData);
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const assignExecuterToProject = expressAsyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.projectId);
  const claimant = await Claimant.findById(req.body.claimantId);
  if (!project || !claimant) {
    res.status(400).json({ err: "Claimant or project not found" });
  }
  const executerExistInProject = await Project.findOne({
    _id: req.body.projectId,
    assignedExecuter: req.body.executerId,
  });
  if (executerExistInProject) {
    res.status(400).json({ err: "Executer already assigned in the project" });
  } else {
    const executerExistInClaimant = await Claimant.findOne({
      _id: req.body.claimantId,
      assignedExecuter: req.body.executerId,
    });
    if (!executerExistInClaimant) {
      claimant.assignedExecuter.push(req.body.executerId);
    }
    project.assignedExecuter.push(req.body.executerId);
    const updatedProject = await project.save();
    const updatedClaimant = await claimant.save();

    res.status(200).json({
      updatedProject,
      updatedClaimant,
    });
  }
});

const removeExecuterFromProject = expressAsyncHandler(async (req, res) => {
  const project = await Project.findById(req.body.projectId);
  const claimant = await Claimant.findById(req.body.claimantId);
  if (!project || !claimant) {
    res.status(400).json({ err: "Claimant or project not found" });
  }
  project.assignedExecuter.pull(req.body.executerId);
  const executerExistsInProject = await Project.findOne({
    claimantId: req.body.claimantId,
    assignedExecuter: req.body.executerId,
  });
  if (!executerExistsInProject) {
    claimant.assignedExecuter.pull(req.body.executerId);
  }

  const updatedProject = await project.save();
  const updatedClaimant = await claimant.save();

  res.status(200).json({
    updatedProject,
    updatedClaimant,
  });
});

const getAssignedExecuter = expressAsyncHandler(async (req, res) => {
  const project = await Project.find({
    assignedExecuter: req.params.id,
  }).populate("claimantId");
  // const _id = project.map((result) => {
  //   return result.claimantId;
  // });
  // const claimant = await Claimant.find({ _id: { $in: _id } });
  res.json({ project });
});

// for deb, rem, damages and subc claims
function updateRatesAttributeWithDate(ratesData, reqData, flag) {
  if(ratesData.length != 0) {
    // need to check for duplicate entry
    let i = 0;
    let j = 0;
    let flag1 = 0;
    for (i = 0; i < reqData.length ; i++) {
      flag1 = 0
      for (j = 0; j < ratesData.length; j++) {
          if (reqData[i][0] == ratesData[j][0] && reqData[i][1] == ratesData[j][1] && flag == 1) { // Here I am updating
              ratesData[j] = reqData[i]
              console.log("Hello there")
              flag1 = 1
              break
          }
          if (reqData[i][0] == ratesData[j][0] && reqData[i][1] == ratesData[j][1]) {
            flag1 = 1
            break
          }
      }
      if (flag1 == 0) {
        ratesData.push(reqData[i])
      }
    }
 }
 else{
   reqData.forEach(element => {
     ratesData.push(element);
   });
 }
}

// for updating feilds where dates are not present
// two conditions :- update or not update existing descriptions (1 for update , 0 for not update)
function updateRatesAttribute(ratesData, reqData, flag) {
  console.log(ratesData)
  console.log(reqData)
  console.log(flag)
  if(ratesData.length != 0) {
    // need to check for duplicate entry
    let i = 0;
    let j = 0;
    let flag1 = 0;
    for (i = 0; i < reqData.length ; i++) {
      flag1 = 0
      for (j = 0; j < ratesData.length; j++) {
          if (reqData[i][0] == ratesData[j][0] && flag == 1) { // Here I am updating
              ratesData[j] = reqData[i]
              flag1 = 1
              break
          }
          if (reqData[i][0] == ratesData[j][0]) {
            flag1 = 1
            break
          }
      }
      if (flag1 == 0) {
        ratesData.push(reqData[i])
      }
    }
 }
 else{
   reqData.forEach(element => {
     ratesData.push(element);
   });
 }
}

function updateMonthAttribute(quantumData, reqData) {
  for (let i = 0; i < quantumData.length; i++) {
    quantumData[i].push(reqData[i][2])
  }
  console.log(quantumData)
}

// for updating feilds where dates are present
function updateRatesAndQuantumWhereDatesAreInvolved(ratesData, reqData, flag) {
  console.log("++++++")
  console.log(ratesData)
  console.log("++++++")
  console.log(reqData)
  console.log("++", reqData[0][2].split('-', 2)[1])
  let i = 0
  let flag1 = 0
  if(ratesData.length != 0) {
    for (i = 0; i < ratesData.length; i++) {
      //if(ratesData[i][0][2].split('-', 2)[1] === reqData[0][2].split('-', 2)[1]) {// same month (Now I am updating)
      if(new Date(ratesData[i][0][2]).getMonth() === new Date(reqData[0][2]).getMonth()  && flag == 1) {// same month (Now I am updating)
        ratesData[i] = reqData
        flag1 = 1
        break
      }
      if (new Date(ratesData[i][0][2]).getMonth() === new Date(reqData[0][2]).getMonth()) {
        flag1 = 1
        break
      }
    }
    if (flag1 == 0) {
      ratesData.push(reqData);
    }
  }
  else {
    ratesData.push(reqData);
  }
}

const uploadImage = expressAsyncHandler(async (req, res) => {
  console.log("from :- ", req.file)
  console.log("Hello", req.params.id)
  const projectData = await ProjectData.findOne({projectId: req.params.id});
  if (projectData) {
    projectData.image = req.file.path || projectData.image;
    const updateProject = await projectData.save();
    res.json({
      updateProject,
    });
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const getImage = expressAsyncHandler(async (req, res) => {
  res.download('./templates/assets/' + req.params.path)
});

const updateProjectData = expressAsyncHandler(async (req, res) => {
  console.log('//////////////////////////////////////////////////////////////////////////////')
  console.log(req.body)
  console.log(req.params.id)
  const projectData = await ProjectData.findOne({
    projectId: req.params.id,
  });
  if (projectData) {
    projectData.dateFormat = req.body.dateFormat || projectData.dateFormat;
    projectData.decimalPlaces =
      req.body.decimalPlaces || projectData.decimalPlaces;
    projectData.contractAs = req.body.contractAs || projectData.contractAs;
    projectData.claimantAs = req.body.claimantAs || projectData.claimantAs;
    projectData.defendentAs = req.body.defendentAs || projectData.defendentAs;
    projectData.regionFormat = req.body.regionFormat || projectData.regionFormat;
    projectData.dayFormat = req.body.dayFormat || projectData.dayFormat;
    projectData.monthFormat = req.body.monthFormat || projectData.monthFormat;
    projectData.yearFormat = req.body.yearFormat || projectData.yearFormat;
    projectData.nameOfDefendant =
      req.body.nameOfDefendant || projectData.nameOfDefendant;
    projectData.contractReference =
      req.body.contractReference || projectData.contractReference;
    projectData.originalContractPrice =
      req.body.originalContractPrice || projectData.originalContractPrice;
    projectData.originalContractPriceType =
      req.body.originalContractPriceType || projectData.originalContractPriceType;
    projectData.originalContractDurationSelect =
      req.body.originalContractDurationSelect ||
      projectData.originalContractDurationSelect;
    projectData.originalContractDurationvalue =
      req.body.originalContractDurationvalue ||
      projectData.originalContractDurationvalue;
    projectData.commencementDate =
      req.body.commencementDate || projectData.commencementDate;
    projectData.contractWorking =
      req.body.contractWorking || projectData.contractWorking;
    projectData.clauses = req.body.clauses || projectData.clauses;
    projectData.status = req.body.status || projectData.status;
    projectData.latestContractAmendmentReference =
      req.body.latestContractAmendmentReference ||
      projectData.latestContractAmendmentReference;
    projectData.reviesdContractPriceValue =
      req.body.reviesdContractPriceValue ||
      projectData.reviesdContractPriceValue;
    projectData.reviesdContractDuration =
      req.body.reviesdContractDuration || projectData.reviesdContractDuration;

    projectData.headOfficeOverheadPercentage =
      req.body.headOfficeOverheadPercentage ||
      projectData.headOfficeOverheadPercentage;
    projectData.profitPercentage =
      req.body.profitPercentage || projectData.profitPercentage;
    projectData.yearlyInterest =
      req.body.yearlyInterest || projectData.yearlyInterest;
    projectData.interestType =
      req.body.interestType || projectData.interestType;
    projectData.compoundingPeriod =
      req.body.compoundingPeriod || projectData.compoundingPeriod;
    projectData.annualTurnoverOfCompany =
      req.body.annualTurnoverOfCompany || projectData.annualTurnoverOfCompany;
    projectData.actualTurnoverOfCompany =
      req.body.actualTurnoverOfCompany || projectData.actualTurnoverOfCompany;
    projectData.annualHOOverheadCost =
      req.body.annualHOOverheadCost || projectData.annualHOOverheadCost;
    projectData.actualHOOverheadCost =
      req.body.actualHOOverheadCost || projectData.actualHOOverheadCost;
    projectData.annualProfit =
      req.body.annualProfit || projectData.annualProfit;
    projectData.actualProfit =
      req.body.actualProfit || projectData.actualProfit;
    if (req.body.events) {
      projectData.events.push({
        eventID: req.body.events.eventID,
        description: req.body.events.description,
        type: req.body.events.type,
        startDate: req.body.events.startDate,
        endDate: req.body.events.endDate,
        daysOnCompletion: req.body.events.daysOnCompletion,
        extendedContractDuaration: req.body.events.extendedContractDuaration,
        pevAtStart: req.body.events.pevAtStart,
        aevAtStart: req.body.events.aevAtStart,
        pevAtEnd: req.body.events.pevAtEnd,
        aevAtEnd: req.body.events.aevAtEnd,
        costClaimable: req.body.events.costClaimable,
        timeClaimReference: req.body.events.timeClaimReference,
        addedBy: req.body.events.addedBy,
        addedOn: req.body.events.addedOn,
      });
    }
    if (req.body.claims) {
      projectData.claims.push({
        eventId: req.body.claims.eventId,
        claimName: req.body.claims.claimName,
        options: req.body.claims.options,
        formula: req.body.claims.formula,
        data: req.body.claims.data,
      });
    }
    // Now update rates :- 
    const rates = await Rates.findOne({ project: req.params.id });
    if (req.body.projectRatesContractCommitments){
      updateRatesAttribute(rates.projectRatesContractCommitments, req.body.projectRatesContractCommitments, req.body.flag);
    }

   if (req.body.projectRatesSiteFacilities) {
    updateRatesAttribute(rates.projectRatesSiteFacilities, req.body.projectRatesSiteFacilities, req.body.flag);
   }

   if (req.body.projectRatesSiteAdministrationStaff) {
    updateRatesAttribute(rates.projectRatesSiteAdministrationStaff, req.body.projectRatesSiteAdministrationStaff, req.body.flag);
   }

    if (req.body.projectRatesEquipmentTransport) {
      updateRatesAttribute(rates.projectRatesEquipmentTransport, req.body.projectRatesEquipmentTransport, req.body.flag);
    }

   if (req.body.projectRatesUtilities) {
    updateRatesAttribute(rates.projectRatesUtilities, req.body.projectRatesUtilities, req.body.flag);
   }

   if (req.body.tenderRatesMaterial) {
    updateRatesAttribute(rates.tenderRatesMaterial, req.body.tenderRatesMaterial, req.body.flag);
   }

   if (req.body.tenderRatesLabour) {
      updateRatesAttribute(rates.tenderRatesLabour, req.body.tenderRatesLabour, req.body.flag);
   }

   if (req.body.actualRatesLabour) {
    updateRatesAndQuantumWhereDatesAreInvolved(rates.actualRatesLabour, req.body.actualRatesLabour, req.body.flag);
   }

   const updatedRates = await rates.save();
   // till here rates are updated and saved

   // Now update Quantum
   const quantum = await Quantum.findOne({ project: req.params.id });
   if (quantum) {
     if (req.body.siteResourcesManpowerAdmin) {
      updateRatesAndQuantumWhereDatesAreInvolved(quantum.siteResourcesManpowerAdmin, req.body.siteResourcesManpowerAdmin, req.body.flag);
     }
 
     if (req.body.siteResourcesEquipment) {
      updateRatesAndQuantumWhereDatesAreInvolved(quantum.siteResourcesEquipment, req.body.siteResourcesEquipment, req.body.flag);
     }
 
     if (req.body.siteResourcesTransport) {
     updateRatesAndQuantumWhereDatesAreInvolved(quantum.siteResourcesTransport, req.body.siteResourcesTransport, req.body.flag);
     }
 
     if (req.body.workResourcesManpowerWork) {
     updateRatesAndQuantumWhereDatesAreInvolved(quantum.workResourcesManpowerWork, req.body.workResourcesManpowerWork, req.body.flag);
     }
 
     if (req.body.workResourcesMaterial) {
      updateRatesAttribute(quantum.workResourcesMaterial, req.body.workResourcesMaterial, req.body.flag);
     }
 
     if (req.body.workResourcesUtilities) {
      let temp = [{}];
      temp = quantum.workResourcesUtilities // table
      for (let i = 0; i < quantum.workResourcesUtilities.length; i++) {
        let arr = temp[i]
        let temp2 = req.body.workResourcesUtilities[i]
        arr.push(temp2[2])
        temp[i] = arr
      }
      console.log(temp)
      quantum.workResourcesUtilities = temp
      await quantum.save();
      console.log(quantum.workResourcesUtilities)
      //updateMonthAttribute(quantum.workResourcesUtilities, req.body.workResourcesUtilities);
     }
     

     if (req.body.labourProductivity) {
     updateRatesAndQuantumWhereDatesAreInvolved(quantum.labourProductivity, req.body.labourProductivity, req.body.flag);
     }
 
     /*if (req.body.labourDemobilisation) {
     updateRatesAttribute(quantum.labourDemobilisation, req.body.labourDemobilisation, req.body.flag)
     }
 
     if (req.body.labourRemobilisation) {
     updateRatesAttribute(quantum.labourRemobilisation, req.body.labourRemobilisation, req.body.flag);
     }
 
     if (req.body.otherSubcontractorClaims) {
     updateRatesAttribute(quantum.otherSubcontractorClaims, req.body.otherSubcontractorClaims, req.body.flag)
     }
 
     if (req.body.otherDamages) {
      updateRatesAttribute(quantum.otherDamages, req.body.otherDamages, req.body.flag)
     }*/

     if (req.body.labourDemobilisation) {
      updateRatesAttributeWithDate(quantum.labourDemobilisation, req.body.labourDemobilisation, req.body.flag)
      }
  
      if (req.body.labourRemobilisation) {
        updateRatesAttributeWithDate(quantum.labourRemobilisation, req.body.labourRemobilisation, req.body.flag);
      }
  
      if (req.body.otherSubcontractorClaims) {
        updateRatesAttributeWithDate(quantum.otherSubcontractorClaims, req.body.otherSubcontractorClaims, req.body.flag)
      }
  
      if (req.body.otherDamages) {
        updateRatesAttributeWithDate(quantum.otherDamages, req.body.otherDamages, req.body.flag)
      }
 
     if (req.body.otherUnpaidClaim) {
      updateRatesAttribute(quantum.otherUnpaidClaim, req.body.otherUnpaidClaim, req.body.flag)
     }
 
     const updatedQuantum = await quantum.save();
     // till here quantum is saved into DB
    }

    const updateProject = await projectData.save();
    res.json({
      updateProject,
    });
  } else {
    res.status(404);
    res.json({ err: "Project not found" });
  }
});

const getRates = expressAsyncHandler(async (req, res) => {
  const rates = await Rates.findOne({ project: req.params.id });
  if (rates) {
    res.status(200).json(rates);
  } else {
    res.status(404);
    res.json({ err: "Rates not found" });
  }
});

const checkRates = expressAsyncHandler(async (req, res) => {
  if (req.body.data) {
    const matchRates = [];

    for (let obj of req.body.data) {
      let query = {};
      query[`${req.body.ratesName}`] = {
        $elemMatch: {
          Description: obj.Description,
        },
      };
      let rates = await Rates.findOne(
        {
          project: req.params.id,
        },
        query
      );
      if (rates) {
        matchRates.push(rates);
      }
    }
    if (matchRates.length > 0) {
      res.status(200).json(matchRates);
    } else {
      res.status(200).json(matchRates);
    }
  }
});

const getQuantum = expressAsyncHandler(async (req, res) => {
  const quantum = await Quantum.findOne({ project: req.params.id });
  if (quantum) {
    res.status(200).json(quantum);
  } else {
    res.status(404);
    res.json({ err: "Quantum not found" });
  }
});

const updateQuantum = expressAsyncHandler(async (req, res) => {
  const quantum = await Quantum.findOne({ project: req.params.id });
  if (quantum) {
    if (req.body.siteResourcesManpowerAdmin)
      quantum.siteResourcesManpowerAdmin.push(
        req.body.siteResourcesManpowerAdmin
      );
    else
      quantum.siteResourcesManpowerAdmin = quantum.siteResourcesManpowerAdmin;

    if (req.body.siteResourcesEquipment)
      quantum.siteResourcesEquipment.push(req.body.siteResourcesEquipment);
    else quantum.siteResourcesEquipment = quantum.siteResourcesEquipment;

    if (req.body.siteResourcesTransport)
      quantum.siteResourcesTransport.push(req.body.siteResourcesTransport);
    else quantum.siteResourcesTransport = quantum.siteResourcesTransport;

    if (req.body.workResourcesManpowerWork)
      quantum.workResourcesManpowerWork.push(
        req.body.workResourcesManpowerWork
      );
    else quantum.workResourcesManpowerWork = quantum.workResourcesManpowerWork;

    if (req.body.workResourcesMaterial)
      quantum.workResourcesMaterial.push(req.body.workResourcesMaterial);
    else quantum.workResourcesMaterial = quantum.workResourcesMaterial;

    if (req.body.workResourcesUtilities)
      quantum.workResourcesUtilities.push(req.body.workResourcesUtilities);
    else quantum.workResourcesUtilities = quantum.workResourcesUtilities;

    if (req.body.labourProductivity)
      quantum.labourProductivity.push(req.body.labourProductivity);
    else quantum.labourProductivity = quantum.labourProductivity;

    if (req.body.labourDemobilisation)
      quantum.labourDemobilisation.push(req.body.labourDemobilisation);
    else quantum.labourDemobilisation = quantum.labourDemobilisation;

    if (req.body.labourRemobilisation)
      quantum.labourRemobilisation.push(req.body.labourRemobilisation);
    else quantum.labourRemobilisation = quantum.labourRemobilisation;

    if (req.body.otherSubcontractorClaims)
      quantum.otherSubcontractorClaims.push(req.body.otherSubcontractorClaims);
    else quantum.otherSubcontractorClaims = quantum.otherSubcontractorClaims;

    if (req.body.otherDamages) quantum.otherDamages.push(req.body.otherDamages);
    else quantum.otherDamages = quantum.otherDamages;

    if (req.body.otherUnpaidClaim)
      quantum.otherUnpaidClaim.push(req.body.otherUnpaidClaim);
    else quantum.otherUnpaidClaim = quantum.otherUnpaidClaim;

    const updatedQuantum = await quantum.save();
    res.json({
      updatedQuantum,
    });
  } else {
    res.status(404);
    res.json({ err: "Quantum not found" });
  }
});

const getPreviewData = expressAsyncHandler(async (req, res) => {
  if (req.body.selectedTab == "dashboard/rates") {
    const rates = await Rates.findOne({ project: req.body.projectId });
    res.status(200).json(rates[req.body.field]);
  }
  else {
    const quantum = await Quantum.findOne({ project: req.body.projectId });
    res.status(200).json(quantum[req.body.field]);
  }
});

//const updateRates = expressAsyncHandler(async (req, res) => {
  const updateRates = async (req, res) => {
  const rates = await Rates.findOne({ project: req.params.id });
  /*if (req.body.projectRatesContractCommitments) {
    const rates = await Rates.updateOne(
      { project: req.params.id },
      {
        $push: {
          projectRatesContractCommitments: {
            $each: req.body.projectRatesContractCommitments,
          },
        },
      }
    ).exec();
    res.status(200).json(rates);
  }*/
  console.log('///', req.body.projectRatesContractCommitments)
  if (req.body.projectRatesContractCommitments)
     rates.projectRatesContractCommitments = req.body.projectRatesContractCommitments;
   else rates.projectRatesContractCommitments = rates.projectRatesContractCommitments;

   if (req.body.projectRatesSiteFacilities)
     rates.projectRatesSiteFacilities = req.body.projectRatesSiteFacilities;
   else rates.projectRatesSiteFacilities = rates.projectRatesSiteFacilities;

   if (req.body.projectRatesSiteAdministrationStaff)
     rates.projectRatesSiteAdministrationStaff = req.body.projectRatesSiteAdministrationStaff;
   else
     rates.projectRatesSiteAdministrationStaff = rates.projectRatesSiteAdministrationStaff;

    if (req.body.projectRatesEquipmentTransport)
     rates.projectRatesEquipmentTransport = req.body.projectRatesEquipmentTransport;
   else
     rates.projectRatesEquipmentTransport = rates.projectRatesEquipmentTransport;

   if (req.body.projectRatesUtilities)
     rates.projectRatesUtilities = req.body.projectRatesUtilities;
   else rates.projectRatesUtilities = rates.projectRatesUtilities;

   if (req.body.tenderRatesMaterial)
     rates.tenderRatesMaterial = req.body.tenderRatesMaterial;
   else rates.tenderRatesMaterial = rates.tenderRatesMaterial;

   if (req.body.tenderRatesLabour)
     rates.tenderRatesLabour = req.body.tenderRatesLabour;
   else rates.tenderRatesLabour = rates.tenderRatesLabour;

  // if (req.body.actualRatesMaterial)
  //   rates.actualRatesMaterial.push(req.body.actualRatesMaterial);
  // else rates.actualRatesMaterial = rates.actualRatesMaterial;

   const updatedRates = await rates.save();
   res.json({
     updatedRates,
   });
}

const validateLicenseEmail = expressAsyncHandler(async (req, res) => {
  const license = await License.findOne({ email: req.body.email });
  if (license) {
    res.status(200);
    res.json({data: "Email Exists"});
  }
  else {
    res.status(404);
    res.json({ err: "Thank you for the intention to buy ClaimDD’s license. However, please sign up before purchasing the license." });
  }
});


const saveLicenseData = expressAsyncHandler(async (req, res) => {
  const license = await License.findOne({ email: req.body.email });
  if (license) {
    license.licenseType = req.body.licenseType
    license.licenseStartDate = req.body.licenseStartDate
    license.validity = req.body.validity
    license.totalProjects = req.body.totalProjects
    license.licenseKeys = req.body.licenseKeys
    license.activeProjects = req.body.activeProjects
    license.region = req.body.region
    license.currency = req.body.currency
    license.projectValueLimit = req.body.projectValueLimit
    license.credit = req.body.credit
    license.creditCurrency = req.body.creditCurrency
    license.transactionID = req.body.transactionID
    const updatedLicense = await license.save();

    // Also create licenseKey DB
    for (let i = 0; i<license.totalProjects; i++) {
      const licenseKey = await LicenseKey.create({
        licenseId: license._id,
        licenseKey: license.licenseKeys[i],
        licenseKeyStartDate: license.licenseStartDate,
        validity: license.validity,
        projectId: 'Not yet assigned',
        licenseStatus: 'ACTIVE',
        projectValue: license.projectValueLimit,
      });
    }
    res.status(200).json(license);
  }
  else {
    res.status(404);
    res.json({ err: "Thank you for the intention to buy ClaimDD’s license. However, please sign up before purchasing the license." });
  }
});

const getLicenseData = expressAsyncHandler(async (req, res) => {
  const license = await License.findOne({ email: req.body.email });
  if (license) {
    res.status(200).json(license);
  }
  else {
    res.status(404);
    res.json({ err: "Owner with " + req.body.email + " not found." });
  }
});

const getActiveLicenseCount = expressAsyncHandler(async (req, res) => {
  let licenseIds = req.body.licenseIds
  let count = 0
  for (let i = 0; i < licenseIds.length; i++) {
    const key = await LicenseKey.findOne({licenseKey: licenseIds[i]})
    if (key) {
      if (key['licenseStatus'] == "ACTIVE") {
        count = count + 1
      }
    }
  }
  res.status(200);
  res.json({'Count': count})
});

const getAllLicenseKeyData = expressAsyncHandler(async (req, res) => {
  const licenseKeys = await LicenseKey.find({ licenseId: req.body.licenseId });
  let result = []
  console.log("License ID:- ", req.body.licenseId)
  if (licenseKeys) {
    for(let i = 0; i < licenseKeys.length; i++) {
      let temp = []
      temp.push(licenseKeys[i]['licenseKey'])
      temp.push(licenseKeys[i]['licenseKeyStartDate'])
      temp.push(licenseKeys[i]['validity'])
      if (licenseKeys[i]['projectId'] != "Not yet assigned") {
        let project = await Project.findOne({_id : licenseKeys[i]['projectId']})
        if (project) {
          temp.push(project.name)
        }
        else {
          temp.push("Not yet assigned")
        }
      }
      else {
        temp.push("Not yet assigned")
      }
      temp.push(licenseKeys[i]['projectValue'])
      temp.push(licenseKeys[i]['licenseStatus'])
      temp.push(licenseKeys[i]['projectId'])
      result.push(temp)
      temp = []
    }
    console.log(result)
    res.status(200).json(result);
  }
  else {
    res.status(404);
    res.json({ err: "License Keys with license id " + req.body.licenseId + " not found." });
  }
});

const updateLicenseValidity = expressAsyncHandler(async (req, res) => {
  const license = await License.findOne({ email: req.body.email });
  if (license) {
    license.validity = req.body.updatedValidity
    const updatedLicense = await license.save();

    const licenseKeys = await LicenseKey.updateMany({licenseId: license._id}, { validity: req.body.updatedValidity });
    res.status(200).json(license);
  }
  else {
    res.status(404);
    res.json({ err: "Owner with " + req.body.email + " not found." });
  }
});

// kal krenge isko
const getManagerProjects = expressAsyncHandler(async (req, res) => {
  let projectList = []
  let claimantList = []
  let finalResult = []
  let obj = {}
  for (let i = 0; i < req.body.length; i++) {
    const project = await Project.find({ createdBy: req.body[i] });
    project.forEach ((item) => {
      projectList.push(item)
    })
    
    const claimant = await Claimant.find({ createdBy: req.body[i] });
    claimant.forEach ((item) => {
      claimantList.push(item)
    })
    obj.projectCount = projectList.length
    obj.claimaintCount = claimantList.length
    obj.projectList = projectList
    obj.claimantList = claimantList
    claimantList = []
    projectList = []
    finalResult.push(obj)
    obj = {}
  }
  res.status(200).json(finalResult);
});

// License Db and LicenseKey DB dono me chnages hongi
const upgradeLicense = expressAsyncHandler(async (req, res) => {
  let countOfNewLicense = 0
  let newLicenseKeys = [];
  const license = await License.findOne({ email: req.body.email });
  if (license) {
    let countOfNewLicense = Number(req.body.newPlanProjectNumber)- Number(license.licenseKeys.length)
    license.activeProjects = req.body.newPlanProjectNumber
    license.projectValueLimit = Math.max(license.projectValueLimit, req.body.newPlanProjectLimit)
    license.totalProjects = req.body.newPlanProjectNumber
    license.validity = req.body.newPlanValidity
    for(let i = 0 ; i < countOfNewLicense ; i++) {
      let r = (Math.random() + 1).toString(36).substring(7);
      license.licenseKeys.push(r)
      newLicenseKeys.push(r)
    }
    const updatedLicense = await license.save();

    for (let i = 0; i < countOfNewLicense; i++) {
      const licenseKey = await LicenseKey.create({
        licenseId: license._id,
        licenseKey: newLicenseKeys[i],
        licenseKeyStartDate: req.body.newPlanstartDate,
        validity: req.body.newPlanValidity,
        projectId: 'Not yet assigned',
        licenseStatus: 'ACTIVE',
        projectValue: req.body.newPlanProjectLimit,
      });
    }
    res.status(200).json("Liocense Upgraded Success");
  }
  else {
    res.status(404);
    res.json({ err: "Owner with " + req.body.email + " not found." });
  }
});

const getAvailableLicenseKeys = expressAsyncHandler(async (req, res) => {
  let availableLicenseKeys = []
  console.log("Hello Ayush", req.body.email)
  const user = await User.findOne({email : req.body.email})
  if (user) {
    let ownerUserId = user['createdBy']
    const owner = await User.findOne({_id : ownerUserId})
    console.log(owner['email'])
    const license = await License.findOne({ email: owner['email'] })
    console.log(license['licenseKeys'])
    for(let i = 0; i < license['licenseKeys'].length; i++) {
      const licenseData = await LicenseKey.findOne({ licenseKey: license['licenseKeys'][i] })
      if (licenseData['projectId'] == 'Not yet assigned') {
        availableLicenseKeys.push(licenseData)
      }
    }
    // Also check if trail license(1 month validity) is available or not
    const trailLicense = await TrailLicense.findOne({email : owner['email']})
    if (trailLicense) {
      if (trailLicense['projectId'] == 'Not yet assigned') {
        availableLicenseKeys.push(trailLicense)
      }
    }
    console.log("--> ", availableLicenseKeys)
    res.status(200).json(availableLicenseKeys);
  }
  else {
    res.status(404).json("Manager Not found !!!");
  }
});

const getAllClaims = expressAsyncHandler(async (req, res) => {
  let claims = []
  console.log('From getAll claims:- ', req.params.id)
  const projectData = await ProjectData.findOne({projectId : req.params.id})
  if (projectData) {
    let claimData = projectData['claims']
    claimData.forEach((data) => {
      //console.log(data['claimName'])
      claims.push(data['claimName'])
    }) 
    res.status(200).json(claims);
  }
  else {
    res.status(404).json("Project Data not found !!!");
  }
});

const assignProjectToReviewer = expressAsyncHandler(async (req, res) => {
  const { projectId, claimantId, claim, reviewerId } = req.body;
  const reviewerExist = await ReviewerData.findOne({ projectId: req.body.projectId, claimantId: req.body.claimantId,  claim: req.body.claim, reviewerId: req.body.reviewerId});
  if (reviewerExist) {
    res.status(400);
    res.json({ err: "Same claim can't be assigned again to Reviewer" });
    return;
  }
  const reviewerData = await ReviewerData.create({
    projectId,
    claimantId,
    claim,
    reviewerId,
  });
  if(reviewerData) {
    res.status(200).json("Data saved success");
  }
  else {
    res.status(404).json("Data not saved error !!!");
  }
});

const unassignClaimFromReviewer = expressAsyncHandler(async (req, res) => {
  const reviewer = await ReviewerData.findOne({reviewerId: req.body.reviewerId, claim: req.body.claim})
  if (reviewer) {
    await reviewer.remove();
    res.status(200).json("Unassigned reviewer successfully")
  }
  else {
    res.status(404).json({'error': "Reviewer not found"});
  }
});


const showassignProjectOfReviewer = expressAsyncHandler(async (req, res) => {
  let revData = []
  let obj = {}
  const reviewerData = await ReviewerData.find({reviewerId: req.params.id});
  if(reviewerData) {
    for(let i = 0; i < reviewerData.length; i++) {
      const project = await Project.findOne({_id: reviewerData[i].projectId})
      if (project) {
        obj.projectName = project.name
      } else {
        obj.projectName = "Not Found"
      }
      const claimant = await Claimant.findOne({_id: reviewerData[i].claimantId})
      if (claimant) {
        obj.claimantName = claimant.name
      } else {
        obj.claimantName = "Not Found"
      }
      obj.projectId = reviewerData[i].projectId
      obj.claimantId = reviewerData[i].claimantId
      obj.claim = reviewerData[i].claim
      revData.push(obj)
      obj = {}
    }
    res.status(200).json(revData)
  }
  else {
    res.status(404).json("Data not found !!!");
  }
});

const getLicenseDates = expressAsyncHandler(async (req, res) => {
  const licenseKeyData = await LicenseKey.findOne({projectId: req.params.id});
  const trailLicenseData = await TrailLicense.findOne({projectId: req.params.id});
  if(licenseKeyData) {
    res.status(200).json({'License start Date': licenseKeyData['licenseKeyStartDate'], 'validity': licenseKeyData['validity'], 'projectValue': licenseKeyData['projectValue']})
  }
  else if (trailLicenseData) {
    res.status(200).json({'License start Date': trailLicenseData['trialLicenseStartDate'], 'validity': trailLicenseData['validity'], 'projectValue': trailLicenseData['projectValue']})
  }
  else {
    res.status(404);
    res.json({ err : "Data not found !!!" });
  }
});

const deleteEvent = expressAsyncHandler(async (req, res) => {
  console.log(req.body.projectId)
  console.log(req.body.index)
  const projectData = await ProjectData.findOne({projectId: req.body.projectId})
  if (projectData) {
    projectData['events'].splice(req.body.index, 1)
    const updatedProjectData = await projectData.save();
    res.status(200);
    res.json(updatedProjectData)
  }
  else {
    res.status(404);
    res.json({ err : "Project Data not found" });
  }
});

const editEvent = expressAsyncHandler(async (req, res) => {
  console.log(req.body.projectId)
  console.log(req.body.index)
  const projectData = await ProjectData.findOne({projectId: req.body.projectId})
  if (projectData) {
    projectData['events'][req.body.index] = req.body.data
    const updatedProjectData = await projectData.save();
    res.status(200);
    res.json(updatedProjectData)
  }
  else {
    res.status(404);
    res.json({ err : "Project Data not found" });
  }
});

const getManagersCount = expressAsyncHandler(async (req, res) => {
  let ownerEmail = req.params.id
  const owner = await User.findOne({email: ownerEmail})
  if (owner) {
    let ownerId = owner._id
    const manager = await User.find({createdBy: ownerId})
    if (manager) {
      res.status(200).json(manager)
    }
  }
});

const getClaimantCount = expressAsyncHandler(async (req, res) => {
  let managerIdList = req.body
  let claimaintCount = 0
  for(let i = 0; i < managerIdList.length; i++) {
    const claimant = await Claimant.find({createdBy: managerIdList[i]})
    if (claimant)
        claimaintCount = claimaintCount + claimant.length
  }
  res.status(200).json(claimaintCount)
});

const getExecutorCount = expressAsyncHandler(async (req, res) => {
  let managerIdList = req.body
  let executorCount = 0
  for(let i = 0; i < managerIdList.length; i++) {
    const executor = await User.find({createdBy: managerIdList[i]})
    if (executor)
    executor.forEach((data) => {
      if (data.isExecuter) {
        executorCount = executorCount + 1
      }
    })
  }
  res.status(200).json(executorCount)
});

const getActiveProjectsCount = expressAsyncHandler(async (req, res) => {
  let managerIdList = req.body
  let projectCount = 0
  for(let i = 0; i < managerIdList.length; i++) {
    const project = await Project.find({createdBy: managerIdList[i]})
    if (project) {
      projectCount = projectCount + project.length
    }    
  }
  res.status(200).json(projectCount)
});

const getLicenseInfo = expressAsyncHandler(async (req, res) => {
  let result = {}
  let count = 0
  let assignedLicenseCount = 0
  let managerEmail = req.params.id
  const user = await User.findOne({email: managerEmail, isManager: true})
  if (user) {
    let ownerId = user['createdBy']
    let ownerUser = await User.findOne({_id: ownerId})
    if (ownerUser) {
      let ownerEmail = ownerUser['email']
      if (ownerEmail) {
        let licenseData = await License.findOne({email: ownerEmail})
        if (licenseData) {
          //res.status(200).json(licenseData)
          let licenseIds = licenseData.licenseKeys
          for (let i = 0; i < licenseIds.length; i++) {
            const key = await LicenseKey.findOne({licenseKey: licenseIds[i]})
            if (key) {
              if (key['licenseStatus'] == "ACTIVE") {
                count = count + 1
              }
            }
          }
          result.activeLicenseCount = count
          result.assignedLicenseCount = licenseData.totalProjects
          result.validity = licenseData.validity
          res.status(200).json(result);
        }
      }
    }
  }
  else {
    res.status(404).json("Data not found")
  }
});

const getProjectName = expressAsyncHandler(async (req, res) => {
  const project = await Project.findOne({_id : req.params.id})
  console.log('++', project)
  if (project) {
    return res.status(200).json(project.name)
  }
  res.status(404).json("Project Not found !!")
});

const deactivateLicenseKey = expressAsyncHandler(async (req, res) => {
  let licenseKey = req.body.licenseKey
  const license = await LicenseKey.findOne({licenseKey: licenseKey})
  if (license) {
    license.licenseStatus = "NOT ACTIVE"
    await license.save();
    res.status(200).json({msg: 'License deactivated successfully'})
  }
  else {
    res.status(404).json({err : 'License key not found'})
  }
});

const getManagerExecutorNames = expressAsyncHandler(async (req, res) => {
  let managerName = ""
  let executerName = ""
  let executorId = "0"
  const project = await Project.findOne({_id : req.body.projectId})
  if (project) {
    let managerId = project.createdBy.valueOf()
    if (project.assignedExecuter.length > 0) {
      executorId = project.assignedExecuter[0].valueOf()
    }
    let manager = await User.findOne({_id : managerId})
    if (manager) {
      managerName = manager['userName']
    }
    else {
      managerName = "Not Found"
    }
    if (executorId != "0") {
      let executer = await User.findOne({_id : executorId})
      if (executer) {
        executerName = executer['userName']
      }
      else {
        executerName = "Not Found"
      }
    }
    else {
      executerName = "Not Found"
    }
    res.status(200).json({managerName : managerName, executerName : executerName});
  }
  else{
    res.status(404).json("Project Not found !!")
  }
});

export {
  AddProject,
  getCreatedProject,
  deleteProject,
  updateProject,
  getProjectById,
  getProjectDataById,
  updateProjectData,
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
};
