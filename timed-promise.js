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
 * This alternative to create Promises with timeouts doesn't use the typical
 * implementations using Promise.race() to ignore the unresolved Promise,
 * skipping this step and hopefuly making the script more efficient.
 * 
 * @author Carlos Henrique Reche
 * @url https://github.com/carlosreche/brief-promise
 * 
 * 
 * @param {function} executor the asyncronous code to be performed
 * @param {integer} milliseconds time to wait before rejecting the Promise
 */
export default class TimedPromise extends Promise {

  static TimeoutError = class PromiseTimeoutError extends Error {
    constructor(error) {
      super((typeof error === 'number') ?
        `Promise timed out after ${error} milliseconds.` : error);
    }
  };

  constructor(executor, milliseconds = null) {
    let cancel;
    let executorWrap = async (resolve, reject) => {
      cancel = reject;
      try {
        let result = await executor();
        if (this.timeoutId) {
          clearTimeout(this.timeoutId);
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    super(executorWrap);
    Object.defineProperties(this, {
      timeoutId: {value: null, enumerable: false, writable: true},
      cancel: {enumerable: false, value: cancel}
    });
    this.timeout(milliseconds);
  }

  /**
   * Sets a timeout to resolve the Promise object. If the parameter is null, a
   * timeout set earlier will be cancelled.
   * 
   * @param {number|null} milliseconds 
   * @returns {TimedPromise}
   */
  timeout(milliseconds) {
    if (typeof milliseconds === 'number') {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      let onTimeout = () => {
        this.cancel(new TimedPromise.TimeoutError(milliseconds));
      }
      this.timeoutId = setTimeout(onTimeout, milliseconds);
    } else if (((milliseconds === null) || (milliseconds === Infinity)) &&
                this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    return this;
  }

  /**
   * Overwrites the Promise object "then" method to include an optional
   * timeout as a third parameter.
   * 
   * @param {function} onfulfilled 
   * @param {function|null} onrejected 
   * @param {number|null} milliseconds 
   * @returns {timedpromise}
   */
  async then(onFulfilled, onRejected = null, milliseconds = null) {
    if (typeof milliseconds !== 'number') {
      return super.then(onFulfilled, onRejected);
    }
    let thenOnFulfilled = (value) => {
      let executor = (resolve, reject) => {
        resolve(onFulfilled(value));
      };
      return new TimedPromise(executor, milliseconds);
    };
    let thenOnRejected = !onRejected ? null : (reason) => {
      let executor = (resolve, reject) => {
        reject(onRejected(reason));
      };
      return new TimedPromise(executor, milliseconds);
    };
    return super.then(thenOnFulfilled, thenOnRejected);
  }

  /**
   * Similar to Promise.all() with a timeout.
   * 
   * @param {array} promises 
   * @param {number} milliseconds 
   * @returns {TimedPromise}
   */
  static async all(promises, milliseconds) {
    return TimedPromise.wrap(Promise.all(promises), milliseconds);
  }

  /**
   * Similar to Promise.allSettled() with a timeout.
   * 
   * @param {array} promises 
   * @param {number} milliseconds 
   * @returns {TimedPromise}
   */
  static async allSettled(promises, milliseconds) {
    return TimedPromise.wrap(Promise.allSettled(promises), milliseconds);
  }

  /**
   * Similar to Promise.any() with a timeout.
   * 
   * @param {array} promises 
   * @param {number} milliseconds 
   * @returns {TimedPromise}
   */
  static async any(promises, milliseconds) {
    let any;
    if (typeof Promise.any === 'function') {
      any = Promise.any.bind(Promise);
    } else {
      any = (promises) => {
        let executor = (resolve, reject) => {
          let rejectCounter = promises.length;
          for (let p of promises) {
            let thenOnFulfilled = (value) => { resolve(value); };
            let thenOnRejected = () => {
              if (--rejectCounter === 0) {
                reject(new Error('No promises were fulfilled.'));
              }
            };
            p.then(thenOnFulfilled, thenOnRejected);
          }
        };
        return new Promise(executor);
      };
    }
    return TimedPromise.wrap(any(promises), milliseconds);
  }

  /**
   * Similar to Promise.race() with a timeout.
   * 
   * @param {array} promises 
   * @param {number} milliseconds 
   * @returns {TimedPromise}
   */
  static async race(promises, milliseconds) {
    return TimedPromise.wrap(Promise.race(promises), milliseconds);
  }

  /**
   * Wraps a value of any type into a BriefPromise object. It's useful if you
   * need to add a timeout to an existing promise or to a function that will
   * return some value.
   * 
   * @param {any} object 
   * @param {number} milliseconds 
   * @returns {TimedPromise}
   */
  static async wrap(object, milliseconds) {
    let executor = (resolve, reject) => {
      if (object instanceof Promise) {
        object.then(
          (value) => { resolve(value); },
          (reason) => { reject(reason); }
        )
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
    return new TimedPromise(executor, milliseconds);
  }
}
