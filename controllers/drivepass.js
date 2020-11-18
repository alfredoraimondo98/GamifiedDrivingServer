const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
const sessioneController = require('./sessione');

exports.getDrivepass = async (req,res,next) => {
    let stagione = 1;
    let dp;
    var drivePass = [];

    //get Drivepass stagione 1
    try{
        const [row, fields] = await db.execute(queries.getDrivePassByStagione, [stagione]);
        dp = row;
    }
    catch(err){
        res.status(401).json({
            text : "impossibile accedere al drivepass",
            err : err
        })
    }


    var promiseDP = [];
 

    dp.forEach( async (item) => {
        var promise = new Promise( async function(resolve, reject) {
            if(item.tipo_premio === 'auto'){
                let auto;
                try{
                    const [row, field] = await db.execute(queries.getAutoById, [item.premio]);
                    auto = row[0]; 
                }
                catch(err){
                    res.status(401).json({
                        message : err
                    })
                }


             let premioAuto = {
                    stagione : item.stagione,
                    livello : item.livello,
                    premio : item.premio,
                    tipo_premio : item.tipo_premio,
                    auto : {
                        nome : auto.nome,
                        rarita : auto.rarita,
                        img : auto.img,
                        colore : auto.colore
                    }
                }
                drivePass.push(premioAuto);   
            }
        
        
            if(item.tipo_premio === 'avatar'){
                let avatar;
                try{
                    const [row, field] = await db.execute(queries.getAvatarById, [item.premio]);
                    avatar = row[0]; 
                }
                catch(err){
                    res.status(401).json({
                        message : err
                    })
                }

                let premioAvatar = {
                    stagione : item.stagione,
                    livello : item.livello,
                    premio : item.premio,
                    tipo_premio : item.tipo_premio,
                    avatar : {
                        nome : avatar.nome,
                        img : avatar.img,
                    }
                }

                drivePass.push(premioAvatar); 
            }


            if(item.tipo_premio === 'acpoints'){
                //premio corrisponde al valore di acpoints del premio
                drivePass.push(item);
            }


            if(item.tipo_premio === 'tickets'){
                drivePass.push(item);
            } 

            resolve(drivePass);
            return promise;
        }) 

        promiseDP.push(promise);
    })


    const resultDrivePass = await Promise.all(promiseDP);
 
    //Ordinamento livelli (punti_drivepass)
    drivePass.sort(function(a, b) {
        var livelloA = a.livello;
        var livelloB = b.livello;
        if (livelloA < livelloB) return -1;
        if (livelloA > livelloB) return 1;
        return 0;
    });

    
    

    res.status(201).json({
        drivePass : drivePass
    })
   

}

/**
 * Punti del range livello
 * @param {*} livello 
 */
function rangeLivello(livello, costante_crescita){
    if(livello >= 1 && livello <= 15){
        return 10 * costante_crescita;
    }
    if(livello >= 16 && livello <= 30){
        return 15 * costante_crescita;
    }
    if(livello >= 31 && livello <= 49){
        return 20 * costante_crescita;
    }
    if(livello >= 50 && livello <= 65){
        return 25 * costante_crescita;
    }
    if(livello >= 66 && livello <= 79){
        return 30 * costante_crescita;
    }
    if(livello >= 80 && livello <= 95){
        return 35 * costante_crescita;
    }
    if(livello >= 96 && livello <= 98){
        return 38 * costante_crescita;
    }
    if(livello >= 99 && livello <= 100){
        return 40 * costante_crescita;
    }
}

/**
 * Definisce il nuovo livello drivepass (e aggiornamento punti e livello)
 * @param {*} livello 
 * @param {*} punti 
 * @param {*} puntiDrivePass 
 */
function upLevel(livello, puntiDrivePass, costante_crescita){

    //Recupera quanti punti sono attualmente posseduti sul livello attuale
    for(let i=1; i<livello; i++){ 
        puntiDrivePass = puntiDrivePass - rangeLivello(i, costante_crescita); //Scala i punti già completati nei livelli precedenti del drivepass
    }

    console.log("puntiDrivePass", puntiDrivePass);


    let rangeCurrentLivello = rangeLivello(livello, costante_crescita); //recupera il range del livello attuale

    while(puntiDrivePass >= rangeCurrentLivello){ //Verifica se i punti attuali permettono di completare il range del livello attuale
        console.log("puntiDrivePass", puntiDrivePass, livello);
        puntiDrivePass = puntiDrivePass - rangeCurrentLivello; //decrementa i punti del rangeLivello attuale ai puntiDrivePass (PUNTI LIVELLO ATTUALE)
        livello ++; //Incrementa il livello (Livello compleato)
    }
    console.log("puntiDrivePass", puntiDrivePass);


    console.log("livello", livello);


    return {
        punti_livello_attuale : puntiDrivePass, //Punti su  livello attuale
        livello : livello //Nuovo livello attuale
    }

}

