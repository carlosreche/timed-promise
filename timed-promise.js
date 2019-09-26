/*
 * Copyright © 2019 Carlos Henrique Reche
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * Creates a Promise that will be rejected if it's not resolved in a
 * certain amount of time.
 * 
 * The timeout is immediately canceled when the Promise is settled,
 * then long timeouts won't keep the script running unnecessarily.
 * 
 * @param {Function} executor the asyncronous code to be performed
 * @param {integer} milliseconds to wait before rejecting the Promise
 * 
 * @example
 *
 *    const TimedPromise = require("path/to/timed-promise.js");
 * 
 *    const executor = (resolve, reject) => {
 *      // asyncronous code resulting in a call to "resolve" or "reject"
 *      // ...
 *      resolve("value encountered!");
 *    };
 * 
 *    new TimedPromise(executor, 5000) // five seconds to complete the task
 *      .then((result) => {
 *        console.log(`Found the value: ${result}`);
 *      })
 *      .catch((error) => {
 *        if (error.name === "PromiseTimeoutError") {
 *          console.error("The Promise timed out before finishing the task.");
 *        } else {
 *          console.error(error); // other errors
 *        }
 *      });
 * 
 * 
 * @author Carlos Henrique Reche
 * 
 */
class TimedPromise extends Promise {

  constructor(executor, milliseconds) {

    if (typeof milliseconds !== "number") {
      super(executor);

    } else {
      super((resolve, reject) => {

        const timeout = setTimeout(
          () => {
            reject(new PromiseTimeoutError(`Promise timed out after ${milliseconds} milliseconds`));
          },
          milliseconds
        );

        executor(
          (result) => {
            clearTimeout(timeout);
            resolve(result);
          },
          (error) => {
            clearTimeout(timeout);
            reject(error);
          });
      });
    }
  }
}

class PromiseTimeoutError extends Error {
  constructor(message) {
    super(message);
    this.name = "PromiseTimeoutError";
  }
}

module.exports = TimedPromise;
