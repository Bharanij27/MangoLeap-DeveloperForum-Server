const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const url = process.env.mongodbURL || "mongodb://localhost:27017/";
const jwt = require("jsonwebtoken");

var authenticate = () => {
    let client;
    let token = req.body.token;

    try {
        client = await mongoClient.connect(url);
        let db = client.db("zenClass");
        let decrypted = jwt.verify(token, "secret key");
        
        let user = await db.collection("forum-users").findOne({
          email: decrypted.id,
        });
    
        if (user) {
          res.json({
            status: 200,
            friends: user.friends,
            reqRecieved: user.req_rec,
            reqSend: user.req_sent,
          });
        } else {
          res.json({
            status: 404,
            message: "No Data Found",
          });
        }
        client.close();
      } catch (error) {
        console.log(error);
        res.json({
          status: 500,
          message: "Something went wrong in server",
        });
      }
}

module.exports = { authenticate }