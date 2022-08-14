import mongoose from "mongoose";

const trialLicenseSchema = mongoose.Schema(
  {
    licenseKey : {
        type : String,
    },
    email : {
        type : String,
    },
    trialLicenseStartDate : {
      type : Date,
    },
    validity : {
        type : Date,
    },
    projectId : {
        type : String,
    },
    projectValue : {
        type : String,
    },
    licenseStatus: {
      type : String,
    },
    currency : {
      type : String,
    },
    region : {
      type : String,
    },
    local : {
      type : String,
    },
  },
  {
    timestamp: true,
  }
);

const TrialLicense = mongoose.model("trialLicense", trialLicenseSchema);

export default TrialLicense;
