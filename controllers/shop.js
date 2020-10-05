const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();


exports.buyWithTickets = async (req,res,next) => {
    idutente = req.body.id;
    costo = req.body.costo; //costo ticket;

    let updateTicket;
    let premio;

    try{ //Verifica credito Tickets
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE idutente = ?', [idutente]);
        if(row[0].ticket >= costo){
            updateTicket = row[0].ticket - costo;
        }
        else{
            res.status(401).json({
                message : 'Tickets insufficienti'
            })
        }
    }
    catch(err){
        console.log(err);
        res.status(401).json({
            message : err
        })
    }
    try{
        premio = await acquistoPacchetto(idutente, costo); //acquisto pacchetto e generazione del premio
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile procedere con acquisto'
        })
    }


    try{ //aggiornamento portafoglio
        result = await db.execute('UPDATE portafoglio SET ticket = ? WHERE idutente = ?', [updateTicket, idutente])
         
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile aggiornare il portafoglio',
            err : err
        })
    }

    res.status(201).json({
        message : 'Acquisto completato',
        newTickets : updateTicket, //Nuovo credito tickets
        premio : premio, //Premio appena vinto
    })
}

exports.buyWithPoints = async (req,res,next) => {
    idutente = req.body.id;
    costo = req.body.costo; //costo ticket;

    let updatePoint
    try{ //verifica points
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE idutente = ?', [idutente]);
        if(row[0].ticket >= costo){
            updatePoint = row[0].acpoint - costo;
        }
        else{
            res.status(401).json({
                message : 'AcPoints insufficienti'
            })
        }
    }
    catch(err){
        console.log(err);
        return err;
    }

    try{
        premio = await acquistoPacchetto(idutente, costo); //acquisto auto
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile procedere con acquisto'
        })
    }

    try{ //aggiornamento portafoglio
        const [row, field] = await db.execute('UPDATE portafoglio SET acpoint = ? WHERE idutente = ?', [updatePoint, idutente])
    }
    catch(err){
        console.log(err);
        return err;
    }

    res.status(201).json({
        message : 'Acquisto completato'
    })
}

/**
 * Acquisto pacchetto Tickets
 * @param {*} idutente 
 * @param {*} costo 
 */
async function acquistoPacchetto(idutente, costo){
    let auto = [];
    let idgarage;
    let autoDisponibili = [];
    console.log(costo);
    try{
        const [rows, field] = await db.execute("SELECT * FROM auto"); //Recupera tutte le auto
        auto = rows;
    }
    catch(err){
        return 'Impossibile recuperare le auto ' + err;
    }

    try{
        const [row, field] = await db.execute("SELECT * FROM garage WHERE idutente = ? ", [idutente]) //recupera id garage dell'utente
        idgarage = row[0].idgarage
    }
    catch(err){
        return 'Impossibile recuperare id garage: ' + err;
    }

    try{
        const [rows, field] = await db.execute("SELECT * FROM parcheggia WHERE idgarage = ?", [idgarage]) //recupera auto nel parcheggio dell'utente
        autoDisponibili = rows;
    }
    catch(err){
        return 'Impossibile recuperare le auto parcheggiate nel garage di questo utente: ' + err;

    }
   
    autoRandom = dispatcherPacchetto(costo, auto, autoDisponibili); //costruzione array su cui effettuare la random 
    console.log(autoRandom);

    const randomElement = autoRandom[Math.floor(Math.random() * autoRandom.length)]; //Random vincita
  

    try{
        const result = await db.execute("INSERT INTO parcheggia (idgarage, idauto, disponibilita, predefinito) VALUES (?, ?, ?, ?)", [idgarage, randomElement.idauto, 1, 0]) //recupera auto nel parcheggio dell'utente
    }
    catch(err){
        return 'Impossibile inserire premio: ' +err;
    }

    return randomElement; //Restituisce l'auto vinta!
    

}

/**
 * Costruzione array per l'estrazione sulla base del pacchetto acquistato
 * @param {*} costo 
 * @param {*} auto 
 * @param {*} autoDisponibili 
 */
