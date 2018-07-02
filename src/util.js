const isNonnegative = n => !isNaN(n) && typeof n === "number" && n >= 0;

module.exports = { isNonnegative }