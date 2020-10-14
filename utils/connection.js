const mysql = require('mysql2');

const conn = mysql.createConnection({
    host: 'localhost',
    database: 'gamifieddrivingdb',
    user: 'root',
    password: 'admin'
});

conn.connect((err) =>{ 
    if(err) {  
      console.error("errore di connessione:" + err.stack ); 
      return;
    }
    console.log('connesso come id' + conn.threadId);
});

module.exports = conn;
