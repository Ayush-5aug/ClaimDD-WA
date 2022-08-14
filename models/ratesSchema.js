import mongoose from "mongoose";

const ratesSchema = mongoose.Schema(
  {
    projectData: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProjectData",
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectRatesContractCommitments: [{}],
    projectRatesSiteFacilities: [{}],
    projectRatesSiteAdministrationStaff: [{}],
    projectRatesEquipmentTransport: [{}],
    projectRatesUtilities: [{}],
    tenderRatesMaterial: [{}],
    tenderRatesLabour: [{}],
    actualRatesMaterial: [{}],
    actualRatesLabour: [{}],
  },
  {
    timestamp: true,
  }
);

const Rates = mongoose.model("Rates", ratesSchema);

export default Rates;
