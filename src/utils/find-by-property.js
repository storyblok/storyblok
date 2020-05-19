/**
 * @method findByProperty
 * @param  {Array<Object>} collection
 * @param  {String}        property
 * @param  {String}        value
 * @return {Object}
 */
const findByProperty = (collection, property, value) => {
  return collection.filter(item => item[property] === value)[0] || {}
}

module.exports = findByProperty
