import BriefPromise from './brief-promise.mjs';


//-----  Testing BriefPromise object  ----------------------------------------//
/**/

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



//-----  Testing static methods  ---------------------------------------------//
/** /

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
        console.error(`Timed out error: ${e.message}`);
      } else {
        console.error(`Failed: ${e}`);
      }
    }
  );

/**/
