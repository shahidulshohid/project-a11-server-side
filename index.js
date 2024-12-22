const express = require('express')
const cors = require('cors')
require('dotenv').config()

const port = process.env.PORT || 8000

const app = express()

// middleware 
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send('Volunteer management server is running')
})

app.listen(port, ()=> {
    console.log(`Volunteer management server is running on PORT: ${port}`)
})