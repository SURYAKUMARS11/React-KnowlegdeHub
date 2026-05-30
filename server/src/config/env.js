function getEnv(key, fallback) {
  if (process.env[key] != null) {
    return process.env[key];
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing environment variable: ${key}`);
}

module.exports = {
  getEnv,
};
