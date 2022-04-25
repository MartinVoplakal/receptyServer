const express = require('express')
const app = express()
const fs = require("fs");
const { string } = require('joi');
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
  let id = "626507cb068813124abfd9f4";
  DB.db("recepty").collection("shared").findOne({ _id: ObjectId(id) }, { projection: { _id: 0 } }, (dberr, dbres) => {
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
  console.log("share...");
  const { error } = validateRecept(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    console.log(error.details);
    return;
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

//backup
app.post("/backup", (req, res) => {
  const { error } = validateBackup(req.body);
  if (error) {
    res.status(400).send(error.details[0].message);
    console.log(error.details);
    return;
  } else {
    const recept = req.body;
    // DB.db("backup").collection(recept.clientid).updateOne({ id: recept.id }, { $set: recept }, (dberr, dbres) => {
    //   if (dberr) {
    //     res.status(500).send()
    //     throw dberr;
    //   }
    //  if (dbres.modifiedCount < 1) {
    DB.db("backup").collection(recept.clientid).insertOne(recept, function (dberr, dbres) {
      if (dberr) {
        res.status(500).send()
        throw dberr;
        return;
      }
      res.send("Inserted:" + dbres.insertedId)
    });
    //   } else {
    //console.log(dbres);
    //res.send("Updated")
    //  }
    //})
    /* if (recept.serverid) {
       DB.db("backup").collection(recept.clientid + "").updateOne({ _id: ObjectId(recept.serverid) }, { $set: recept }, (dberr, dbres) => {
         if (dberr) throw err;
         res.send("OK")
       })
     }
     else*/
  }
})

app.get("/backup:get", (req, res) => {
  switch (req.params.get) {
    case "Code":
      DB.db("recepty").collection("clients").insertOne({ clientip: req.headers['x-forwarded-for'] }, function (dberr, dbres) {
        if (dberr) {
          res.status(500).send()
          throw dberr;
        }
        console.log("Inserted client: " + dbres.insertedId);
        res.send(dbres.insertedId)
      });
      break;
    case "Recept":
      const { error } = schema.validate(req.body)
      if (error) {
        res.status(400).send(error.details[0].message);
        console.log(error.details);
        return;
      }
      DB.db("backup").collection(req.body.clientid).findOne({ _id: ObjectId(req.query.id) }, { projection: { _id: 0 } }, (dberr, dbres) => {
        if (dberr) {
          res.status(500).send()
          throw err;
          return;
        }
        res.send(JSON.stringify(dbres))
      })
      break;
    //vrátí  [{_id: xxx}] receptů pro následný get z app
    default:
      res.status(400).send("Invalid argument");
      break;
  }
})

//smazat starou zálohu
app.post("/backup:post", (req, res) => {
  switch (req.params.post) {
    case "IDs": {
      const { error } = schema.validate(req.body)
      if (error) {
        res.status(400).send(error.details[0].message);
        console.log(error.details);
        return;
      }
      console.log(req.body.clientid);
      DB.db("backup").collection(req.body.clientid).find({}, { projection: { _id: 1 } }).toArray(function (dberr, dbres) {
        console.log("gooo");
        if (dberr) {
          res.status(500).send()
          throw err;
        }
        console.log(dbres);
        res.send(dbres)
      });
    }
      break;
    case "Reset": {
      const { error } = schema.validate(req.body)
      console.log(req.body);
      if (error) {
        res.status(400).send(error.details[0].message);
        console.log(error.details);
        return;
      }
      DB.db("backup").collection(req.body.clientid).drop(function (err, delOK) {
        //        if (err) throw err;
        if (delOK) res.send("Collection deleted");
        else res.send("Nothing to delete")
      })
    }
      break;
    default:
      res.status(400).send("Invalid argument");
      break;
  }
});


const schema = Joi.object({
  clientid: Joi.string().required()
})
const schemaRecept = Joi.object({
  nazev: Joi.string().min(3).max(100).required(),
  ingredience: Joi.array().min(1).required().items(Joi.string()),
  postup: Joi.string().required(),
  images: Joi.array().items(Joi.string())
});
const schemaBackup = Joi.object({
  nazev: Joi.string().min(3).max(100).required(),
  ingredience: Joi.array().min(0).items(Joi.required()),
  postup: Joi.string(),
  images: Joi.array().items(Joi.string()),

  clientid: Joi.string().required(),
  id: Joi.number().required()
});
function validateRecept(r) {
  return schemaRecept.validate(r);
}
function validateBackup(m) {
  return schemaBackup.validate(m);
}

app.listen(port, () => {
  console.log(`Recepty server listening on port ${port}`)
})

//https://mkyong.com/webservices/jax-rs/restfull-java-client-with-java-net-url/