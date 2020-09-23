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
  
    var hashedPassword = await bcrypt.hashSync(password,12);
  

    await db.execute('INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso) values (?,?,?,?,?,?)', [nome,cognome,email,hashedPassword,citta,tipo_accesso])
    .then( newUser => {console.log("prima utente");
        idUtente = newUser[0].insertId;
    })
    .catch();

    //creazione garage 
    await db.execute('INSERT INTO garage (idutente) values (?)', [idUtente])
    .then( newGarage => {
         idGarage = newGarage[0].insertId;
    })
    .catch();
    

    //creazione portafoglio 
    await db.execute('INSERT INTO portafoglio (idutente) values (?)', [idUtente])
    .then( newPortafoglio => {console.log("prima pè");
        idPortafoglio = newPortafoglio[0].insertId;
    })
    .catch();
 


    console.log("utente, garage, portafoglio", idUtente, idGarage, idPortafoglio);
    if(idUtente === idGarage && idUtente === idPortafoglio ){
        console.log("ok");
        return res.status(201).json({
            message : "Inserimento completato",
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


    
 

 

