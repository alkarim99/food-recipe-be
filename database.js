require("dotenv").config();
const postgres = require("postgres");

const sql = postgres({
  host: process.env.HOST,
  port: process.env.PORT,
  database: process.env.DATABASE,
  username: process.env.USERNAME_DB,
  password: process.env.PASSWORD,
}); // will use psql environment variables

module.exports = sql;
