var express = require("express");
var router = express.Router();
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = process.env.mongodbURL || "mongodb://localhost:27017/";
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

//Login
router.post("/", async function (req, res, next) {
  
  let client;
  try {
    client = await mongoClient.connect(url);
    let db = client.db("zenClass");
    let { email, pass } = req.body;
    let existing = await db.collection("forum-users").findOne({ email: email,});

    if (!existing) {
      res.json({ status: 404, message: "No such user exists"});
    } else {
      let comparedResult = await bcryptjs.compare(pass, existing.pass);

      if (!comparedResult) {
        res.json({
          status: 401,
          message: "Password did not match",
        });
      } else {
        let token = jwt.sign({ id: email }, "secret key");
        res.json({
          status: 200,
          message: "Valid User",
          token,
          user : existing.name
        });
      }
      client.close();
    }
  } catch (error) {
    client.close();
    res.json({
      status: 404,
      message: "Something went wrong in server",
    });
  }
});

//SignUp
router.post("/newUser", async function (req, res, next) {
  let client;
  try {
    client = await mongoClient.connect(url);
    let db = client.db("zenClass");
    let user = { ...req.body };
    
    let existingUser = await db.collection("forum-users").findOne({
      $or : [
        { email: user.email },
        { name: user.uname }
      ],
    });
    
    if (existingUser) {
      let exisitingData = existingUser.email === user.email ? 'Email Id' : 'User Name';
      res.json({
        status: 404,
        message: `${exisitingData} already exists`,
      });
    } else {
      let salt = bcryptjs.genSaltSync(10);
      let hashedPassword = bcryptjs.hashSync(user.pass, salt)
      user.pass = hashedPassword;
            
      await db.collection("forum-users").insertOne({
        name : user.uname,
        email : user.email,
        pass : user.pass,
        questions : []
      });
      
      res.json({
        status: 200,
        message: "New User Account Created"
      });
    }
    client.close();
  } catch (error) {
    console.log(error);
    client.close();
    res.json({
      status: 404,
      message: "Something went wrong in server",
    });
  }
});
module.exports = router;
