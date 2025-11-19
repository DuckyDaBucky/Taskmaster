import User from "../models/userModel.js";
import bcrypt from "bcrypt";

//Use for login portal - accepts username OR email
const authUser = async (req, res) => {
  try {
    const { email, userName, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    // Try to find user by email OR username
    let user = null;
    if (email) {
      user = await User.findOne({ email });
    } else if (userName) {
      user = await User.findOne({ userName });
    } else {
      return res.status(400).json({ message: "Email or username is required" });
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid email or username" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = user.generateAuthToken();
    res.send(token);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};

export default authUser;
