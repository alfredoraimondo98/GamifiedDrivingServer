const conn = require('../utils/connection');
const db = require('../utils/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();
const passport = require("passport")
const FacebookStrategy = require("passport-facebook").Strategy
const FB = require('fb');

exports.loginFb = (req,res,next) => {
    
     
}


 





/**
 * Login: utente accede tramite credenziali dell'app GamifiedDriving
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.loginApp = async (req,res,next) => {
    console.log("LOGIN");
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }
    const email = req.body.email;
    const password = req.body.password;
    
   // let loginUser;
   // var hashedPassword = await bcrypt.hashSync(password,12);
    console.log("mail" , email)
    await db.execute('SELECT * FROM utente WHERE email = ?', [email])
    .then( ([row, fields]) => {
          //loginUser = row;
          console.log(row[0])
         if(bcrypt.compare(password, row[0].password, (err, data) => {
             if(err) throw err;
             if(data){
                 
                const token = jwt.sign(
                    {
                        idUtente : row[0].idutente,
                        email : row[0].email,
                        name : row[0].nome
                    },'M1JECD2YJHETVBR33C3QSH8B74316TWVTKPVZSJBIZID30ETEXD5H29X57MKGVGQ',{expiresIn : '1h'});
                  
                res.status(201).json({ 
                    messages : 'Login success',
                    id : row[0].idutente,
                    token : token,
                });
               console.log(token);
             }
             else{
                return res.status(401).json({
                    message : 'password errata'
                })
             }
        }));
    })
    .catch( err => {
        return res.status(401).json({
            message : 'Email non trovata'
        });
    });
}

exports.loginMe = ((req,res,next) => {

})



var mediaSettimanale = 0;
var costanteCrescita = 0;
var tolleranzaMin = 0;
var tolleranzaMax = 0;
/** /auth/register/
 * Crea utente (Registrazione): Creazione utente con portafoglio e garage associati all'utente
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.createUtente = async (req,res, next) => { 
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return res.status(422).json({
            message : 'Errore input Parametri',
            error : errors.array()
        });
    }

    let nome = req.body.nome;
    let cognome = req.body.cognome;
    let email = req.body.email;
    let password = req.body.password;
    let citta = req.body.citta;
    let tipo = req.body.tipo;
    let tipo_accesso = 'app';
     
     
  
    var hashedPassword = await bcrypt.hashSync(password,12); //bcrypt password
    let idUt;
    
   
    conn.beginTransaction( err => {
      if(err){ 
          console.log(err);
          return res.status(422).json({
            message : 'Impossibile avviare la procedura di regitrazione (transaction failed)'
        })
    }
 

    conn.query('INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso) values (?,?,?,?,?,?)', [nome,cognome,email,hashedPassword,citta,tipo_accesso], (err, result) => {
        if(err) {
            
            conn.rollback( (err) => {
                console.log("Utenteerror",err);
            })
            return res.status(422).json({
                message : 'Errore insert utente'
            })
        }

        var idInsertUtente = result.insertId;
      

        conn.query('INSERT INTO garage (idutente) values (?)', [idInsertUtente],(err, result) => {  //Creazione garage
            if(err) {
                conn.rollback( (err) => {
                    
                    console.log("Garageerror",err);
                    conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente])
                })
                return res.status(422).json({
                    message : 'Errore insert garage'
                })
            }
            var idInsertGarage = result.insertId;



            conn.query('INSERT INTO garage (idutente) values (?)', [idInsertUtente],(err, result) => {  //Creazione portafoglio
                if(err) {
                    conn.rollback( (err) => {
                        
                        console.log("Garageerror",err);
                        conn.execute(  'INSERT INTO portafoglio (idutente) values (?)', [idInsertUtente])
                    })
                    return res.status(422).json({
                        message : 'Errore insert portafoglio'
                    })
                }
                var idInsertPortafoglio = result.insertId;


                defineStileGuida(tipo);


                conn.query('INSERT INTO stilediguida (idutente, tipo, media_settimanale, costante_crescita, tolleranza_min, tolleranza_max) values (?,?,?,?,?,?)', [idInsertUtente, tipo, mediaSettimanale, costanteCrescita, tolleranzaMin, tolleranzaMax],(err, result) => {  //Creazione sessione di guida
                    if(err) {
                        conn.rollback( (err) => {
                            
                            console.log("Garageerror",err);
                            conn.execute(  'INSERT INTO portafoglio (idutente) values (?)', [idInsertUtente])
                        })
                        return res.status(422).json({
                            message : 'Errore insert stile di guida'
                        })
                    }
                    var idInsertStileGuida = result.insertId;
                })


                conn.commit( (err) => { 
                    if(err){   
                        conn.rollback((err) => { 
                        return res.status(422).json({
                            message : 'Impossibile effettuare il commit. Registrazione fallita!'
                        })
                    });
                    }
                    else{
                        console.log('Transaction Complete.');
                        return res.status(201).json({
                            message : 'registraione completata',
                            idUtente : idInsertUtente,
                            idGarage : idInsertGarage,
                            idPortafoglio : idInsertPortafoglio
                        })
                    }
                });
                conn.end(); //chiusura connessione - fine transazione
            });
        }); 
    });
})
}



    
/**
 * Definizione dello stile di guida sulla base del tipo di utente
 * @param {*} tipo 
 */
 function defineStileGuida(tipo){
    if(tipo==='Viaggiatore'){
        this.mediaSettimanale = 220;
        costanteCrescita = 0.5;
        tolleranzaMin = 180;
        tolleranzaMax = 400;
        
    }
    else if(tipo==='Standard'){
        costanteCrescita = 1;
        tolleranzaMin = 120;
        tolleranzaMax = 180;
    }
    else if(tipo==='Salutista'){
        mediaSettimanale = 100;
        costanteCrescita = 2;
        tolleranzaMin = 0;
        tolleranzaMax = 120;    
    }
 }