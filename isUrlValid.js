const URL = require('url').URL

const isUrlValid = (s) => {
  try {
    URL(s)
    return true
  } catch (err) {
    return false
  }
}

module.exports = isUrlValid
