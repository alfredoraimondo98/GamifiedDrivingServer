const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
 
/**
 * Restituisce l'utente con idUtente
 * @param {*} idUtente 
 */
async function getUtente(idUtente) {
    let utente;
    try{
        const [row, fields] = await db.execute('SELECT * FROM utente WHERE id_utente = ?', [idUtente]);
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
 * Restituisce tutte le auto in parcheggio di un utente con idGarage
 * @param {*} idGarage 
 */
exports.getParcheggioByIdGarage = async (idGarage) =>{
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