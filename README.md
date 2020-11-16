# Class BriefPromise
Creates a Promise that will be rejected if it's not resolved in a certain amount of time. The timeout is immediately canceled when the Promise is settled, then long timeouts won't keep the script running unnecessarily.

Also lets create individual timeouts for each subsequent calls to the "then" method of the Promise object, and implements every static method of the Promise class as well (all, race, etc.) to work with timeouts.

This alternative to create Promises with timeouts doesn't use the commonly seen implementations using Promise.race() to cancel the unresolved Promise, skipping this step and hopefuly making the script more efficient.
