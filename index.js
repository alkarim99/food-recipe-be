require("dotenv").config()
const express = require("express")
const app = express()
const bodyParser = require("body-parser")

const usersRoutes = require("./routes/users.routes")
const recipesRoutes = require("./routes/recipes.routes")
const authRoutes = require("./routes/auth.routes")
const invalidRoutes = require("./routes/404.routes")

const helmet = require("helmet")
const xss = require("xss-clean")
const cors = require("cors")
const fileUpload = require("express-fileupload")

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(helmet())
app.use(xss())

// const corsOptions = {
//   origin: "https://google.com",
//   optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
// app.use(cors(corsOptions))
// app.use(cors());

app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
)

// Routes
app.use(usersRoutes)
app.use(recipesRoutes)
app.use(authRoutes)

// Home
app.get("/", (req, res) => {
  res.send("API For Food Recipe")
})

// Other routes
app.use(invalidRoutes)

app.listen(3000, () => {
  console.log("App running in port 3000")
})
