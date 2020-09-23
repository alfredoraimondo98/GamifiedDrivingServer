const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    database: 'gamifieddrivingdb',
    user: 'root',
    password: 'admin'
});

module.exports = pool.promise();