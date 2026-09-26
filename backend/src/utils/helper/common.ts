export const pick = <T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Partial<T> => {
  return keys.reduce((obj: Partial<T>, key: K) => {
    if (object && Object.prototype.hasOwnProperty.call(object, key)) {
      obj[key] = object[key];
    }
    return obj;
  }, {});
};

export const capitalizeFirstLetter = (value: string): string => {
  return value[0].toUpperCase() + value.slice(1);
};

export const capitalizeFirstLetters = (str: string) => {
  return str.toLowerCase().replace(/\b[a-z]/g, function (letter) {
    return letter.toUpperCase();
  });
};
