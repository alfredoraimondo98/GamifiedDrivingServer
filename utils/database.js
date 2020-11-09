const mysql = require('mysql2');

/* const pool = mysql.createPool({
    host: 'localhost',
    database: 'gamifieddrivingdb',
    user: 'root',
    password: 'admin'
}); */

const pool = mysql.createPool({
    host: 'eu-cdbr-west-03.cleardb.net',
    database: 'heroku_344b7c2e1e3b45f',
    user: 'b1d9dcb10b6e9c',
    password: '23483988'
});

module.exports = pool.promise();