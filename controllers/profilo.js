const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
const { promise } = require('../utils/connection');

/**
 * Recupera dati da visualizzare sulla home del profilo
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getProfilo = async (req,res,next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({
            message: 'Errore input Parametri',
            error: errors.array()
        });
    }

    idUtente = req.body.id_utente;
   
    let numeroSessioniGuide;
    let portafoglio

   try{
    const [row, fields] = await db.execute('SELECT count(*) as NumeroSessioni FROM sessione WHERE id_utente = ?', [idUtente]);
    console.log("numero guide", row[0]);
    numeroSessioniGuide = row[0].NumeroSessioni;
   }
   catch(err) {
       console.log(err);
       res.status(401).json({
           message : err
       })
   }

   try{
      portafoglio = await getPortafoglioByIdUtente(idUtente);
        if(!portafoglio){
            res.status(401).json({
                message : 'portafoglio non disponibile'
            })
        }
   }
   catch(err){
       res.status(401).json({
           message : err
       })
   }
  
   res.status(201).json({
       totale_sessioni : numeroSessioniGuide,
   })
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
 * recupera tutte le auto parcheggiate nel garage di un dato utente (id)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getGarage = async (req,res,next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({
            message: 'Errore input Parametri',
            error: errors.array()
        });
    }

    idUtente = req.body.id_utente;
   
    let idGarage;
    let parcheggio = [];
    try{
        const [row, fields] = await db.execute(queries.getGarageByIdUtente, [idUtente]);
        idGarage = row[0].idgarage;
    }
    catch(err){
        res.status(401).json({
            message: err
        })
    }
    
    parcheggio = await getParcheggioByIdGarage(idGarage)
    setAutoPredefinita(idGarage, 1)
    res.status(201).json({
        message : 'ok',
        parcheggio : parcheggio
    })
}


/**
 * recupera auto parcheggiate in un dato garage
 * @param {*} idGarage 
 */
async function getParcheggioByIdGarage(idGarage){
    try{
        const [rows, field] = await db.execute(queries.getParcheggioByIdGarage, [idGarage]);
        parcheggio = rows;
        //console.log(parcheggio);
    }
    catch(err){
        res.status(401).json({
            message: err
        })
    }
    return parcheggio;
}

/**
 * Settare l'auto predefinita da utilizzare
 * @param {*} idAuto 
 */
async function setAutoPredefinita(idGarage, idAuto){
    try{
        const [row, field] = await db.execute('UPDATE parcheggia SET predefinito = ? WHERE id_garage = ?', [0, idUtente])
    }
    catch(err){
        console.log(err);
        return err;
    }

    try{
        const [row, field] = await db.execute('UPDATE parcheggia SET predefinito = ? WHERE id_garage = ? AND id_auto = ?', [1, idUtente, idAuto])
    }
    catch(err){
        console.log(err);
        return err;
    }

}


/**
 * Classifica globale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getClassificaGlobale = async (req,res,next) => {
    let classifica;
    try{
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM gamifieddrivingdb.utente JOIN gamifieddrivingdb.portafoglio 
                                                ON gamifieddrivingdb.utente.id_utente = gamifieddrivingdb.portafoglio.id_utente 
                                            ORDER BY punti_drivepass DESC
                                                `);
        classifica = rows;
    }
    catch(err){
       res.status(401).json({
           message : 'impossibile ottenere la classifica generale'
       })
    }

    res.status(201).json({
        message : 'classifica generale',
        classifica : classifica
    })
}

/**
 * Classifica città
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getClassificaLocation = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let utente;
    let classifica;
     try{
        const [row, field] = await db.execute(queries.getUtenteById, [idUtente]);
        utente = row[0];
    }   
    catch(err){
        res.status(401).json({
            message : 'impossibile recuperare dati utente'
        })
    }
    

    try{
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM gamifieddrivingdb.utente JOIN gamifieddrivingdb.portafoglio 
                                                ON gamifieddrivingdb.utente.id_utente = gamifieddrivingdb.portafoglio.id_utente 
                                                WHERE citta = ?
                                             ORDER BY punti_drivepass DESC
        `, [utente.citta]);
        classifica = rows;
    }
    catch(err){
       res.status(401).json({
           message : 'impossibile ottenere la classifica generale'
       })
    }

    res.status(201).json({
        message : 'classifica generale',
        classifica : classifica
    })
}


/**
 * Recupera classifica amici fb
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getClassificaFacebook = async (req,res,next) => {
    let friends = req.body.friends;
    let myId = req.body.id_utente;
    var amici = []; //Array degli amici

    var p;
    var promisesArray = [];
    var promisesClassifica = [];

    console.log(friends);

    //Recupera id facebook myutente
    const [row, field] = await db.execute(queries.getUtenteById, [myId]);
    friends.push(row[0].id_facebook);


    await friends.forEach( async (userFriend) => {
       p = db.execute(queries.getUtenteByIdFacebook, [userFriend]);
       promisesArray.push(p);   
    })
    const result = await Promise.all(promisesArray);


    result.forEach( async (friend) => {
        var promise = new Promise( async function(resolve, reject) {
        console.log("QQ",friend[0][0]);
       // friendsUtente.push(friend[0][0]);


        let portafoglio = await db.execute(queries.getPortafoglioByIdUtente, [friend[0][0].id_utente]);
        if(!portafoglio){
            return res.status(401).json({
                message : 'Portafoglio utente non disponibile'
            });
        }
        let stileDiGuida = await db.execute(queries.getStileDiGuidaByIdUtente, [friend[0][0].id_utente]);
        if(!stileDiGuida){
            return res.status(401).json({
                message : 'Stile di guida utente non disponibile'
            });
        }

        let amico = {
            id_utente : friend[0][0].id_utente,
            nome : friend[0][0].nome,
            cognome : friend[0][0].cognome,
            email : friend[0][0].email,
            citta : friend[0][0].citta,
            tipo_accesso : friend[0][0].tipo_accesso,
            tipo_utente : stileDiGuida[0][0].tipo,
            livello : portafoglio[0][0].livello,
            ac_point : portafoglio[0][0].acpoint,
            ticket : portafoglio[0][0].ticket,
            punti_drivepass : portafoglio[0][0].punti_drivepass,
            id_portafoglio : portafoglio[0][0].id_portafoglio,
        }

        //console.log("AMICO ", amico);
        amici.push(amico);
        //console.log("AMICI ARRAY iterazione", amici);
        resolve(amici);
        
        return promise;
        })

        promisesClassifica.push(promise);
        
    });

    
    const resultClassifica = await Promise.all(promisesClassifica);
    
    //Ordinamento classifica (punti_drivepass)
    amici.sort(function(a, b) {
        var puntiA = a.punti_drivepass;
        var puntiB = b.punti_drivepass;
        // Compare the 2 dates
        if (puntiA > puntiB) return -1;
        if (puntiA < puntiB) return 1;
        return 0;
    });

    res.status(201).json({
        friends : amici
    })
}