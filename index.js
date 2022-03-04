const express = require('express')
const app = express()
const port = 3000

const db = require('./db')
db.start();

//app.use(express.json());
app.use(express.static("public"));

app.get('/:id', async(req, res) => {
  const result = await db.pool.query("SELECT * FROM `recepty_share` WHERE `ID` = 1"); //parseInt(req.params.id)
  res.send(result);
})

app.post("/share", (req, res) => {

})

app.listen(port, () => {
  console.log(`Recepty server listening on port ${port}`)
})

//https://mkyong.com/webservices/jax-rs/restfull-java-client-with-java-net-url/