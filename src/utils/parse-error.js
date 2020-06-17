/**
 * @method parserError
 * @param  {Object} responseError
 * @return {Object} { message: String, error: InstanceOfError }
 */
const parserError = responseError => {
  const response = responseError.response || {}
  if (response && response.data && response.data.error) {
    return {
      status: response.status,
      statusText: response.statusText,
      message: response.data.error,
      error: responseError
    }
  }

  return {
    status: null,
    statusText: null,
    message: responseError.message,
    error: responseError
  }
}

module.exports = parserError
