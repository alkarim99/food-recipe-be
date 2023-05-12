const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const usersRoutes = require('./routes/users.routes')
const recipesRoutes = require('./routes/recipes.routes')

const endPointInvalid = require('./endPointInvalid')

const helmet = require('helmet')
const xss = require('xss-clean')
const cors = require('cors')

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(helmet())
app.use(xss())

const corsOptions = {
  origin: 'https://google.com',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors(corsOptions))
// app.use(cors());

// Users
app.use(usersRoutes)

// Recipes
app.use(recipesRoutes)

app.get('/', (req, res) => {
  res.send('API For Food Recipe')
})

app.get('*', endPointInvalid)
app.post('*', endPointInvalid)
app.patch('*', endPointInvalid)
app.delete('*', endPointInvalid)

app.listen(3000, () => {
  console.log('App running in port 3000')
})
