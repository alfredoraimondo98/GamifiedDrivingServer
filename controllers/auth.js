const db = require('../utils/database');
const bcrypt = require('bcryptjs');
 
/**
 * getUtenti: restituisce tutti gli utenti presenti nella tabella
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getUtenti = (req,res,next) => {
    console.log("log");

    db.execute('SELECT * FROM utente')
    .then( ([rows,fields]) => {
        res.send(rows)
    })
    .catch( error => {
        console.log(error);
    })
}



/** /auth/register/
 * Insert utente (Registrazione)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.insertUtente = async (req,res, next) => {
     var nome = req.body.nome;
    var cognome = req.body.cognome;
    var email = req.body.email;
    var password = req.body.password;
    var citta = req.body.citta;
    var tipo_accesso = 'app';

     
    var idUtente;
    var idGarage;
    var idPortafoglio;
    var jsonResp;

   //Esegue query
  
    //var hashedPassword = await bcrypt.hashSync(password,12);
    //console.log("PPP ", hashedPassword);
  
  

    await db.execute('INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso) values (?,?,?,?,?,?)', [nome,cognome,email,password,citta,tipo_accesso])
    .then( newUser => {console.log("prima utente");
        idUtente = newUser[0].insertId;
    })
    .catch( err => {
        jsonResp = {
            message : err
        }
    });

    //creazione garage 
    await db.execute('INSERT INTO garage (idutente) values (?)', [idUtente])
    .then( newGarage => {
        console.log("prima ga");
        idGarage = newGarage[0].insertId;
    })
    .catch( err => {
        jsonResp = {
            message : err
        }
    });;
    

    //creazione portafoglio 
    await db.execute('INSERT INTO portafoglio (idutente) values (?)', [idUtente])
    .then( newPortafoglio => {console.log("prima pè");
        idPortafoglio = newPortafoglio[0].insertId;
    })
    .catch( err => {
        jsonResp = {
            message : err
        }
    });
 


    console.log("utente, garage, portafoglio", idUtente, idGarage, idPortafoglio);
    if(idUtente == idGarage == idPortafoglio){
        console.log("ok");
        return res.status(201).json({
            message : "Inserimento completato"
        });
    }
    else{
        console.log("Valori non consistenti")
        return res.status(422).json({
            message : jsonResp
        })
    }
      
 
}


    
 

 

