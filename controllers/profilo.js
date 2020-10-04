const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();

/**
 * Richiamato appena si va sul mio profilo 
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
    let myPortafoglio

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
