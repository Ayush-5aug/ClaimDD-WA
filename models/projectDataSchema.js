import mongoose from "mongoose";

const projectDataSchema = mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    regionFormat: {
      type: String,
    },
    dayFormat: {
      type: String,
    },
    monthFormat: {
      type: String,
    },
    yearFormat: {
      type: String,
    },
    decimalPlaces: {
      type: String,
    },
    contractAs: {
      selected: { type: String },
      value: { type: String },
    },
    claimantAs: {
      selected: { type: String },
      value: { type: String },
    },
    defendentAs: {
      selected: { type: String },
      value: { type: String },
    },
    nameOfDefendant: {
      type: String,
    },
    contractReference: {
      type: String,
    },
    originalContractPrice: {
      type: Number,
    },
    originalContractPriceType: {
      type: String,
    },
    originalContractDurationSelect: {
      type: String,
    },
    originalContractDurationvalue: {
      type: Number,
    },
    commencementDate: {
      type: String,
    },
    contractWorking: {
      type: Number,
    },
    clauses: {
      type: String,
    },
    status: {
      type: String,
    },
    latestContractAmendmentReference: {
      type: String,
    },
    reviesdContractPriceValue: {
      type: Number,
    },
    reviesdContractDuration: {
      type: Number,
    },
    headOfficeOverheadPercentage: {
      type: Number,
    },
    profitPercentage: {
      type: Number,
    },
    yearlyInterest: {
      type: Number,
    },
    interestType: {
      type: String,
    },
    compoundingPeriod: {
      type: String,
    },
    annualTurnoverOfCompany: {
      type: Number,
    },
    actualTurnoverOfCompany: {
      type: Number,
    },
    annualHOOverheadCost: {
      type: Number,
    },
    actualHOOverheadCost: {
      type: Number,
    },
    annualProfit: {
      type: Number,
    },
    actualProfit: {
      type: Number,
    },
    events: [
      {
        eventID: {
          type: String,
        },
        description: {
          type: String,
        },
        type: {
          type: String,
        },
        startDate: {
          type: String,
        },
        endDate: {
          type: String,
        },
        daysOnCompletion: {
          type: Number,
        },
        extendedContractDuaration: {
          type: Number,
        },
        pevAtStart: {
          type: Number,
        },
        aevAtStart: {
          type: Number,
        },
        pevAtEnd: {
          type: Number,
        },
        aevAtEnd: {
          type: Number,
        },
        costClaimable: {
          type: String,
        },
        timeClaimReference: {
          type: String,
        },
        addedBy: {
          type: String,
        },
        addedOn: {
          type: String,
        },
      },
    ],
    claims : [
      {
        claimName: {
          type: String,
        },
        eventId : {
          type: String,
        },
        options: [],
        formula: {
          type: String,
        },
        data: [],
      }
    ],
    image: {
      type: String,
    },
  },
  {
    timestamp: true,
  }
);

const ProjectData = mongoose.model("ProjectData", projectDataSchema);

export default ProjectData;
