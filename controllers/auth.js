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
const profiloController = require('./profilo');
 
var user;
var tipo_accesso;
/**
 * Login with facebook
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.loginFb =  (req,res,next) => {

}

/**
 * recupera informazioni utente login with facebook
 */
async function getUserFacebook() {
    var promise = new Promise(function(resolve, reject) {
        FB.api('me?fields=email,name,birthday,friends{name},picture,location,id', 'post', ( (result) => {
            if(!result || result.error) {
              console.log(!result ? 'error occurred' : result.error);
              return result.status(402).json({
                  message : 'impossibile accedere con fb'
                });
              }
               
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




/**
 * Redirect error login with facebook
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.errorFb = (req,res,next) => {
    res.status(201).json({
        message : 'login fb errore'
    })
 
}

exports.successFb = async (req, res, next) => {
     
    var userDati =  utilsFb.datifb()
    //console.log("**", userDati);
    FB.setAccessToken(userDati.token);
   
    var promiseGetUtenteFacebook = getUserFacebook();
    
    const utenteFacebook = await promiseGetUtenteFacebook;
    console.log("ritorno", utenteFacebook);
  
   var userFb;
   try{
    const [row, fields] = await db.execute('SELECT * FROM utente WHERE email = ?', [utenteFacebook.email]);
    //.then( ([row,field]) =>{
        if(row[0]) { //se esiste
            userFb = row[0]; // lo salviamo in ut
            console.log(row[0]) 
            console.log(userFb.password);
        }
        else{
            userFb = null; //se l'utente non è stato trovato, allora dobbiamo inserirlo
        }
    }
    catch(err){
        console.log("err", err);
    } 

    // console.log("UserFb", userFb);
    // console.log("User", user);
    
     dispatcherLoginWithFb(req,res,next,userFb);
 
}



/**
 * Verifica, in seguito ad accesso tramite FB, se si tratta di un nuovo utente o meno.
 * @param {*} ut 
 */
dispatcherLoginWithFb = (req,res,next,userFb) => {
    //console.log("disp", userFb);
    if(userFb != null){
        if(userFb.tipo_accesso === 'facebook') { //già ha effettuato una volta l'accesso con fb -> vai a login
            tipo_accesso = 'facebook'; 
            this.loginApp(req,res,next)
        }
        else if(userFb.tipo_accesso === 'app'){//già ha effettuato l'accesso da app ma vuole accedere con facebook -> update dell'utente
            tipo_accesso='facebook';
            db.execute('UPDATE  utente SET tipo_accesso = ? WHERE email = ?', [tipo_accesso, userFb.email])
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
        console.log("UUU",user);
        email = user.email;
        password = 'passwordforfb';
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
    let utenteLogin;
    let portafoglio;
    try{
         const [row,field] = await db.execute('SELECT * FROM utente WHERE email = ?', [email]);
         utenteLogin = row[0];
    }
    catch(err){
        console.log(err);
        return res.status(401).json({
            message : 'Email non trovata'
        });
    }

    try{
        portafoglio = await profiloController.getPortafoglio(req,res,next,utenteLogin.idutente);
        console.log("pp",portafoglio);
    }
    catch(err){

    }
    

    console.log(utenteLogin)
        if(bcrypt.compare(password, utenteLogin.password, (err, data) => {
            if(err) throw err;
            if(data){
                
            const token = jwt.sign(
                {
                    idUtente : utenteLogin.idutente,
                    email : utenteLogin.email,
                    name : utenteLogin.nome
                },'M1JECD2YJHETVBR33C3QSH8B74316TWVTKPVZSJBIZID30ETEXD5H29X57MKGVGQ',{expiresIn : '1h'});
            
            
            res.status(201).json({ 
                messages : 'Login success',
                id : utenteLogin.idutente,
                token : token,
                portafoglio : portafoglio
                
            });
            console.log(token);
            }
            else{
            return res.status(401).json({
                message : 'password errata'
            })
            }
    }));
   // })
   
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


    let auto = [];
    try{ 
        const [rows, field] =await db.execute('SELECT * FROM auto');
        auto = rows;
    }
    catch(err){
        console.log(err);
    }


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
                            //conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente]);
                        });
                        return res.status(422).json({
                            message: 'Errore insert garage'
                        });
                    }
                    var idInsertGarage = result.insertId;



                    //Inserisce auto nel parcheggio del garage
                    auto.forEach( (item) => {
                        console.log(item);
                        conn.query('INSERT INTO parcheggia (idgarage, idauto, disponibilita, predefinito) values (?,?,?,?)', [idInsertGarage, item.idauto, true, false], (err, resul)=>{
                            if (err) {
                                conn.rollback((err) => {
                                    console.log("Create parcheggio error", err);
                                });
                                return res.status(422).json({
                                    message: 'Errore insert garage'
                                });  
                            }
                           
                        });
                
                    })

                    conn.query('INSERT INTO portafoglio (idutente) values (?)', [idInsertUtente], (err, result) => {
                        if (err) {
                            conn.rollback((err) => {

                                console.log("Garageerror", err);
                               // conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente]);
                              //  conn.execute('DELETE FROM garage WHERE idutente = ?', [idInsertUtente]);
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
                                  //  conn.execute('DELETE FROM utente WHERE idutente = ?', [idInsertUtente]);
                                  //  conn.execute('DELETE FROM garage WHERE idutente = ?', [idInsertUtente]);
                                  //  conn.execute('DELETE FROM portafoglio WHERE idutente = ?', [idInsertUtente]);
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


 async function createParcheggio(idGarage){

 }    
        