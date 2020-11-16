const BriefPromise = require("./brief-promise.js");


//-----  Testing BriefPromise object  ----------------------------------------//
/**/

const executor = (resolve, reject) => {
  // some task to be executed asynchronously resulting in a call to "resolve" or "reject"
  setTimeout(resolve, 2000, 'value encountered after 2 seconds');
};

new BriefPromise(executor)
  .timeout(5000) // five seconds to complete the executor (a call to "resolve" or "reject")
  .then(
    (value) => {
      console.log(`Successful Response:\n  ${value}`);
      // do another task and return some new value
      const newValue = new Promise(
        (resolve) => {
          setTimeout(resolve, 2500, 'some new value after 2.5 seconds');
        }
      );
      return newValue;
    },
    null, // second parameter of "then" is reserved by the Promise class (a shortcut to "catch", if not null)
    3000  // sets a timeout of 3 seconds to complete this "then" statement
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

// change the method below between "allSettled", "all", "any" and "race" to spot the difference
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

/**/
