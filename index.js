const express = require('express');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());  
 


const cors = require('cors');
app.use(cors());
/* app.use((req,res,next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

}) */

/* app.get('/auth', cors(corsOptions), (req, res, next) => {
  res.json({ message: 'This route is CORS-enabled for an allowed origin.' });
}) 
 */


const passport = require("passport")

app.use(passport.initialize())
app.use(passport.session()) // acts as a middleware to alter the req object and change the user value in the request session


const authRoutes = require('./routes/auth');
const dataRoutes = require('./routes/data');
const profiloRoutes = require('./routes/profilo');
const shopRoutes = require('./routes/shop');
const drivepassRoutes = require('./routes/drivepass');
const sessioneRoutes = require('./routes/sessione');
const sfidaRoutes = require('./routes/sfida');

app.use('/auth', authRoutes);
app.use('/data', dataRoutes);
app.use('/profilo', profiloRoutes);
app.use('/shop', shopRoutes);
app.use('/drivepass', drivepassRoutes);
app.use('/sessione', sessioneRoutes);
app.use('/sfida', sfidaRoutes); 


//console.log(process.env.DATABASE_NAME);

//app.listen(process.env.PORT || 35540, () => console.log("server start on "+ process.env.PORT));
 app.listen(3000, () => console.log("server start on "+ process.env.PORT));