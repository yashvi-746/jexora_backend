const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  addLocationCheckpoint,
  deleteShipment,
} = require("../controller/shipmentController");

router.get("/", auth, getShipments);
router.get("/:id", auth, getShipmentById);
router.post("/create", auth, createShipment);
router.put("/:id", auth, updateShipment);
router.post("/:id/location", auth, addLocationCheckpoint);
router.delete("/:id", auth, deleteShipment);

module.exports = router;
