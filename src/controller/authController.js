const auth = require("../middleware/auth");
const role = require("../middleware/role");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }
    user = new User({ name, email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
        { expiresIn: process.env.Jwt_EXPIRATION },
        (err, token) => {
            if (err) throw err;
            res.json({ 
              token,
              user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await
        User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }   
    const payload = {
        user: {
            id: user.id,
            role: user.role,
        },
    };
    jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.Jwt_EXPIRATION },
        (err, token) => {
            if (err) throw err;

            // Log Login Action
            const { logAction } = require("../utils/auditLogger");
            logAction(user.id, "LOGIN", `User ${user.email} logged in successfully.`);

            res.json({ 
              token,
              user: { id: user.id, name: user.name, email: user.email, role: user.role }
            });
        }
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


