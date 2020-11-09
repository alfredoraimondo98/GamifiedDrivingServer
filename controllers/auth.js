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
const queries = require('../utils/queries')

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
              nameDisplay += ' We';
             // console.log(" NNN ", nameDisplay)
               
              let nome = nameDisplay.split(" ")[0];
              let cognome = nameDisplay.split(" ")[1];
            /*   if(nameDisplay.split(" ")[2] !== ''){
                  cognome = cognome + " " + nameDisplay.split(" ")[2];
              } */
              
      
              //console.log("EMAIL ", result.email);
              //Crea array degli amici
              let friends = [];
              result.friends.data.forEach( friend => {
                friend = {
                    nome : friend.name,
                    id : friend.id
                }
                friends.push(friend);
              })

               user = {
                nome : nome,
                cognome : cognome,
                email : result.email,
                citta : result.location.name,
                friends : friends, //array amici di fb
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
    const [row, fields] = await db.execute(queries.getUtenteByEmail, [utenteFacebook.email]);
    //.then( ([row,field]) =>{
        if(row[0]) { //se esiste
            userFb = row[0]; // lo salviamo in ut
            console.log(row[0]) 
            //console.log(userFb.password);
        }
        else{
            userFb = null; //se l'utente non è stato trovato, allora dobbiamo inserirlo
        }
    }
    catch(err){
        console.log("err", err);
    } 

    // console.log("UserFb", userFb);
    //console.log("User", utenteFacebook.friends);
    
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


 

exports.preSuccessFb = (req,res,next)=>{
    res.redirect ("/successLoginFacebook");
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
    let friends = [];
    if(tipo_accesso === 'facebook'){
        console.log("Login user fb",user);
        email = user.email;
        password = 'passwordforfb';
        friends = user.friends;
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
    let garage;
    let stileDiGuida;
    let idAutoPredefinita;

    try{
         const [row,field] = await db.execute(queries.getUtenteByEmail, [email]);
         utenteLogin = row[0];
        if(!row[0]){
            return res.status(401).json({
                message : false
            });
        }
        portafoglio = await getPortafoglioByIdUtente(utenteLogin.id_utente);
        if(!portafoglio){
            return res.status(401).json({
                message : 'Portafoglio utente non disponibile'
            });
        }
        garage = await getGarageByIdUtente(utenteLogin.id_utente);
        if(!garage){
            return res.status(401).json({
                message : 'Garage utente non disponibile'
            });
        }
        stileDiGuida = await getStileDiGuidaByIdUtente(utenteLogin.id_utente);
        if(!garage){
            return res.status(401).json({
                message : 'Stile di guida utente non disponibile'
            });
        }
        idAutoPredefinita = await getAutoPredefinita(utenteLogin.id_utente);
        if(!idAutoPredefinita){
            return res.status(401).json({
                message : 'Auto predefinita non disponibile'
            });
        }
    }
    catch(err){
        console.log(err);
        return res.status(401).json({
            message : false
        });
    }


        if(bcrypt.compare(password, utenteLogin.password, (err, data) => {
            if(err) throw err;
            if(data){
                
            const token = jwt.sign(
                {
                    idUtente : utenteLogin.id_utente,
                    email : utenteLogin.email,
                    name : utenteLogin.nome
                },'M1JECD2YJHETVBR33C3QSH8B74316TWVTKPVZSJBIZID30ETEXD5H29X57MKGVGQ',{expiresIn : '1h'});
            
            
            res.status(201).json({ 
                id_utente : utenteLogin.id_utente,
                nome : utenteLogin.nome,
                cognome : utenteLogin.cognome,
                email : utenteLogin.email,
                password : utenteLogin.password,
                citta : utenteLogin.citta,
                tipo_accesso : utenteLogin.tipo_accesso,
                tipo_utente : stileDiGuida.tipo,
                livello : portafoglio.livello,
                ac_point : portafoglio.acpoint,
                ticket : portafoglio.ticket,
                punti_drivepass : portafoglio.punti_drivepass,
                id_garage : garage.id_garage,
                id_portafoglio : portafoglio.id_portafoglio,
                id_auto_predefinita : idAutoPredefinita.id_auto,
                friends : friends,
                token : token,
            });
         
            //console.log(token);
            }
            else{
                return res.status(401).json({
                    message : false
                })
            }
    }));
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
    let idFacebook;
    //console.log("createUtente ", user);
    //Verifica se si sta effettuando l'accesso con fb o si sta registrando tramite app.
    if (tipo_accesso === 'facebook') { //Si sta registrando per la prima volta e sta accedendo con facebook
        console.log("creo utente fb");
        nome = user.nome;
        cognome = user.cognome;
        email = user.email;
        password = 'passwordforfb'; //generazione password per gli account fb*****
        citta = user.citta.toUpperCase();
        tipo = user.tipo;
        tipo_accesso = 'facebook';
        idFacebook = user.id; //user.id -> user id facebook.
    }
    else { //si sta registrando tramite form app
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
        citta = (req.body.citta.toUpperCase());
        tipo = req.body.tipo;
        tipo_accesso = 'app';
        idFacebook = -1;
    }


    var hashedPassword = await bcrypt.hashSync(password, 12); //bcrypt password
    let idUt;


    try {
       
      /*   conn.connect((err) =>{ 
            if(err) {  
              console.error("errore di connessione:" + err.stack ); 
              return;
            }
            console.log('connesso come id' + conn.threadId);
        }); */
        conn.beginTransaction(err => {
            if (err) {
                console.log(err);
                return res.status(422).json({
                    message: 'Impossibile avviare la procedura di regitrazione (transaction failed)'
                });
            }


            
            conn.query(queries.createUtente, [nome, cognome, email, hashedPassword, citta, tipo_accesso, idFacebook], (err, result) => {
                if (err) {

                    conn.rollback((err) => {
                        console.log("Utenteerror", err);
                    });
                    return res.status(422).json({
                        message: 'Errore insert utente'
                    });
                }

                var idInsertUtente = result.insertId;


                    conn.query(queries.createGarage, [idInsertUtente], (err, result) => {
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



                        //Inserisce auto di default nel parcheggio del garage
                        conn.query('INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) values (?,?,?,?)', [idInsertGarage, 1, 1, 1], (err, resul)=>{
                            if (err) {
                                conn.rollback((err) => {
                                    console.log("Insert auto predefinita error", err);
                                });
                                return res.status(422).json({
                                    message: 'Errore insert auto predefinita'
                                });  
                            }
                           
                   
                    

                            conn.query(queries.createPortafoglio, [idInsertUtente], (err, result) => {
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

                                conn.query(queries.createStileDiGuida, [idInsertUtente, tipo, mediaSettimanale, costanteCrescita, tolleranzaMin, tolleranzaMax], (err, result) => {
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
                       

                                    conn.query(queries.createStatisticheGamification, [idInsertUtente, 1, 0], (err, result) => {
                                        if (err) {
                                            conn.rollback((err) => {
                                                console.log("error iscrizione a gamifiedDriving", err);
                                            });
                                            return res.status(422).json({
                                                message: 'Errore insert statistichegamification'
                                            });
                                        }
                                        var idInsertStileGuida = result.insertId;
                        


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
                                                //console.log(" dati ", idInsertUtente, idInsertGarage, idInsertPortafoglio);
                                            /*  console.log("chiudo connessione");
                                                conn.end(); */
                                            /*  if(tipo_accesso === 'facebook'){
                                                    res.redirect('http://localhost:4200/sd/menu');
                                                } */
                                                return res.status(201).json({
                                                    message: 'Registrazione completata',
                                                }); 
                                            }
                                        });
                                    }); 
                                }); 
                            });
                        });
                    });
                });
            });
        }
        catch (err) {
            console.log("chiudo connessione");
            conn.end();
            return res.status(401).json({
                message: err,
            });
            console.log(err);
        }
}


