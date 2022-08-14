import mongoose from "mongoose";

const licenseSchema = mongoose.Schema(
  {
    email : {
        type : String,
    },
    licenseType : {
        type : String,
    },
    licenseStartDate : {
        type : Date,
    },
    validity : {
        type : Date,
    },
    totalProjects : {
        type : Number,
    },
    licenseKeys : {
        type : Array,
    },
    activeProjects : {
        type : Number,
    },
    region : {
        type : String,
    },
    currency : {
        type: String,
    },
    projectValueLimit : {
        type : String,
    },
    credit : {
        type : String,
    },
    creditCurrency : {
        type : String,
    },
    transactionID : {
        type: String,
    }
  },
  {
    timestamp: true,
  }
);

const License = mongoose.model("License", licenseSchema);

export default License;
