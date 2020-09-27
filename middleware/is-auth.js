const jwt = require('jsonwebtoken');
const db = require('../utils/database');

module.exports = (req,res,next) => {
    console.log('AUTHORIZATION MIDDLEWARE');
    console.log(req.get('Authorization'));

    const auth = req.get('Authorization');
    
    if(!auth){
        return res.status(401).json({
            message : 'Accesso negato'
        });
    }

    const token = auth.split(' ')[1];
    let decode;
    try{
        decode = jwt.verify(token,'M1JECD2YJHETVBR33C3QSH8B74316TWVTKPVZSJBIZID30ETEXD5H29X57MKGVGQ');
    }catch (err){
        return res.status(500).json({
            message : 'Accesso negato'
        });
    }

    if(!decode){
        return res.status(401).json({
            message : 'Accesso negato'
        });
    }

    let userId = decode.idUtente;

    db.execute('SELECT * FROM utente WHERE idutente = ?', [userId])
    then(([user, field]) => {
        req.user = user[0]
        next();
    })
    .catch(err => {
        return res.status(401).json({
            message : 'Accesso negato'
        });
    });
};