exports.getCurrentLevel = async(req,res,next) => {
    let idUtente = req.body.id_utente;
    let costante_crescita;

    //recupera punti drive pass e livello
    try{
        const[row, field]= await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
        puntiDrivePass = row[0].punti_drivepass;
        livello = row[0].livello;
    }
    catch(err){
        res.status(401).json({
            text : "impossibile recuperare il portafoglio dell'utente",
            error : err
        })
    }

    //Recupera costante crescita
    try{
        const[row, field] = await db.execute(queries.getCostanteCrescita, [idUtente]);
        costante_crescita = row[0].costante_crescita;
    }
    catch(err){
        res.status(401).json({
            text : "impossibile recuperare la costante crescita dell'utente",
            err : err
        })
    }

    var drivePass = upLevel(livello, puntiDrivePass, costante_crescita);

    //Calcolo range progress bar livello
    let range_livello_attuale = drivePass.punti_livello_attuale / rangeLivello(drivePass.livello, costante_crescita)

    res.status(201).json({
        //livello = drivePass.livello,
        //punti_livello_attuale = drivePass.punti_livello_attuale
        range_livello_attuale : range_livello_attuale
    })
}

/**
 * Verifica se ci sono livelli (premi drivepass) da riscattare
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.verificaRiscatto = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let portafoglio;
    let livelliDaRiscattare = [];

    try{
        const [row, field] = await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
        portafoglio = row[0];
    }
    catch(err){
        res.status(401).json({
            text : "impossibile recuperare i dati del portafoglio",
            err : err
        })
    }

    if(portafoglio.livello-1 > portafoglio.livello_riscattato){ //Verifica i livelli da riscattare
        for(let i = portafoglio.livello_riscattato+1 ; i < portafoglio.livello ; i++){
            const [row, field] = await db.execute(queries.getDrivePassByLivello, [i]); 
            livelliDaRiscattare.push(row[0]);//Salva livelli da riscattare
        }
    }
    else{
        livelliDaRiscattare = [];
    }

    res.status(201).json({
        livelli_da_riscattare : livelliDaRiscattare
    })
}


/**
 * riscatta premio 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.riscattaLivello = async (req,res,next) => {
    let idUtente = +req.body.id_utente;
    let idGarage = +req.body.id_garage;
    let livello = +req.body.livello;
    let livello_riscattato = +req.body.livello_riscattato;
    let livelliDaRiscattare = [];


     if(livello-1 > livello_riscattato){ //Verifica i livelli da riscattare
        for(let i = livello_riscattato+1 ; i < livello ; i++){
            try{
                const [row, field] = await db.execute(queries.getDrivePassByLivello, [i]); 
                livelliDaRiscattare.push(row[0]);//Salva livelli da riscattare
            }
            catch(err){
                res.status(401).json({
                    text : 'impossibile procedere al riscatto',
                    err : err
                })
            }

        }
    }
    else{
        livelliDaRiscattare = [];
    }

     //Riscatta ogni livello
     var riscatto = 0;
    await livelliDaRiscattare.forEach( async (item) => {
        console.log("Sto riscattando ", item);
        if(item.tipo_premio == 'acpoints'){
            try{await db.execute(queries.incrementPointPortafoglioByIdUtente, [+item.premio, idUtente])}
            catch(err){ 
                res.status(401).json({
                    text : "impossibile procedere al riscatto",
                    err : err
                })
            }
        }

        if(item.tipo_premio == 'tickets'){
            try{await db.execute(queries.incrementTicketPortafoglioByIdUtente, [+item.premio, idUtente])}
            catch(err){ 
                res.status(401).json({
                    text : "impossibile procedere al riscatto",
                    err : err
                })
            }
        }

        if(item.tipo_premio == 'auto'){
            const [row, field] = await db.execute(queries.getItemParcheggia, [idGarage, +item.premio]);
            console.log("AUTO ", row[0]);
            if(!row[0]){ //Se l'auto non è già disponibile viene aggiunta all'utente
                try{await db.execute(queries.insertIntoParcheggio, [idGarage, +item.premio, 1, 0])}
                catch(err){ 
                    res.status(401).json({
                        text : "impossibile procedere al riscatto",
                        err : err
                    })
                }
            }
        }

        if(item.tipo_premio == 'avatar'){
            const [row, field] = await db.execute(queries.getItemProfiloAvatar, [idGarage, +item.premio]);
            console.log("AUTO ", row[0]);
            if(!row[0]){ //Se l'auto non è già disponibile viene aggiunta all'utente
                try{await db.execute(queries.insertIntoProfiloavatar, [idGarage, +item.premio, 1, 0])}
                catch(err){ 
                    res.status(401).json({
                        text : "impossibile procedere al riscatto",
                        err : err
                    })
                }
            }
        }

        riscatto++;
    })
    console.log("riscatto " , riscatto)
    //Aggiornamento livelli riscattati
    await db.execute(queries.updateLivelloRiscattatoPortafoglioByIdUtente, [riscatto, idUtente]);

    
    res.status(201).json({
        livello_riscattato : livello_riscattato
    })
  

}