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
 * Creates a Promise that will be rejected if it's not resolved in a certain
 * amount of time. The timeout is immediately canceled when the Promise is
 * settled, then long timeouts won't keep the script running unnecessarily.
 * 
 * Also lets create individual timeouts for each subsequent calls to the "then"
 * method of the Promise object, and implements every static method of the
 * Promise class as well ("all", "race", etc.) to work with timeouts.
 * 
 * This alternative to create Promises with timeouts doesn't use the commonly
 * seen implementations using Promise.race() to cancel the unresolved Promise,
 * skipping this step and hopefuly making the script more efficient.
 * 
 * 
 * @param {Function} executor the asyncronous code to be performed
 * @param {integer} milliseconds time to wait before rejecting the Promise
 * 
 * @example
 *
 *    const BriefPromise = require("path/to/brief-promise.js");
 *    
 *    const executor = (resolve, reject) => {
 *      // some task to be executed asynchronously resulting in a call to "resolve" or "reject"
 *      setTimeout(resolve, 2000, 'value encountered after 2 seconds');
 *    };
 *    
 *    new BriefPromise(executor)
 *      .timeout(5000) // five seconds to complete the executor (a call to "resolve" or "reject")
 *      .then(
 *        (value) => {
 *          console.log(`Successful Response:\n  ${value}`);
 *          // do another task and return some new value
 *          const newValue = new Promise(
 *            (resolve) => {
 *              setTimeout(resolve, 2500, 'some new value after 2.5 seconds');
 *            }
 *          );
 *          return newValue;
 *        },
 *        null, // second parameter of "then" is reserved by the Promise class (a shortcut to "catch", if not null)
 *        3000  // sets a timeout of 3 seconds to complete this "then" statement
 *      )
 *      .then(
 *        (value) => {
 *          console.log(`New Successful Response:\n  ${value}`);
 *        }
 *      )
 *      .catch(
 *        (error) => {
 *          // checking if it's a timeout error
 *          if (error instanceof BriefPromise.TimeoutError) {
 *            console.error(`The Promise timed out before finishing the task. Details:\n  ${error}`);
 *          } else {
 *            console.error(error); // other errors
 *          }
 *        }
 *      );
 * 
 * 
 * @author Carlos Henrique Reche
 * 
 */
class BriefPromise extends Promise {

  static TimeoutError = class PromiseTimeoutError extends Error {
    constructor(message) {
      super(typeof message !== 'number' ? message :
            `Promise timed out after ${message} milliseconds.`);
    }
  };


  constructor(executor, milliseconds = null) {
    let cancel;
    super(
      (resolve, reject) => {
        cancel = reject;
        new Promise(executor)
          .then(
            (onFulfilled) => { resolve(onFulfilled); },
            (onRejected) => { reject(onRejected); }
          )
          .finally(
            () => {
              if (this.timeoutId) {
                clearTimeout(this.timeoutId);
              }
            }
          );
      }
    );
    
    Object.defineProperty(this, 'timeoutId', {enumerable: false, writable: true, value: null});
    Object.defineProperty(this, 'cancel', {enumerable: false, value: cancel});
    this.timeout(milliseconds);
  }

  /**
   * Sets a timeout to resolve the Promise object. If the parameter is null, a
   * timeout set earlier will be cancelled.
   * 
   * @param {Number | null} milliseconds 
   * @returns {BriefPromise}
   */
  timeout(milliseconds) {
    if (typeof milliseconds === 'number') {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(
        () => { this.cancel(new BriefPromise.TimeoutError(milliseconds)); },
        milliseconds
      );
    } else if ((milliseconds === null) && this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    return this;
  }

  /**
   * Overwrites the Promise object "then" method to include an optional
   * timeout as a third parameter.
   * 
   * @param {Function} onFulfilled 
   * @param {Function | null} onRejected 
   * @param {Number | null} milliseconds 
   * @returns {BriefPromise}
   */
  then(onFulfilled, onRejected = null, milliseconds = null) {
    if (typeof milliseconds !== 'number') {
      return super.then(onFulfilled, onRejected);
    }
    return super.then(
      (value) => {
        const executor = (resolve, reject) => {
          resolve(onFulfilled(value));
        };
        return new BriefPromise(executor, milliseconds);
      },
      !onRejected ? null : (reason) => {
        const executor = (resolve, reject) => {
          reject(onRejected(reason));
        };
        return new BriefPromise(executor, milliseconds);
      }
    );
  }

  /**
   * Similar to Promise.all() with a timeout.
   * 
   * @param {Array} promises 
   * @param {Number} milliseconds 
   * @returns {BriefPromise}
   */
  static all = (promises, milliseconds) => {
    return BriefPromise.wrap(Promise.all(promises), milliseconds);
  };

  /**
   * Similar to Promise.allSettled() with a timeout.
   * 
   * @param {Array} promises 
   * @param {Number} milliseconds 
   * @returns {BriefPromise}
   */
  static allSettled = (promises, milliseconds) => {
    return BriefPromise.wrap(Promise.allSettled(promises), milliseconds);
  };

  /**
   * Similar to Promise.any() with a timeout.
   * 
   * @param {Array} promises 
   * @param {Number} milliseconds 
   * @returns {BriefPromise}
   */
  static any = (promises, milliseconds) => {
    let any;
    if (typeof Promise.any === 'function') {
      any = Promise.any;
    } else {
      any = (promises) => {
        return new Promise((resolve, reject) => {
          let rejectCounter = promises.length;
          promises.forEach((p) => {
            p.then(
              (value) => {
                resolve(value);
              },
              () => {
                if (--rejectCounter === 0) {
                  reject(new Error('No promises were fulfilled.'));
                }
              }
            );
          });
        });
      }
    }
    return BriefPromise.wrap(any(promises), milliseconds);
  };

  /**
   * Similar to Promise.race() with a timeout.
   * 
   * @param {Array} promises 
   * @param {Number} milliseconds 
   * @returns {BriefPromise}
   */
  static race = async (promises, milliseconds) => {
    return BriefPromise.wrap(Promise.race(promises), milliseconds);
  };

  /**
   * Wraps a value of any type into a BriefPromise object. It's useful if you
   * need to add a timeout to an existing promise or to a function that will
   * return some value.
   * 
   * @param {any} object 
   * @param {Number} milliseconds 
   * @returns {BriefPromise}
   */
  static wrap(object, milliseconds) {
    const executor = (resolve, reject) => {
      if (object instanceof Promise) {
        object.then(
          (value) => { resolve(value); },
          (reason) => { reject(reason); }
        );
      } else if (typeof object === 'function') {
        try {
          resolve(object());
        } catch (error) {
          reject(error);
        }
      } else if (object instanceof Error) {
        reject(object);
      } else {
        resolve(object);
      }
    };
    return new BriefPromise(executor, milliseconds);
  }
}

// used by NodeJS
if ((typeof module !== 'undefined') && module && module.exports) {
  module.exports = BriefPromise;
}
