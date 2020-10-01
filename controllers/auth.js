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
const utilsFb = require('../utils/facebook');

 
var user;
/**
 * Login with facebook
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.loginFb =  (req,res,next) => {

 //   res.status(201).json({
 //       message: 'ok'
 //   })
     
}

async function getUserFacebook() {
    
    var promise = new Promise(function(resolve, reject) {
        FB.api('me?fields=email,name,birthday,friends{name},picture,location,id', 'post', ( (result) => {
            if(!result || result.error) {
              console.log(!result ? 'error occurred' : result.error);
              return result.status(402).json({
                  message : 'impossibile accedere con fb'
                });
              }
               
            
           /* console.log('Post Email: ' + res.email);
            console.log('Post Name: ' + res.name);
            console.log('Post birthday: ' + res.birthday);
            console.log('Post Friends: ' + res.friends.summary.total_count);
            console.log('Post Picture: ' + res.picture.data.url);
            console.log('Citta: ' + res.location.name);*/
              let nameDisplay = result.name;
              let nome = nameDisplay.split(" ")[0];
              let cognome = nameDisplay.split(" ")[1];
      
              console.log("EMAIL ", result.email);
            
               user = {
                nome : nome,
                cognome : cognome,
                email : result.email,
                citta : result.location.name,
                tipo : 'Standard',
                id : result.id
              }
              resolve(user);
          })
          );
     });
     return promise;
}


var tipo_accesso;

exports.successFb = async (req, res, next) => {
     
    var userDati =  utilsFb.datifb()
    //console.log("**", userDati);
    FB.setAccessToken(userDati.token);

   
    var promiseGetUtenteFacebook = getUserFacebook();
    
    
    const utenteFacebook = await promiseGetUtenteFacebook;
    //console.log("ritorno", utenteFacebook);
  
   var ut;
   
   try{
    const [row, fields] = await db.execute('SELECT * FROM utente WHERE email = ?', [utenteFacebook.email]);
    //.then( ([row,field]) =>{
        if(row[0]) { //se esiste
            ut = row[0]; // lo salviamo in ut
            console.log(row[0]) 
            console.log(ut.password);
        }
        else{
            ut = null; //se l'utente non è stato trovato, allora dobbiamo inserirlo
        }
    }
    catch(err){
        console.log("err", err);
    } 

    user = ut;
    dispatcherLoginWithFb(req,res,next,ut);
 
}


exports.errorFb = (req,res,next) => {
     
    res.status(201).json({
        message : 'login fb errore'
    })
 
}

/**
 * Verifica, in seguito ad accesso tramite FB, se si tratta di un nuovo utente o meno.
 * @param {*} ut 
 */
dispatcherLoginWithFb = (req,res,next,ut) => {
    if(ut != null){
        if(ut.tipo_accesso === 'facebook') {
            //già ha effettuato una volta l'accesso con fb -> vai a login
            tipo_accesso = 'facebook';
            
            this.loginApp(req,res,next)
        }
        else if(ut.tipo_accesso === 'app'){
            //già ha effettuato l'accesso da app ma vuole accedere con facebook -> update dell'utente
            tipo_accesso = 'app';
        }
    }
    else{ //Nuovo utente, procedi con la registrazione
        console.log("utente non trovato");
        tipo_accesso = 'facebook';
        this.createUtente(req,res,next);
    }
}


 





