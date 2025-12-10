import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token) {
    console.error("No token provided in request");
    return res.status(401).json({ message: "Access denied. No token provided" });
  }

  try {
    // Use JWT_SECRET from environment, fallback to default for backward compatibility
    const jwtSecret = process.env.JWT_SECRET || "secretstring1234";
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    console.log("Token verified - req.user._id:", req.user._id);
    next(); //req.user has stores token's _id of user, call getuserbyME next in userController
  } catch (ex) {
    console.error("Token verification error:", ex);
    res.status(400).send("Invalid token.");
  }
}

export default auth;