const Shipment = require("../models/Shipment");

// GET ALL SHIPMENTS
exports.getShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({})
      .populate("orderId", "orderNumber status")
      .sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SINGLE SHIPMENT
exports.getShipmentById = async (req, res) => {
  try {
    const s = await Shipment.findOne({ _id: req.params.id })
      .populate("orderId", "orderNumber status");
    if (!s) return res.status(404).json({ message: "Shipment not found" });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE SHIPMENT
exports.createShipment = async (req, res) => {
  try {
    const { title, orderId, status, origin, destination, driver, vehicle } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });
    const shipment = await Shipment.create({
      title, orderId: orderId || null, status: status || "Pending",
      origin, destination, driver, vehicle
    });
    res.status(201).json({ message: "Shipment created", shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE SHIPMENT STATUS
exports.updateShipment = async (req, res) => {
  try {
    const updated = await Shipment.findOneAndUpdate(
      { _id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Shipment not found" });
    res.json({ message: "Shipment updated", shipment: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ADD GPS LOCATION CHECKPOINT TO A SHIPMENT
exports.addLocationCheckpoint = async (req, res) => {
  try {
    const { lat, lng, label, note } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: "lat and lng are required" });

    const shipment = await Shipment.findOneAndUpdate(
      { _id: req.params.id },
      {
        $push: {
          locationLog: {
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            label: label || "Location Update",
            note: note || "",
            recordedAt: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!shipment) return res.status(404).json({ message: "Shipment not found" });
    res.json({ message: "Location checkpoint added", locationLog: shipment.locationLog });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE SHIPMENT
exports.deleteShipment = async (req, res) => {
  try {
    const deleted = await Shipment.findOneAndDelete({ _id: req.params.id });
    if (!deleted) return res.status(404).json({ message: "Shipment not found" });
    res.json({ message: "Shipment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
