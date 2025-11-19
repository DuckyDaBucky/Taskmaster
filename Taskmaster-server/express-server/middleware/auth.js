import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res.status(401).json({ message: "Access denied. No token provided" });

  try {
    // Use JWT_SECRET from environment, fallback to default for backward compatibility
    const jwtSecret = process.env.JWT_SECRET || "secretstring1234";
    req.user = jwt.verify(token, jwtSecret);
    next(); //req.user has stores token's _id of user, call getuserbyME next in userController
  } catch (ex) {
    console.error("Token verification error:", ex);
    res.status(400).send("Invalid token.");
  }
}

export default auth;