const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 5000;
require('dotenv').config()

// middleware
app.use(cors({
  origin:['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

console.log(process.env.DB_USER)



// 4.1
// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vddbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     await client.connect();


//     const serviceCollection = client.db('carDoctor').collection('services');


//     app.get('/services', async(req,res) =>{
//       const cursor = serviceCollection.find();
//       const result = await cursor.toArray();
//       res.send(result);
//     })







//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log("Pinged your deployment. You successfully connected to MongoDB!");
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);



// 5.5

// const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vddbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// middlewares

const logger = async(req, res, next) =>{
  console.log(req.host, req.originalUrl)
  next();
}

const verifyToken = async (req, res, next ) =>{
  const token = req.cookies?.token;
  console.log('value of middle' ,token);
  if(!token){
    return res.status(401).send({message:'Mara khao'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) =>{
    // error
    if(err){
      console.log(err);
      return res.status(401).send({message:"Dure ja!!"})
    }
    // decode
    console.log('value in the token', decoded);
    req.user = decoded;
    next();
  })
  
}
 


async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    
    const serviceCollection = client.db('carDoctor').collection('services');
    const bookingCollection = client.db('carDoctor').collection('bookings');


    // auth related api
    app.post('/jwt', logger , async(req,res) =>{
      const user = req.body;
      console.log(user);
      // res.send(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly:true,
        secure:false,
        
      }) 
      .send({success: true})
    })

    app.post('/logout', async(req, res) =>{
      const user = req.body;
      console.log('logging out user', user);
      res.clearCookie('token', {maxAge: 0}).send({ success : true })
    })




    // services api
    app.get('/services', logger, async(req,res) =>{
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })

    app.get('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}

      const options = {
       
        // Include only the `title` and `imdb` fields in the returned document
        projection: {  title: 1, price: 1, service_id:1, img:1 },
      };

      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    })














    // bookings

    app.get('/bookings', verifyToken, logger , async(req,res) =>{
      console.log(req.query.email);
      // console.log(req.cookies.token)
      console.log('user in the valid token' ,req.user);
      if(req.query.email !== req.user.email){
        return res.status(403).send({message:'Sorry!! go somewhere else '})
      }
      let query = {};
      if (req.query?.email){
        query={ email: req.query.email }
      }
      const result = await bookingCollection.find().toArray();
      res.send(result);
    })


    app.post('/bookings', async(req, res)=>{
      const booking = req.body;
      console.log(booking);
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })


    app.patch('/bookings/:id', async(req, res) =>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id)};
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updatedDoc = {
        $set: {
          status: updatedBooking.status
        },

      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })



    app.delete('/bookings/:id', async (req, res) =>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id)}
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    } ); 




    


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);











app.get('/', (req, res) =>{
    res.send('What is up with you Doc??')
})

app.listen(port, () =>{
    console.log(`Doc should run on port ${port}`)
})