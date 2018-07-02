const { describe, it } = require("mocha")
const { expect } = require("chai")
const ThrottledQueue = require("../src/ThrottledQueue")

describe("ThrottledQueue", function(){
  it("should throw error if not given valid period (tau)", function(){
    const invalidTaus = [NaN, -1, '', /reg/, new Date(), {}, () => {}, true, undefined, null]
    invalidTaus.forEach(tau => {
      expect(() => new ThrottledQueue(tau)).to.throw("tau must be at least 0")
    })
  })
  it("should only run jobs tau milliseconds apart", function(testDone){
    const tau = 100, numJobs = 5, times = [];
    const queue = new ThrottledQueue(tau)
    for (let i = numJobs; i--;){
      queue.push(() => {
        if (times.push(Date.now()) === numJobs){
          // XXX could do N runs and look at statistics to choose better delta.
          for (let j = 0; j < numJobs - 1; j++)
            expect(times[j+1] - times[j]).to.be.closeTo(100, 6);
          testDone();
        }
      })
    }
  })
  it("should pick the next job based on the order they were received", function(testDone){
    const tau = 0, numJobs = 5, order = [];
    const expectedOrder = Array(numJobs).fill().map((e,i) => i);
    const queue = new ThrottledQueue(tau)
    for (let i = 0; i < numJobs; i++){
      queue.push(() => {
        if (order.push(i) === numJobs){
          expect(order).to.deep.equal(expectedOrder);
          testDone()
        }
      })
    }
  })
})
