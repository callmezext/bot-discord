// File: utils.js
function parseStats(statString) {
  if (!statString) return 0;
  if (typeof statString === "number") return statString;

  const lower = statString.toLowerCase();
  const num = parseFloat(lower.replace(/[^0-9.]/g, ""));

  if (lower.endsWith("k")) {
    return Math.floor(num * 1000);
  }
  if (lower.endsWith("m")) {
    return Math.floor(num * 1000000);
  }
  return Math.floor(num);
}

module.exports = { parseStats };
