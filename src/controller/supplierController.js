const Supplier = require("../models/Supplier");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// CREATE SUPPLIER
exports.createSupplier = async (req, res) => {
  try {
    const { companyName, contactPersonName, phone, address, name, email, password } = req.body;
    
    // Check if user already exists
    let existingUser = await User.findOne({ email });
    let userId;

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password || "password", 10);
      const user = new User({
        name: name || contactPersonName || companyName,
        email,
        password: hashedPassword,
        role: "Supplier",
      });
      await user.save();
      userId = user._id;
    } else {
      userId = existingUser._id;
    }

    const supplier = new Supplier({
      companyName,
      contactPersonName,
      phone,
      address,
      userId: userId,
      owner: req.user.id
    });

    await supplier.save();

    res.status(201).json({
      message: "Supplier created successfully",
      supplier,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL SUPPLIERS
exports.getSuppliers = async (req, res) => {
  const suppliers = await Supplier.find({ owner: req.user.id })
    .populate('userId', 'email')
    .collation({ locale: 'en', strength: 2 })
    .sort({ companyName: 1 });
  res.json(suppliers);
};

// GET SUPPLIER BY ID
exports.getSupplierById = async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, owner: req.user.id }).populate('userId', 'email');
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.json(supplier);
};

// UPDATE SUPPLIER
exports.updateSupplier = async (req, res) => {
  try {
    const { email, ...supplierData } = req.body;
    
    const updatedSupplier = await Supplier.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      supplierData,
      { new: true },
    );
    
    if (updatedSupplier && email) {
      await User.findByIdAndUpdate(updatedSupplier.userId, { email });
    }
    
    if (!updatedSupplier) return res.status(404).json({ message: "Supplier not found" });

    res.json(updatedSupplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE SUPPLIER
exports.deleteSupplier = async (req, res) => {
  const result = await Supplier.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!result) return res.status(404).json({ message: "Supplier not found" });
  res.json({ message: "Supplier deleted" });
};

// Option 4: Supplier Performance Analytics
exports.getSupplierPerformance = async (req, res) => {
  try {
    const PurchaseOrder = require("../models/PurchaseOrder");
    const suppliers = await Supplier.find({ owner: req.user.id }).populate('userId', 'name email');
    
    const performanceData = [];

    for (const supplier of suppliers) {
      // Find all completed (approved/delivered) POs for this supplier
      const pos = await PurchaseOrder.find({ 
        owner: req.user.id,
        supplierId: supplier.userId?._id,
        status: "approved" 
      });

      let avgLeadTime = 0;
      let onTimeDeliveryRate = 0;
      let totalOrders = pos.length;

      if (totalOrders > 0) {
        let totalDays = 0;
        let onTimeCount = 0;

        pos.forEach(po => {
          // Calculate lead time: created to approved (or deliveryDate if available)
          const start = new Date(po.createdAt);
          const end = po.deliveryDate ? new Date(po.deliveryDate) : new Date(po.updatedAt);
          const diffDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
          totalDays += diffDays;

          // On-time check
          if (po.expectedDeliveryDate && end <= po.expectedDeliveryDate) {
            onTimeCount++;
          } else if (!po.expectedDeliveryDate) {
            // If no target, assume < 7 days is on-time
            if (diffDays <= 7) onTimeCount++;
          }
        });

        avgLeadTime = (totalDays / totalOrders).toFixed(1);
        onTimeDeliveryRate = ((onTimeCount / totalOrders) * 100).toFixed(0);
      }

      // Determine Score
      let score = "C";
      if (onTimeDeliveryRate >= 90 && avgLeadTime <= 5) score = "A+";
      else if (onTimeDeliveryRate >= 80) score = "A";
      else if (onTimeDeliveryRate >= 60) score = "B";

      performanceData.push({
        _id: supplier._id,
        companyName: supplier.companyName,
        totalOrders,
        avgLeadTime: `${avgLeadTime} days`,
        onTimeRate: `${onTimeDeliveryRate}%`,
        score
      });
    }

    res.json(performanceData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
