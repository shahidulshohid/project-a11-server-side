const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 8000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

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
    
    // for add volunteer post 
    app.post('/add-volunteer-post', async(req, res) => {
        const data = req.body 
        const result = await volunteerManagementCollection.insertOne(data)
        res.send(result)
    })

    //get data volunteer needs now section fro just 6 card
    app.get('/volunteer-needs', async(req, res) => {
        const result = await volunteerManagementCollection.find().limit(6).sort({deadline: 1}).toArray()
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
    app.get('/volunteerDetails/:id', async(req, res) => {
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result = await volunteerManagementCollection.findOne(query)
        res.send(result)
      })

      // get data for be a volunteer page 
      // app.get('/be-volunteer/:id', async(req, res) => {
      //   const id = req.params.id 
      //   const query = {_id: new ObjectId(id)} 
      //   const result = await volunteerManagementCollection.findOne(query)
      //   res.send(result)
      // })



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
