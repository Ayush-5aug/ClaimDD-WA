import mongoose from "mongoose";

const licenseKeySchema = mongoose.Schema(
  {
    licenseKey : {
        type : String,
    },
    licenseId : {
        type : String,
    },
    licenseKeyStartDate : {
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
    }
  },
  {
    timestamp: true,
  }
);

const LicenseKey = mongoose.model("LicenseKey", licenseKeySchema);

export default LicenseKey;
