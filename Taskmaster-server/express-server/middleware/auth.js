import jwt from "jsonwebtoken";

function auth(req, res, next) {
  const token = req.header("x-auth-token");
  if (!token)
    return res.status(401).json({ message: "Access denied. No token provided" });

  try {
    req.user = jwt.verify(token, "secretstring1234");
    next(); //req.user has stores token's _id of user, call getuserbyME next in userController
  } catch (ex) {
    res.status(400).send("Invalid token.");
  }
}

export default auth;