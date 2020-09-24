const db = require('../utils/database');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

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

    let loginUser;
    var hashedPassword = await bcrypt.hashSync(password,12);
    console.log("mail" , email)
    await db.execute('SELECT * FROM utente WHERE email = ?', [email])
    .then( ([row, fields]) => {
          //loginUser = row;
         if(bcrypt.compare(password, row[0].password, (err, data) => {
             if(err) throw err;
             if(data){
                return res.status(210).json({
                    message : 'login success',
                    
                })
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

var idUtente;
var idGarage;
var idPortafoglio;
var idStileGuida;
var tipo;
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
    tipo = "Viaggiatore";
    let tipo_accesso = 'app';
     
     
  
    var hashedPassword = await bcrypt.hashSync(password,12); //bcrypt password
    let idUt;
     
 //Esegue query insert utente
    await db.execute('INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso) values (?,?,?,?,?,?)', [nome,cognome,email,hashedPassword,citta,tipo_accesso])
    .then( newUser => {console.log("prima utente");
        idUt = newUser[0].insertId;
    })
    .catch(err => {
        res.json({
            message : 'utente'
        })
    });

    
   
    this.idUtente = idUt;
    
    await createGarage(this.idUtente); //Creazione garage 

    await createPortafoglio(this.idUtente); //creazione portafoglio

    await createStileGuida(this.idUtente, tipo);   //creazione stile di guida
     
  
    console.log("utente, garage, portafoglio, stilediguida", idUt, idGarage, idPortafoglio, idStileGuida);
    if(idUt === idGarage && idUtente === idPortafoglio ){  
        console.log("ok");
        return res.status(201).json({
            message : "Inserimento completato",
            userEmail : req.body.email,
            userNome : req.body.nome
        });
    }
    else if(idUt > 0 && idGarage > 0 && idPortafoglio > 0 && idStileGuida >= 0 ){ 
        console.log("ok");
        return res.status(201).json({
            message : "Inserimento completato: gli id non sono consistenti",
            userEmail : req.body.email,
            userNome : req.body.nome
        });
    }
    else{
        console.log("Valori non consistenti")
        return res.status(422).json({
            message : "Inserimento non riuscito"
        })
    }
      
 
}


    
/**
 * CreateGarage : Crazioen del garage dell'utente
 * @param {*} idUtente :Id utente foreignKey in Garage
 */
async function createGarage(idUtente){
      //creazione garage 
       console.log("UTENTE GARAGE",  idUtente);
      await db.execute('INSERT INTO garage (idutente) values (?)', [idUtente])
      .then( newGarage => {
           return idGarage = newGarage[0].insertId;
      })
      .catch(err => {
        res.json({
            message : 'garage'
        })
    });
} 

/**
 * createPortafoglio: creazoine del portafoglio dell'utente
 * @param {*} idUtente : IdUtente foreign key in portafoglio
 */
async function createPortafoglio(idUtente){
   //creazione portafoglio 
    await db.execute('INSERT INTO portafoglio (idutente) values (?)', [idUtente])
    .then( newPortafoglio => {
        return idPortafoglio = newPortafoglio[0].insertId;
    })
    .catch(err => {
        res.json({
            message : 'portafoglio'
        })
    });
} 


/**
 * createStileGiuida: creazione dello stile di guida dell'utente sulla base del tipo stabilito.
 * @param {*} idUtente 
 * @param {*} tipo 
 */
async function createStileGuida(idUtente, tipo){
    console.log("tipo ", tipo);
    console.log("ut " ,idUtente)
    let mediaSettimanale = 150;
    let costanteCrescita = 1;
    let tolleranzaMin = 120;
    let tolleranzaMax = 180;
    if(tipo==='Viaggiatore'){
        mediaSettimanale = 220;
        costanteCrescita = 0.5;
        tolleranzaMin = 180;
        tolleranzaMax = 400;
         
    }
    else if(tipo==='Standard'){
        console.log("in");
        mediaSettimanale = 150;
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
     
    //console.log("*S*S*", mediaSettimanale, costanteCrescita, tolleranzaMax, tolleranzaMin);

    await db.execute('INSERT INTO stilediguida (idutente, tipo, media_settimanale, costante_crescita, tolleranza_min, tolleranza_max) values (?,?,?,?,?,?)', [idUtente, tipo, mediaSettimanale, costanteCrescita, tolleranzaMin, tolleranzaMax])
    .then( newStileDiGuida => {
        console.log(newStileDiGuida[0]);
        return idStileGuida = newStileDiGuida[0].insertId;
    })
    .catch( err => {
        res.json({
            message : 'stilediguida'
        })
    });
} 
 