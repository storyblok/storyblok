/**
 * @method capitalize
 * @param  {String} word
 * @return {String}
 */
const capitalize = word => {
  const first = word.charAt(0).toUpperCase()
  const rest = word.slice(1).toLowerCase()
  return first + rest
}

module.exports = capitalize
