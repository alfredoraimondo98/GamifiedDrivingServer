const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json()); //application/json


const cors = require('cors');
app.use(cors());

const authRoutes = require ('./routes/auth');
const dataRoutes = require ('./routes/data');


app.use('/auth', authRoutes);
app.use('/data',dataRoutes)
 

app.listen(3000, () => console.log("server start"));