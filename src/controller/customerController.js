const Customer = require("../models/Customer");

exports.createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      owner: req.user.id
    });
    res.status(201).json({ message: "Customer created successfully", customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      req.body,
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer updated successfully", customer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!customer) return res.status(404).json({ message: "Customer not found" });
    res.json({ message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
