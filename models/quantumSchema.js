import mongoose from "mongoose";

const quantumSchema = mongoose.Schema(
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
    siteResourcesManpowerAdmin: [{}],
    siteResourcesEquipment: [{}],
    siteResourcesTransport: [{}],
    workResourcesManpowerWork: [{}],
    workResourcesMaterial: [{}],
    workResourcesUtilities: [{}],
    labourProductivity: [{}],
    labourDemobilisation: [{}],
    labourRemobilisation: [{}],
    otherSubcontractorClaims: [{}],
    otherDamages: [{}],
    otherUnpaidClaim: [{}],
  },
  {
    timestamp: true,
  }
);

const Quantum = mongoose.model("Quantum", quantumSchema);

export default Quantum;
