module.exports = (obj) => {
  let props = [];
  let currentObj = obj;
  do {
    const l = Object.getOwnPropertyNames(currentObj)
      .concat(Object.getOwnPropertySymbols(currentObj).map((s) => s.toString()))
      .sort((a, b) => a.localeCompare(b))
      .filter(
        (p, i, arr) =>
          typeof currentObj[p] === 'function' && //only the methods
          p !== 'constructor' && //not the constructor
          (i == 0 || p !== arr[i - 1]) && //not overriding in this prototype
          props.indexOf(p) === -1, //not overridden in a child
      );
    props = props.concat(l);

    currentObj = Object.getPrototypeOf(currentObj);
  } while (currentObj && Object.getPrototypeOf(currentObj));

  return props;
};
