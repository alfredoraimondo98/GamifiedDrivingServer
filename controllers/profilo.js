const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();

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
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE id_utente = ?', [idUtente]);
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
        const [row, fields] = await db.execute('SELECT * FROM garage WHERE id_utente = ?', [idUtente]);
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
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM gamifieddrivingdb.parcheggia JOIN gamifieddrivingdb.auto 
                                                ON gamifieddrivingdb.parcheggia.id_auto = gamifieddrivingdb.auto.id_auto 
                                                WHERE gamifieddrivingdb.parcheggia.id_garage = ?`, [idGarage]
                                            );
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


exports.getClassificaGenerale = async (req,res,next) => {
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


exports.getClassificaLocation = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let utente;
    let classifica;
     try{
        const [row, field] = await db.execute("SELECT * FROM utente WHERE id_utente = ?", [idUtente]);
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


