const express = require('express')
const app = express()
const fs = require("fs")
const Joi = require("joi");
const { ObjectId } = require('mongodb');
const port = 3000
const { dbUrl, dbPsw, dbParm } = require("./config.json")

var MongoClient = require('mongodb').MongoClient;
let DB;
MongoClient.connect(dbUrl + dbPsw + dbParm, function (err, db) {
  if (err) throw err;
  DB = db
  console.log("Connected!");
});

app.use(express.json({ limit: '10MB' }));
app.use("/static", express.static("static"));

//načtení templatu
const template = require("./template/template.html")
function render(o) {
  let arr = o.ingredience
  o.ingredience = ""
  for (let i = 0; i < arr.length; i++) {
    o.ingredience += "<li>" + arr[i] + "</li>";
  }
  o.htmlImages = "";
  for (let i = 0; i < o.images.length; i++) {
    o.htmlImages += `<a href="viz js" data-lightbox="image-1" data-title="${o.nazev}" >
    <img src="data:image/jpg;base64,${o.images[i]}" alt="${o.nazev}" />
  </a>`

  }
  return template(o)
}
//test
app.get("/", (req, res) => {
  //test obejct
  let data = {
    nazev: "Hlavní název       +ěščřřžžýýýáíé=",
    ingredience: ["Maso 0,2kg", "vejce 6x", "mléko 0,5l"],
    postup: "<p>Lorem ipsum <b>dolor</b> sit amet, consectetuer adipiscing elit. Morbi imperdiet, mauris ac auctor dictum, nisl ligula egestas nulla, et sollicitudin sem purus in lacus. Ut tempus purus at lorem. Duis ante orci, molestie vitae vehicula venenatis, tincidunt ac pede. Etiam ligula pede, sagittis quis, interdum ultricies, scelerisque eu. Proin in tellus sit amet nibh dignissim sagittis. Integer in sapien. Quisque tincidunt scelerisque libero. Nam quis nulla. Phasellus enim erat, vestibulum vel, aliquam a, posuere eu, velit. Donec quis nibh at felis congue commodo. Cras elementum. Mauris metus.</p>"
  }
  res.send(render(data))
})
//http://localhost:3000/shared?id=id&json=true|false
//http://localhost:3000/shared?param1=value1&param2=value2

app.get('/shared', (req, res) => {
  // v promene req.query.param1 je "value1"
  DB.db("recepty").collection("shared").findOne({ _id: ObjectId(req.query.id) }, { projection: { _id: 0 } }, (dberr, dbres) => {
    if (dberr) {
      res.status(500).send()
      throw err;
      return;
    }
    if (req.query.json == "true") {
      res.send(JSON.stringify(dbres))
      return;
    }

    res.send(render(dbres))
  })
});


app.post("/share", (req, res) => {
  let reqOut = req.body;
  console.log("share...");
  const { error } = validateRecept(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    console.log("validate err");
    console.log(error.details);
  } else {
    const recept = req.body;
    DB.db("recepty").collection("shared").insertOne(recept, function (dberr, dbres) {
      if (dberr) {
        res.status(500).send()
        throw dberr;
        return;
      }
      console.log("Inserted:");
      console.log(recept);
      res.send(dbres.insertedId)
    });
  }
})

function validateRecept(r) {
  const schema = Joi.object({
    nazev: Joi.string().min(3).max(100).required(),
    ingredience: Joi.array().min(1).required().items(Joi.string()),
    postup: Joi.string().required(),
    images: Joi.array().items(Joi.string())
  });
  return schema.validate(r);
}

app.listen(port, () => {
  console.log(`Recepty server listening on port ${port}`)
})

//https://mkyong.com/webservices/jax-rs/restfull-java-client-with-java-net-url/