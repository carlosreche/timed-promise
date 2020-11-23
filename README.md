# Class BriefPromise
Creates a Promise that will be rejected if it's not resolved in a certain amount of time. The timeout is immediately canceled when the Promise is settled, then long timeouts won't keep the script running unnecessarily.

Also lets create individual timeouts for each subsequent calls to **_then_** method of the **Promise object**, and implements the static methods of the **Promise class** as well (**_all_**, **_allSettled_**, **_any_** and **_race_**) to work with timeouts.

This alternative to create Promises with timeouts doesn't use the commonly seen implementations using Promise.race() to cancel the unresolved Promise, skipping this step and hopefuly making the script more efficient.

## Examples

```js

import BriefPromise from './brief-promise.mjs';


const executor = (resolve, reject) => {
  // Here goes the task to be executed asynchronously resulting
  // in a call to "resolve" or "reject" (like a regular Promise).

  // In this case, the Promise will be resolved after 3 seconds
  // returning the string below as the value encountered
  setTimeout(resolve, 3000, 'value encountered after 3 seconds');
};


new BriefPromise(executor)
  .timeout(2000) // sets 2 seconds to complete the executor
                 // (a call to "resolve" or "reject")
  .then(
    (value) => {
      console.log(`Successful Response:\n  ${value}`);

      // do another task and return some new value after 2.5 seconds
      const newValue = new Promise((resolve) => {
        setTimeout(resolve, 2500, 'some new value after 2.5 seconds');
      });
      return newValue;
    },

    null, // the second parameter of "then" is reserved by the Promise standard
          // (a shortcut to "catch", if not null)

    3000  // the third parameter sets a timeout to complete this "then" statement
          // (in this case, 3 seconds)
  )
  .then(
    (value) => {
      console.log(`New Successful Response:\n  ${value}`);
    }
  )
  .catch(
    (error) => {
      // checking if it's a timeout error
      if (error instanceof BriefPromise.TimeoutError) {
        console.error(`The Promise timed out before finishing the task. Details:\n  ${error}`);
      } else {
        console.error(error); // other errors
      }
    }
  );
```


Testing the static methods:

```js
import BriefPromise from './brief-promise.mjs';


let promises = [
  new Promise(
    (resolve, reject) => setTimeout(resolve, 3000, 'resolved after 3 seconds')
  ),
  new Promise(
    (resolve, reject) => setTimeout(reject, 2500, 'rejected after 2.5 seconds')
  ),
  new Promise(
    (resolve, reject) => setTimeout(resolve, 2000, 'resolved after 2 seconds')
  )
];

// notice the difference by changing the method below
// between "allSettled", "all", "any" and "race"
BriefPromise.any(promises, 5000)
  .then(
    (value) => {
      console.log(`Successful Response:`);
      console.log(value);
    }
  )
  .catch(
    (e) => {
      if (e instanceof BriefPromise.TimeoutError) {
        console.log(`Timed out error: ${e.message}`);
      } else {
        console.log(`Failed: ${e}`);
      }
    }
  );

```
