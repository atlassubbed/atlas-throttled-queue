const { isNonnegative } = require("./util")

module.exports = class ThrottledQueue {
  constructor(tau){
    if (!isNonnegative(tau)) 
      throw new Error("tau must be at least 0");
    let queue = [], timer, curJob;
    const next = () => {
      if (!timer && (curJob = queue.shift()))
        curJob(), timer = setTimeout(() => next(timer = null), tau);
    }
    this.push = job => queue.push(job) && next()
  }
}
