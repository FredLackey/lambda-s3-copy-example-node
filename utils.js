module.exports.isObject = (value, isEmptyOkay = false) => (
    typeof value === 'object' && 
    value !== null && 
    !(value instanceof Array) &&
    (isEmptyOkay || Object.keys(value).length > 0));

module.exports.isNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

module.exports.toBlockDate = (value, deliminator = '', includeMilliseconds = true) => {
  const dateString = [
     `${value.getFullYear()}`,
     `${value.getMonth() + 1}`.padStart(2, '0'),
     `${value.getDate()}`.padStart(2, '0'),
     `${value.getHours()}`.padStart(2, '0'),
     `${value.getMinutes()}`.padStart(2, '0'),
     `${value.getSeconds()}`.padStart(2, '0'),
  ].join(deliminator);
  if (!includeMilliseconds) { return dateString; }
  return [dateString, `${value.getMilliseconds()}`.padStart(3, '0')].join(deliminator);
};

module.exports.isError = value => (value && value instanceof Error);