exports.checkEmail = async (req, res, next) => {
    let email = req.body.email;
    try{
        const [row, field] = await db.execute(queries.getUtenteByEmail, [email]);
        if(row[0]){
            res.status(201).json({
                message : false
            })
        }
    }
    catch(err){
        console.log(err);
        res.status(201).json({
            message : false
        }) 
    }

    res.status(201).json({
        message : true
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











   
/**
 * Restituisce l'utente con idUtente
 * @param {*} idUtente 
 */
async function getUtente(idUtente) {
    let utente;
    try{
        const [row, fields] = await db.execute(queries.getUtenteById, [idUtente]);
        if(!row[0]){
            return false;
        }
        utente = row[0];
    }
    catch(err) {
        return err
    }
    return utente;
}

/**
 * restituisce portafoglio di idUtente
 * @param {*} idUtente 
 */
async function getPortafoglioByIdUtente(idUtente) {        
    console.log("cerco questo ", idUtente);
    let portafoglio;
    try{
        const [row, fields] = await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
        if(!row[0]){
            return false;
        }
        portafoglio = row[0];
    }
    catch(err) {
        return err
    }
    return portafoglio;
}

/**
 * Restituisce il garage di idUtente
 * @param {*} idUtente 
 */
async function getGarageByIdUtente(idUtente){
    let garage;
    try{
        const [row, fields] = await db.execute(queries.getGarageByIdUtente, [idUtente]);
        if(!row[0]){
            return false;
        }
        garage = row[0];
    }
    catch(err) {
        return err
    }
    return garage;
}

/**
 * Restituisce stilediguida di idUtente
 * @param {*} idUtente 
 */
async function getStileDiGuidaByIdUtente(idUtente){
    let stileDiGuida;
    try{
        const [row, fields] = await db.execute(queries.getStileDiGuidaByIdUtente, [idUtente]);
        if(!row[0]){
            return false;
        }
        stileDiGuida = row[0];
    }
    catch(err) {
        return err
    }
    return stileDiGuida;
}

/**
 * Recupera auto predefinita dell'utente
 */
async function getAutoPredefinita(idUtente){
    let idAutoPredefinita;
    let garage = await getGarageByIdUtente(idUtente);
    try{
        const [row, field] = await db.execute(queries.getAutoPredefinita, [garage.id_garage]);
        if(!row[0]){
            return false;
        }
        idAutoPredefinita = row[0];
    }
    catch(err){
        return err;
    }
    return idAutoPredefinita;
}



/**
 * Restituisce tutte le auto in parcheggio di un utente con idGarage
 * @param {*} idGarage 
 */
async function getParcheggioByIdGarage(idGarage){
    let parcheggio;
    try{
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM heroku_344b7c2e1e3b45f.parcheggia JOIN heroku_344b7c2e1e3b45f.auto 
                                                ON heroku_344b7c2e1e3b45f.parcheggia.id_auto = heroku_344b7c2e1e3b45f.auto.id_auto 
                                                WHERE heroku_344b7c2e1e3b45f.parcheggia.id_garage = ?`, [idGarage]
                                            );
                                            
        parcheggio = rows;
    }
    catch(err){
        return err;
    }
    return parcheggio;
}