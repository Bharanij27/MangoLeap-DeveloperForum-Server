var express = require('express');
// const { authenticate } = require('../common/auth');
var router = express.Router();
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = process.env.mongodbURL || "mongodb://localhost:27017/";
const jwt = require("jsonwebtoken");

/* retrive all questions. */
router.post('/', async function(req, res, next) {
  
  let client;
  let token = req.body.token;

  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        let questions = await db.collection("forum-questions").find({}).toArray();
        res.json({
          status : 200,
          questions
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});


/* post a questions. */
router.post('/new', async function(req, res, next) {
  
  let client;
  let { token, title, description, askedBy } = { ...req.body };

  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        let question = {
          title, description, askedBy, time: Date.now(), accepted : false, comments : [], answers :[]
        }

        let questions = await db.collection("forum-questions").insertOne(question);
        res.json({
          status : 200,
          questions
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});


/* get a questions. */
router.post('/:questionId', async function(req, res, next) {
  
  let client;
  let { token } = { ...req.body };
  let questionId = req.params.questionId
  
  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        console.log(typeof questionId);
        let question = await db.collection("forum-questions").findOne({ _id : mongodb.ObjectId(questionId)});
        res.json({
          status : 200,
          question
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});

/* submit an answer. */
router.put('/submitAnswer', async function(req, res, next) {
  
  let client;
  let { token, questionId, answer, by } = { ...req.body };

  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        let questions = await db.collection("forum-questions").findOneAndUpdate(
          {_id : mongodb.ObjectId(questionId)},
          {$push : 
            { answers : 
              {
                _id : by + Date.now(),
                by,
                answer,
                time : Date.now(),
                comments : []
              } 
          } }
        );
        res.json({
          status : 200,
          questions
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});

router.put('/acceptAnswer', async function(req, res, next) {
  
  let client;
  let { token, questionId, answerId } = { ...req.body };

  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        let updateQuestion = await db.collection("forum-questions").findOneAndUpdate(
          {_id : mongodb.ObjectId(questionId), "answers._id" : answerId},
          {$set : { accepted : true , "answers.$.isAccepted" : true} }
        );
        res.json({
          status : 200,
          updateQuestion
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});


router.put('/comment/:questionId', async function(req, res, next) {
  
  let client;
  let { token, content, askedBy } = { ...req.body };
  let questionId = req.params.questionId

  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        await db.collection("forum-questions").findOneAndUpdate(
          {_id : mongodb.ObjectId(questionId)},
          {
            $push : { 
              comments : {askedBy, content, time: Date.now() }
            } 
          }
        );
        
        let question = await db.collection("forum-questions").findOne({_id : mongodb.ObjectId(questionId)})
        res.json({
          status : 200,
          question
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});

router.put('/commentAnswer/:questionId', async function(req, res, next) {
  
  let client;
  let { token, answerId, content, askedBy } = { ...req.body };
  let questionId = req.params.questionId

  try {
      client = await mongoClient.connect(url);
      let db = client.db("zenClass");
      let decrypted = jwt.verify(token, "secret key");
      if(decrypted){
        await db.collection("forum-questions").findOneAndUpdate(
          {_id : mongodb.ObjectId(questionId), "answers._id" : answerId},
          {$push : { "answers.$.comments" : { askedBy, content, time: Date.now() } } }
        );
        
        let question = await db.collection("forum-questions").findOne({_id : mongodb.ObjectId(questionId)})
        res.json({
          status : 200,
          question
        })
      }
      else{
        res.json({
          status : 401,
          message : 'Not a Valid User'
        })
      }
      client.close();
    } catch (error) {
      console.log(error);
      res.json({
        status: 500,
        message: "Something went wrong in server",
      });
    }  
});


module.exports = router;