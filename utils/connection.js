const mysql = require('mysql2');

/* const conn = mysql.createConnection({
    host: 'localhost',
    database: 'gamifieddrivingdb',
    user: 'root',
    password: 'admin'
}); */

const conn = mysql.createConnection({
  host: 'eu-cdbr-west-03.cleardb.net',
  database: 'heroku_344b7c2e1e3b45f',
  user: 'b1d9dcb10b6e9c',
  password: '23483988'
});

conn.connect((err) =>{ 
    if(err) {  
      console.error("errore di connessione:" + err.stack ); 
      return;
    }
    console.log('connesso come id' + conn.threadId);
});

module.exports = conn;
