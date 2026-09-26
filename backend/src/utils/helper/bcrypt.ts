import bcrypt from "bcrypt";

// bcrypt cost doubles per step: 12 is ~250ms per hash, the usual production value.
// (It was 19, i.e. ~37s per login — longer than any proxy or browser will wait.)
const SALT_WORK_FACTOR = 12;

export const hashString = (value: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
      if (err) return reject(err);

      // hash the password using our new salt
      bcrypt.hash(value, salt, function (err, hash) {
        if (err) return reject(err);

        return resolve(hash);
      });
    });
  });
};

export const comparehash = (
  value: string,
  hashedValue = ""
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    bcrypt.compare(value, hashedValue, function (err, isMatch) {
      if (err) return reject(false);
      return resolve(isMatch);
    });
  });
};
