// server/middleware/admin.js
module.exports = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res
    .status(403)
    .json({ message: "Access denied. Admin role required." });
};
