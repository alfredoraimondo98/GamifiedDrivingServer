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

    id = req.body.id;
   
    let numeroSessioniGuide;
    let portafoglio

   try{
    const [row, fields] = await db.execute('SELECT count(*) as NumeroSessioni FROM sessione WHERE idutente = ?', [id]);
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
      portafoglio = await getPortafoglio(req,res,next,id);
   }
   catch(err){
       res.status(401).json({
           message : err
       })
   }
  
   res.status(201).json({
       message : 'ok',
       numeroSessioniGuide : numeroSessioniGuide,
       livello : portafoglio.livello,

   })
   


}

/**
 * Recupera tutti i dati del portafoglio di un dato utente (id)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @param {*} id 
 */
exports.getPortafoglio = async (req,res,next,id) =>{
    var portafoglio;
    try{
        const [row, fields] = await db.execute('SELECT  * FROM portafoglio WHERE idutente = ?', [id]);
        portafoglio = row[0];
    }
    catch(err){
        console.log(err);
        res.status(401).json({
            message : err
        })
    }

    console.log("portafoglio" , portafoglio);
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

    id = req.body.id;
   
    let idGarage;
    let parcheggio = [];
    try{
        const [row, fields] = await db.execute('SELECT * FROM garage WHERE idutente = ?', [id]);
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
                                                ON gamifieddrivingdb.parcheggia.idauto = gamifieddrivingdb.auto.idauto 
                                                WHERE gamifieddrivingdb.parcheggia.idgarage = ?`, [idGarage]
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
async function setAutoPredefinita(idgarage, idAuto){
    try{
        const [row, field] = await db.execute('UPDATE parcheggia SET predefinito = ? WHERE idgarage = ?', [0, idgarage])
    }
    catch(err){
        console.log(err);
        return err;
    }

    try{
        const [row, field] = await db.execute('UPDATE parcheggia SET predefinito = ? WHERE idgarage = ? AND idauto = ?', [1, idgarage, idAuto])
    }
    catch(err){
        console.log(err);
        return err;
    }

}

