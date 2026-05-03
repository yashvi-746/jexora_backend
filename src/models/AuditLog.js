const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "User"
    },

    action: {
      type: String,
    },


    details: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);


