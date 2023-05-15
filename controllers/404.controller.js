const endPointInvalid = (req, res) => {
  res.status(404).send({
    status: false,
    message: 'Not Found'
  })
}

module.exports = endPointInvalid
