# atlas-throttled-queue

Async job queue that limits the rate of job execution.

[![Travis](https://img.shields.io/travis/atlassubbed/atlas-throttled-queue.svg)](https://travis-ci.org/atlassubbed/atlas-throttled-queue)

---

## install

```
npm install --save atlas-throttled-queue
```

## why

I was writing a totally legal web-scraper and I didn't want to overburden my sources with a bunch of spam. This package exports a simple queue which takes a period, &tau;, and lets you run arbitrary jobs at a rate of 1/&tau;.

## examples

#### web scraper

This example is simplified for the sake of brevity. Let's say we have a service which takes a document, gets the keywords, and then performs a Bing search of all the keywords, obtaining the top link for each keyword. We might want to do this if we want to "learn more" about the document -- maybe we recursively scrape the links, feed the new set of documents to a machine learning algorithm so it can "learn more" about the original document, then look up links for those documents, etc.

For this example, let's assume we have the following functions: 

  1. `getBingResults`: looks up a phrase on bing, parses the output, and returns a list of links.
  2. `getKeywords`: Filters out the stop-words from a document, returning an *set* of important words.
  3. `upsertLink`: Upserts an obtained link to our database.

```javascript
const { readFileSync } = require("fs");
const ThrottledQueue = require("atlas-throttled-queue");
const getKeywords = require("./filter-stop-words");
const getBingResults = require("./bing-search-client");
const upsertLink = require("./upsert-link")

// make a queue
const tau = 500;
const queue = new ThrottledQueue(tau);

// get our keywords
const doc = readFileSync("./document.txt");
const keywords = getKeywords(doc);

// run our throttled scraper, keywords.length === 20000
for (let i = keywords.length; i--;){
  queue.push(() => {
    getBingResults(keywords[i], links => {
      const topLink = links[0];
      upsertLink(topLink, () => {
        // no-op, don't care about result of write
      })
    })
  })
}
```

In the example above, we have 20,000 search jobs, but they are run every &tau; milliseconds. This helps keep us under the radar and prevents us from overloading our system. Note that the throttler does not enforce any rules regarding concurrency: if each search job takes one second, then ~2 search jobs will be running at any given time. You can place `queue.push` calls inside of jobs for a [concurrent queue](https://github.com/atlassubbed/atlas-concurrent-queue#readme) to limit the concurrency of your jobs, in addition to limiting the rate at which they are fired.

## todo

#### dynamic &tau;

It might be interesting to implement a dynamic &tau; that can react to changes in API allowance. For example, we might want to slow down our jobs if we notice rate limiting headers getting close their limit. As of right now, I don't need the feature, but implementing it would not be difficult.

## caveats

#### capturing errors and data

There's no way to capture errors or results, this queue is only for controlling flow. If you need to capture errors or results, do it at the scope you're writing your jobs in.

#### `done` callback

Unlike [atlas-concurrent-queue](https://github.com/atlassubbed/atlas-concurrent-queue#readme), there's no callback we can call when "all of our jobs are done". I don't think it makes a ton of sense to have a callback for this, since there isn't a well-defined moment when our jobs finish:

  1. Do we capture the end of each job, calling `done` when all jobs have returned? 
  2. Do we call `done` when the queue has been exausted and all jobs have been executed? 

It doesn't seem very well-defined, but I could be wrong and I'd be open to ideas.
