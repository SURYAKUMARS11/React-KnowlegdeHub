function requireFields(payload, fields) {
  const missing = fields.filter((field) => !payload || payload[field] == null);
  return missing;
}

function normalizeTags(tags) {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

module.exports = {
  requireFields,
  normalizeTags,
};
