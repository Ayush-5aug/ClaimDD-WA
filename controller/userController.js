import expressAsyncHandler from "express-async-handler";
import User from "../models/userSchema.js";
import ReviewerData from "../models/reviewerData.js";
import License from "../models/licenseSchema.js";
import generateToken from "../utils/generateToken.js";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import emailVerify from "../models/emailVerifySchema.js";
import TrailLicense from "../models/trialLicense.js";

var smtpTrans = nodemailer.createTransport(smtpTransport({
  service: 'Gmail',
  auth:{
          user: 'ayush5aug@gmail.com',
      pass: "uvztaustlerkwyny"
}
}))
var rand, mailOptions, host, link;

const authUser = expressAsyncHandler(async (req, res) => {
  const { email, password, userType } = req.body;
  let user = await User.findOne({ email });
  if (user && (await user.matchPassword(password)) && (user[userType] == true)) {
    const {
      userName,
      email,
      isOwner,
      isManager,
      isExecuter,
      isReviewer,
      companyName,
      designation,
      phone,
      city,
      country,
    } = user;
    res.json({
      userName,
      email,
      isOwner,
      companyName,
      designation,
      isManager,
      isExecuter,
      isReviewer,
      phone,
      city,
      country,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    res.json({ err: "Invalid email or password" });
  }
});

const registerOwner = expressAsyncHandler(async (req, res) => {
  console.log(req.body)
  const {
    userName,
    email,
    password,
    companyName,
    designation,
    phone,
    city,
    country,
  } = req.body;
  const userExist = await User.findOne({ email: req.body.email, isOwner: true });
  if (userExist) {
    res.status(400);
    res.json({ err: "Owner already exists" });
    return;
  }
  const user = await User.create({
    userName,
    email,
    password,
    companyName,
    isOwner: true,
    designation,
    phone,
    city,
    country,
  });
  if (user) {
    res.status(201).json({
      message: "user created",
    });
  } else {
    res.status(400);
    res.json({ err: "Invalid user data" });
  }
  // create license Db entry
  const license = await License.create({
    email: req.body.email,
    licenseType: "Trail",
  });

  // As of now, create Trail license for 1 month
  var currentDate = new Date()
  var newDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
  const trailLicense = await TrailLicense.create({
    email: req.body.email,
    licenseKey: "trail_" + req.body.email,
    trialLicenseStartDate: new Date(),
    validity: newDate,
    projectId: "Not yet assigned",
    projectValue: 100000,
    licenseStatus: "ACTIVE",
    currency: "",
    region: "",
    local: ""
  });
});

const registerManager = expressAsyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  const userExist = await User.findOne({ email: req.body.email, isManager: true });
  if (userExist) {
    res.status(400);
    res.json({ err: "Manager already exists!" });
    return;
  }
  const user = await User.create({
    userName,
    email,
    password,
    isManager: true,
    createdBy: req.user._id,
  });
  if (user) {
    res.status(201).json({
      message: "user created",
    });
  } else {
    res.status(400);
    res.json({ err: "Invalid user data" });
  }
});

const registerExecuter = expressAsyncHandler(async (req, res) => {
  console.log(req.body)
  const { userName, email, password } = req.body;
  const userExist = await User.findOne({ email: req.body.email, isExecuter: true });
  if (userExist) {
    res.status(400);
    res.json({ err: "Executor already exists!" });
    return;
  }
  else {
    const user = await User.create({
      userName,
      email,
      password,
      isExecuter: true,
      createdBy: req.user._id,
    });
    if (user) {
      res.status(201).json({
        message: "user created",
      });
    } else {
      res.status(400);
      res.json({ err: "Invalid user data" });
    }
  }
});

const registerReviewer = expressAsyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  const userExist = await User.findOne({ email: req.body.email, isReviewer: true });
  if (userExist) {
    res.status(400);
    res.json({ err: "Reviewer already exists!" });
    return;
  }
  const user = await User.create({
    userName,
    email,
    password,
    isReviewer: true,
    createdBy: req.user._id,
  });
  console.log(user)
  if (user) {
    res.status(201).json({
      message: "user created",
    });
  } else {
    res.status(400);
    res.json({ err: "Invalid user data" });
  }
});

