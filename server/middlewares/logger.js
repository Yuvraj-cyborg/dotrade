function logger(req, res, next) {
  console.log(
    `${new Date().toISOString()} ${req.url} ${req.method} ${JSON.stringify(req.body)}`,
  );
  next();
}

export default logger;
