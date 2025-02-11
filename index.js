const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;

const app = express();

// middleware
app.use(cors({
  origin:['http://localhost:5173',
   'http://localhost:5174',
    'https://b10-assignment-11.web.app',
    'https://b10-assignment-11.firebaseapp.com'
  ],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser())

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token 
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }

  // verify the token 
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if(error){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user = decoded
  })
  next()
}

const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.wnw5g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    
    const volunteerManagementCollection = client.db("volunteerManagement").collection('volunteerCollection');
    const beRequestCollection = client.db("volunteerManagement").collection('beCollection');
    // auth related apis 
    app.post('/jwt', (req, res) => {
      const user = req.body 
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'5h'})
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({success:true})
    })

    app.post('/logout', (req, res) => {
      res.clearCookie('token', {
        maxAge: 0,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      })
      .send({success:true})
    })


    // for add volunteer post 
    app.post('/add-volunteer-post', verifyToken, async(req, res) => {
        const data = req.body 
        const result = await volunteerManagementCollection.insertOne(data)
        res.send(result)
    })

    //get data volunteer needs now section fro just 6 card
    app.get('/volunteer-needs', async(req, res) => {
        const result = await volunteerManagementCollection.find().limit(8).sort({deadline: 1}).toArray()
        res.send(result)
    })
    //get all data for volunteer needs post page
    app.get('/all-volunteer-needs', async(req, res) => {
      const search = req.query.search 
      let query = {
        title: {
          $regex: search, $options: 'i'
        }
      }
      const result = await volunteerManagementCollection.find(query).toArray()
        res.send(result)
    })

    //get data for a details page
    app.get('/volunteerDetails/:id', verifyToken, async(req, res) => {
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result = await volunteerManagementCollection.findOne(query)
        res.send(result)
      })

      // get data for be a volunteer page 
      app.get('/be-volunteer/:id', async(req, res) => {
        const id = req.params.id 
        const query = {_id: new ObjectId(id)} 
        const result = await volunteerManagementCollection.findOne(query)
        res.send(result)
      })

      //get a request be volunteer
      app.post('/request-be-volunteer', async(req, res) => {
        const requestData = req.body 
        const result = await beRequestCollection.insertOne(requestData)
        
        // decrease no. of volunteer needs 
        const filter = {_id: new ObjectId(requestData.volunteerId)}
        const updated = {
          $inc: {number: parseInt(-1)}
        }
        const updateCount = await volunteerManagementCollection.updateOne(filter, updated)
        res.send(result)
      })

      // get data for manage my profile 
      app.get('/getManageData/:email', verifyToken, async(req, res) => {
        const email = req.params.email 
        const filter = {email}
        const result = await volunteerManagementCollection.find(filter).toArray()
        res.send(result)
      })

      // delete data for manage my profile 
      app.delete('/deleteManageData/:id', async(req, res) => {
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result = await volunteerManagementCollection.deleteOne(query)
        res.send(result)

      })

      //update data for manageMyProfile 
      app.put('/update-manage-profile/:id', async(req, res) => {
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const updateData = req.body
        const update = {
          $set: updateData,
        }
        const options = {upsert:true}
        const result = await volunteerManagementCollection.updateOne(query, update, options)
        res.send(result)
      })

      //get data for My Volunteer Request Post
      app.get('/beVolunteer/:email', async(req, res) => {
        const email = req.params.email 
        const query = {email} 
        const result = await beRequestCollection.find(query).toArray()
        res.send(result)
      })

      //delete my volunteer request 
      app.delete('/deleteMyVolunteer-request/:id', async(req, res) => {
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result = await beRequestCollection.deleteOne(query)
        res.send(result)
      })



    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Volunteer management server is running");
});

app.listen(port, () => {
  console.log(`Volunteer management server is running on PORT: ${port}`);
});
