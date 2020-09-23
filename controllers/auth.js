const db = require('../utils/database');

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



 
function selectUserByEmail(email) {
    db.execute('SELECT * FROM utente WHERE email = ?', [email])
   .then( ([rows,fields]) => {
       console.log("IDDD ",rows[0].idutente);
       return rows[0].idutente;
   })
   .catch( error => {
       console.log(error);
   })
}

function createPortafoglio(idUtente){
    db.execute('INSERT INTO portafoglio (idutente) values (?)', [idUtente])
    .then( res => {
        console.log("Portafoglio creato");
    })
    .catch();
}

exports.insertUtente = async (req,res,next) => {
    console.log("Insertutente");
    var nome = req.body.nome;
    var cognome = req.body.cognome;
    var email = req.body.email;
    var password = req.body.password;
    var citta = req.body.citta;
    var tipo_accesso = 'app';
   // nome = 'aa2';
   // console.log("BODY:", req.body);

   var idUtente;
   //Esegue query
    var newUser = await db.execute('INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso) values (?,?,?,?,?,?)', [nome,cognome,email,password,citta,tipo_accesso])    
    .then( newU => {
        res.status(201).json({ 
            messages : 'OK',
        });
    })
    .catch( error => {
        return res.status(422).json({
            message : 'Errore nel Salvataggio'
        });
    })
    
/*
    await db.execute('SELECT * FROM utente WHERE email = ?', [email])
    .then( ([rows,fields]) => {
        console.log("IDDD ",rows[0].idutente);
        idUtente = rows[0].idutente;
        console.log("IDutente ",idUtente);
    })
    .catch( error => {
        console.log(error);
    })
    console.log("idUser: ",idUtente);
*/
    idUtente = await selectUserByEmail(email); 
    console.log(idUtente);
    //await createPortafoglio(idUtente);
    /*db.execute('INSERT INTO portafoglio (idutente) values (?)', [idUtente])
    .then()
    .catch();
*/
    await db.execute('INSERT INTO garage (idutente) values (?)', [idUtente])
    .then()
    .catch();

    

    
}

