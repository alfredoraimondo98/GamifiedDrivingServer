const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());  
 


const cors = require('cors');
app.use(cors());

const passport = require("passport")

app.use(passport.initialize())
app.use(passport.session()) // acts as a middleware to alter the req object and change the user value in the request session

const authRoutes = require ('./routes/auth');
const dataRoutes = require ('./routes/data');

app.use('/auth', authRoutes);
app.use('/data', dataRoutes)







app.listen(3000, () => console.log("server start"));