function dispatcherPacchetto(costo, auto, autoDisponibili){
    if(costo === '20'){ //pacchetto bronzo
        console.log("in")
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.idauto === item.idauto){
                    bool = true;
                }
            })
            if(!bool){
                if(item.rarita === 'Comune' || item.rarita === 'Raro'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Comune'){ //Probabilità di un auto comune (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        
        return autoRandom;
    }
    if(costo === '50'){ //pacchetto argento
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.idauto === item.idauto){
                    bool = true;
                }
            })
            if(!bool){   
                if(item.rarita === 'Raro' || item.rarita === 'Epico'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Raro'){ //Probabilità di un auto rara (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        return autoRandom;
    }
    if(costo === '100'){ //pacchetto oro
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.idauto === item.idauto){
                    bool = true;
                }
            })
            if(!bool){
                if(item.rarita === 'Epico' || item.rarita === 'Leggendario'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Epico'){ //Probabilità di un auto epico (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        return autoRandom;
    }
    if(costo === '180'){ //pacchetto damascus
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.idauto === item.idauto){
                    bool = true;
                }
            })
            if(!bool){
                if(item.rarita === 'Leggendario' || item.rarita === 'Limited'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Leggendario'){ //Probabilità di un auto leggendario (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        return autoRandom;
    }

    
}



/**
 * getShopAuto : restituisci le auto per lo shop del singolo utente.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getShopAuto = async (req,res,next) =>{
    let idutente = req.body.id;

    let auto = []; //Tutte le auto disponibili
    let idgarage;
    let autoDisponibili = []; //Auto disponibili per l'utente
    
    try{
        const [rows, field] = await db.execute("SELECT * FROM auto"); //Recupera tutte le auto
        auto = rows;
    }
    catch(err){
        res.status(201).json({
            message : 'Impossibile recuperare auto',
            err : err
        })
    }

    try{
        const [row, field] = await db.execute("SELECT * FROM garage WHERE idutente = ? ", [idutente]) //recupera id garage dell'utente
        idgarage = row[0].idgarage
    }
    catch(err){
        res.status(201).json({
            message : 'Impossibile recuperare id garage',
            err : err
        })
    }

    try{
        const [rows, field] = await db.execute("SELECT * FROM parcheggia WHERE idgarage = ?", [idgarage]) //recupera auto nel parcheggio dell'utente
        autoDisponibili = rows;
    }
    catch(err){
        res.status(201).json({
            message : 'Impossibile recuperare le auto parcheggiate nel garage di questo utente',
            err : err
        })
    

    }
   
    let autoIntoShop = auto.filter( (item) => {
        let bool = false;
        autoDisponibili.forEach( (a) => {
            if(a.idauto === item.idauto){
                bool = true;
            }
        })
        if(!bool){
            return item;
        }
    })

    res.status(201).json({
        message : 'Shop',
        shopAuto : autoIntoShop
    })
     
}


exports.buyAuto = async (req,res,next) => {
    let idutente = req.body.id;
    let idauto = req.body.idauto
    let idgarage;
    let updatePoint;
    let auto;
    try{ //recupera dati auto da acquistare
        const [row, field] = await db.execute("SELECT * FROM auto WHERE idauto = ? ", [idauto]);
        auto = row[0];
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile trovare auto'
        })
    }

    try{
        const [row, field] = await db.execute("SELECT * FROM garage WHERE idutente = ? ", [idutente]);
        idgarage = row[0].idgarage;
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile trovare garage'
        })
    }


    try{   
        updatePoint = await verificaPoint(idutente, auto.costo);
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile verificare i coin disponibili'
        })
    }

    console.log(updatePoint)

    if(updatePoint){
        try{ //aggiornamento portafoglio
            result = await db.execute('UPDATE portafoglio SET acpoint = ? WHERE idutente = ?', [updatePoint, idutente]);
        }
        catch(err){
            res.status(401).json({
                message : 'impossibile aggiornare il portafoglio',
                err : err
            })
        }
    }
    else{
        res.status(401).json({
            message : 'AcPoint non sufficienti'
        })
    }

    try{
        result = await db.execute('INSERT INTO parcheggia (idgarage, idauto, disponibilita, predefinito) VALUES (?, ?, ?, ?) ', [idgarage, idauto, 1, 0]);
        res.status(201).json({
            message : 'acquisto completato'
        })
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile inserire auto in parcheggia'
        })
    }

}



async function verificaPoint(idutente, costo){
    let updatePoint
    try{ //verifica points
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE idutente = ?', [idutente]);
        if(row[0].ticket >= costo){
            updatePoint = row[0].acpoint - costo;
            return updatePoint;
        }
        else{
            return false;
        }
    }
    catch(err){
        console.log(err);
        return err;
    }
}