const getUserById = expressAsyncHandler(async (req, res) => {
  const { userName, email, password } = req.body;
  const userExist = await User.findOne({ email });
  if (userExist) {
    res.status(400);
    res.json({ err: "User already exists!" });
  }
  const user = await User.create({
    userName,
    email,
    password,
    isManager: true,
    createdBy: req.user._id,
  });
  if (user) {
    res.status(201).json({
      message: "user created",
    });
  } else {
    res.status(400);
    res.json({ err: "Invalid user data" });
  }
});

const getCreatedUser = expressAsyncHandler(async (req, res) => {
  const user = await User.find({ createdBy: req.user._id }).select("-password");
  if (user) {
    res.status(200).json(user);
  } else {
    res.status(404);
    res.json({ err: "User not found" });
  }
});

const getAllUsers = expressAsyncHandler(async (req, res) => {
  const users = await User.find({});
  res.status(200).json(users);
});

const deleteUser = expressAsyncHandler(async (req, res, id) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    res.json({ err: "User not found" });
  }
});

const updateUser = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (user) {
    user.userName = req.body.userName || user.userName;
    user.email = req.body.email || user.email;
    user.companyName = req.body.companyName || user.companyName;
    user.designation = req.body.designation || user.designation;
    user.phone = req.body.phone || user.phone;
    user.city = req.body.city || user.city;
    user.country = req.body.country || user.country;
    if (req.body.password) {
      user.password = req.body.password;
    }
    const updateUser = await user.save();

    res.json({
      user: updateUser,
    });
  } else {
    res.status(404);
    res.json({ err: "User not found" });
  }
});

const updateManager = expressAsyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  console.log(req.body)
  if (user) {
    user.userName = req.body.userName || user.userName;
    user.email = req.body.email || user.email;
    if (req.body.password) {
      user.password = req.body.password;
    }
    try {
      const updateUser = await user.save();
      res.json({
        user: updateUser,
      });
    } catch (error) {
      res.status(400).json({
        err: "Email already exists!",
      });
    }
  } else {
    res.status(404);
    res.json({ err: "User not found" });
  }
});

const deleteManager = expressAsyncHandler(async (req, res, id) => {
  const user = await User.findById(req.params.id);
  if (user) {
    await user.remove();
    res.json({ message: "User removed" });
  } else {
    res.status(404);
    res.json({ err: "User not found" });
  }
});

const sendVerificationLink = expressAsyncHandler(async (req, res) => {
  const emailverify = await emailVerify.create({
    email : req.body.email,
    isVerified : false,
    userType: req.body.userType
  });
  rand=Math.floor((Math.random() * 100) + 54);
  host=req.get('host');
  console.log(host)
  link="http://"+req.get('host')+"/api/users/verifyVerificationLink/"+rand+"-"+req.body.userType
  ;
  if(req.body.forgotPwd) {
    link="http://"+req.get('host')+"/api/users/forgotPwd";
  }
  mailOptions={
    to : req.body.email,
    subject : "Please confirm your Email account",
    html : "Hello,<br> Please Click on the link to verify your email.<br><a href="+link+">Click here to verify</a>" 
  }
  console.log(mailOptions);
  smtpTrans.sendMail(mailOptions, function(error, response){
  if(error){
        console.log(error);
    res.end("error");
  }else{
        console.log("Message sent: " + response.message);
        //res.end("sent");
        res.json({ message: "Email sent" });
     }
  });
});

const verifyVerificationLink = expressAsyncHandler(async (req, res) => {
  console.log('inside verify')
  if((req.protocol+"://"+req.get('host'))==("http://"+host))
  {
    console.log("Domain is matched. Information is from Authentic email");
    console.log(req.params.id)
  if(req.params.id.split('-')[0]==rand)
  {
    console.log("email is verified");
    const emailverify = await emailVerify.findOne({email : mailOptions.to, userType: req.params.id.split('-')[1]})
    if(emailverify) {
      emailverify.isVerified = true;
      const emailVerifiedUser = await emailverify.save();
      res.end("<h1>Email "+mailOptions.to+" is been Successfully verified <br> Please click on the button to redirect to signup page <a href = 'http://localhost:4200/home/signup'><button>Signup page</button></a");
    }  
    else {
      res.end("<h1>Bad Request</h1>");
    }
  }
  else
  {
    console.log("email is not verified");
    res.end("<h1>Bad Request</h1>");
  }
  }
  else
  {
  res.end("<h1>Request is from unknown source");
  }
});

