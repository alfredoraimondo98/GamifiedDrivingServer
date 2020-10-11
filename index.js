const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());  
 


const cors = require('cors');

const allowedOrigins = [
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'http://localhost:8100'
  ];

// Reflect the origin if it's in the allowed list or not defined (cURL, Postman, etc.)
const corsOptions = {
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Origin not allowed by CORS'));
      }
    }
  }
  
 // Enable preflight requests for all routes
app.options('*', cors(corsOptions));

app.get('/cors', cors(corsOptions), (req, res, next) => {
  res.json({ message: 'This route is CORS-enabled for an allowed origin.' });
}) 

app.use(cors());

const passport = require("passport")

app.use(passport.initialize())
app.use(passport.session()) // acts as a middleware to alter the req object and change the user value in the request session

const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const profiloRoutes = require('./routes/profilo');
const shopRoutes = require('./routes/shop');
const drivepassRoutes = require('./routes/drivepass');

app.use('/auth', authRoutes);
app.use('/data', dataRoutes);
app.use('/profilo', profiloRoutes);
app.use('/shop', shopRoutes);
app.use('/shop', drivepassRoutes);




app.listen(3000, () => console.log("server start"));