/**
 * Login: utente accede tramite credenziali dell'app GamifiedDriving
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.loginApp = async (req,res,next) => {
    console.log("LOGIN");
    let email;
    let password;
    if(tipo_accesso === 'facebook'){
        email = user.email;
        password = user.password;
    }
    else{
    const errors = validationResult(req);
    
    if(!errors.isEmpty()){
        return res.status(422).json({
            message : 'Error input Parametri',
            error : errors.array()
        });
    }


    email = req.body.email;
    password = req.body.password;
    }
   // let loginUser;
   // var hashedPassword = await bcrypt.hashSync(password,12);
    console.log("mail" , email);
    console.log("pass", password);
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

 
exports.loginMe = () => {
    
}


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
exports.createUtente = async (req, res, next) => {
    let nome;
    let cognome;
    let email;
    let citta;
    let tipo;
    //console.log("createUtente ", user);
    //Verifica se si sta effettuando l'accesso con fb o si sta registrando tramite app.
    if (tipo_accesso === 'facebook') {
      

        console.log("creo utente fb");
        nome = user.nome;
        cognome = user.cognome;
        email = user.email;
        password = 'passwordforfb'; //generazione password per gli account fb*****
        citta = user.citta;
        tipo = user.tipo;
        tipo_accesso = 'facebook';
    }
    else {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.json({
                message: 'Errore input Parametri',
                error: errors.array()
            });
        }

        nome = req.body.nome;
        cognome = req.body.cognome;
        email = req.body.email;
        password = req.body.password;
        citta = req.body.citta;
        tipo = req.body.tipo;
        tipo_accesso = 'app';
    }


    var hashedPassword = await bcrypt.hashSync(password, 12); //bcrypt password
    let idUt;


    try {
        conn.beginTransaction(err => {
            if (err) {
                console.log(err);
                return res.status(422).json({
                    message: 'Impossibile avviare la procedura di regitrazione (transaction failed)'
                });
            }


            conn.query('INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso) values (?,?,?,?,?,?)', [nome, cognome, email, hashedPassword, citta, tipo_accesso], (err, result) => {
                if (err) {

                    conn.rollback((err) => {
                        console.log("Utenteerror", err);
                    });
                    return res.status(422).json({
                        message: 'Errore insert utente'
                    });
                }

                var idInsertUtente = result.insertId;


                conn.query('INSERT INTO garage (idutente) values (?)', [idInsertUtente], (err, result) => {
                    if (err) {
                        conn.rollback((err) => {

                            console.log("Garageerror", err);
                            conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente]);
                        });
                        return res.status(422).json({
                            message: 'Errore insert garage'
                        });
                    }
                    var idInsertGarage = result.insertId;



                    conn.query('INSERT INTO portafoglio (idutente) values (?)', [idInsertUtente], (err, result) => {
                        if (err) {
                            conn.rollback((err) => {

                                console.log("Garageerror", err);
                                conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente]);
                                conn.execute('DELETE FROM garage WHERE idutente = ?', [idInsertUtente]);
                            });
                            return res.status(422).json({
                                message: 'Errore insert portafoglio'
                            });
                        }
                        var idInsertPortafoglio = result.insertId;


                        defineStileGuida(tipo);


                        conn.query('INSERT INTO stilediguida (idutente, tipo, media_settimanale, costante_crescita, tolleranza_min, tolleranza_max) values (?,?,?,?,?,?)', [idInsertUtente, tipo, mediaSettimanale, costanteCrescita, tolleranzaMin, tolleranzaMax], (err, result) => {
                            if (err) {
                                conn.rollback((err) => {

                                    console.log("Garageerror", err);
                                    conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente]);
                                    conn.execute('DELETE FROM garage WHERE idutente = ?', [idInsertUtente]);
                                    conn.execute('DELETE FROM portafoglio WHERE idutente = ?', [idInsertUtente]);
                                });
                                return res.status(422).json({
                                    message: 'Errore insert stile di guida'
                                });
                            }
                            var idInsertStileGuida = result.insertId;
                        });


                        conn.commit((err) => {
                            if (err) {
                                conn.rollback((err) => {
                                    return res.status(422).json({
                                        message: 'Impossibile effettuare il commit. Registrazione fallita!'
                                    });
                                });
                            }
                            else {
                                console.log('Transaction Complete.');
                                console.log(" dati ", idInsertUtente, idInsertGarage, idInsertPortafoglio);
                                return res.status(201).json({
                                    message: 'registraione completata',
                                    idUtente: idInsertUtente,
                                    idGarage: idInsertGarage,
                                    idPortafoglio: idInsertPortafoglio,
                                    tipo_accesso: tipo_accesso
                                });
                            }
                        });
                        console.log("chiudo connessione");
                        conn.end(); //chiusura connessione - fine transazione
                    });
                });
            });
        });
    }
    catch (err) {
        console.log(err);
    }

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