const checkEmailVerified = expressAsyncHandler(async (req, res) => {
  console.log(req.body)
  const emailVerified = await emailVerify.findOne({email : req.body.email, userType: req.body.userType})
  console.log(emailVerified)
  if(emailVerified) {
    res.json({message : emailVerified.isVerified})
  }
  else {
    res.json({message : false})
  }
});

const forgotPwd = expressAsyncHandler(async (req, res) => {
  if((req.protocol+"://"+req.get('host'))==("http://"+host))
  { 
    console.log("Domain is matched. Information is from Authentic email");
    res.sendFile('D:\\Fiverr Work\\Working here\\server\\dist\\ClaimDD-WA\\forgot-pwd.html')
  }
  else
  {
  res.end("<h1>Request is from unknown source");
  }
});

const saveNewpwd = expressAsyncHandler(async (req, res) => {
  console.log(mailOptions.to)
  console.log(req.body['newPwd'], req.body['cnfPwd'])
  const users = await User.findOne({email : mailOptions.to})
  if (users && req.body['newPwd'] === req.body['cnfPwd']) {
    users['password'] = req.body['newPwd']
    const updateUser = await users.save();
    res.send("<h1>Pwd saved success " + mailOptions.to);
  }
  else {
    res.send("<h1>Pwd Saving failure");
  }
});

const getReviewerId = expressAsyncHandler(async (req, res) => {
  let Email = req.params.email
  const reviewer = await User.findOne({email: Email})
  if (reviewer) {
    res.status(200).json(reviewer._id)
  }
  else {
    res.status(404).json("Reviewer not found")
  }
});

const getReviewerData = expressAsyncHandler(async (req, res) => {
  let reviewerId = req.params.id
  console.log(reviewerId)
  const revData = await ReviewerData.find({reviewerId: reviewerId})
  if (revData) {
    console.log('$', revData)
    res.status(200).json(revData)
  }
  else {
    res.status(404).json("Reviewer Data not found")
  }
});

const changePassword = expressAsyncHandler(async (req, res) => {
  console.log(req.body)
  const users = await User.findOne({email : req.body.email, isOwner: req.body.isOwner, isManager: req.body.isManager, isExecuter: req.body.isExecuter, isReviewer: req.body.isReviewer})
  if (users) {
    users['password'] = req.body['newPwd']
    const updateUser = await users.save();
    res.status(200).json({user: updateUser})
  }
  else {
    res.status(404).json("User not found")
  }
});

const setTrailLicense = expressAsyncHandler(async (req, res) => {
  console.log(req.body)
  const users = await TrailLicense.findOne({email : req.body.email})
  if (users) {
    users['trialLicenseStartDate'] = req.body['trialLicenseStartDate']
    users['validity'] = req.body['validity']
    users['projectValue'] = req.body['projectValue']
    users['currency'] = req.body['currency']
    users['region'] = req.body['region']
    users['local'] = req.body['local']
    const updateUser = await users.save();
    res.status(200).json({user: updateUser})
  }
  else {
    res.status(404).json("User not found")
  }
});

const getTrailLicense = expressAsyncHandler(async (req, res) => {
  console.log("Inside get trail license", req.body.email)
  const trailLicense = await TrailLicense.findOne({email : req.body.email})
  if (trailLicense) {
    res.status(200).json({user: trailLicense})
  }
  else {
    res.status(404).json("User not found")
  }
});

export {
  authUser,
  registerOwner,
  registerManager,
  registerExecuter,
  registerReviewer,
  getUserById,
  getCreatedUser,
  getAllUsers,
  deleteUser,
  updateUser,
  updateManager,
  deleteManager,
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
};
