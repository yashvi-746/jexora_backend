const Warehouse = require("../models/Warehouse");

exports.createWarehouse = async (req, res) => {
  try {
    const warehouse = new Warehouse({
      ...req.body,
      owner: req.user.id
    });
    await warehouse.save();
    res.status(201).json(warehouse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find();
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(warehouse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ message: "Warehouse deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
