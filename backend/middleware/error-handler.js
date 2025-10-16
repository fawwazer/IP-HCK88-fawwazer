module.exports = function errorHandler(error, req, res, next) {
  console.log(error, "<error handler");
  if (
    error.name === "SequelizeValidationError" ||
    error.name === "SequelizeUniqueConstraintError"
  ) {
    res.status(400).json({ message: error.errors[0].message });
  } else if (error.name === "BadRequest") {
    res.status(400).json({ message: error.message });
  } else if (
    error.name === "Unauthorized" ||
    error.name === "JsonWebTokenError"
  ) {
    res.status(401).json({ message: error.message });
  } else if (error.name === "forbidden") {
    res.status(403).json({ message: error.message });
  } else if (error.name === `NotFound`) {
    res.status(404).json({ message: error.message });
  } else {
    res.status(500).json({ message: "Internal server error" });
  }
};
