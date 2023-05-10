const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const getAllUsers = require("./users/getAll");
const getByIdUser = require("./users/getById");
const createUser = require("./users/create");
const updateUser = require("./users/update");
const deleteUser = require("./users/delete");

const getAllRecipes = require("./recipes/getAll");
const getByIdRecipe = require("./recipes/getById");
const createRecipe = require("./recipes/create");
const updateRecipe = require("./recipes/update");
const deleteRecipe = require("./recipes/delete");

const endPointInvalid = require("./endPointInvalid");

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Users
app.get("/users/:id", getByIdUser);
app.get("/users", getAllUsers);
app.post("/users", createUser);
app.patch("/users/:id", updateUser);
app.delete("/users/:id", deleteUser);

// Recipes
app.get("/recipes/:id", getByIdRecipe);
app.get("/recipes", getAllRecipes);
app.post("/recipes", createRecipe);
app.patch("/recipes/:id", updateRecipe);
app.delete("/recipes/:id", deleteRecipe);

app.get("/", (req, res) => {
  res.send("API For Food Recipe");
});

app.get("*", endPointInvalid);
app.post("*", endPointInvalid);
app.patch("*", endPointInvalid);
app.delete("*", endPointInvalid);

app.listen(3000, () => {
  console.log("App running in port 3000");
});
