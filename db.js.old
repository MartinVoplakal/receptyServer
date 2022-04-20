// Use the MariaDB Node.js Connector
var mariadb = require('mariadb');
 
// Create a connection pool
var pool = 
  mariadb.createPool({
    host: "m-test.tk", 
    user: "recepty_server", 
    password: "ReceptyVoplakM",
    database: "Recepty"
  });
 
// Expose a method to establish connection with MariaDB SkySQL
module.exports = Object.freeze({
  pool: pool,
  start() {
    pool.getConnection()
    .then(conn => {
      console.log("connected to db");
    }).catch(err => {
      console.log("NOT CONNECTED TO DB");
    });
  }
});
