const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
var format = require('date-format');



/**
 * Restituisce le sfide attive in cui la città dell'utente è coinvolto
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getSfida = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let cittaUtente = req.body.citta;
    let sfida;    
    let stato = "in corso";
    try{
        const [row, field] = await db.execute(queries.getSfidaAttivaByCitta, [cittaUtente, cittaUtente, stato]);
        sfida = row[0];
        console.log(sfida);
        if(sfida == undefined || sfida == null){
            res.status(201).json({
                sfida : 'non sono presenti sfide per la tua citta'
            })
        }
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare la sfida per questo utente',
            err : err
        })
    }

    let punteggio = await calcolaPunteggioSfida(sfida);
    console.log("*******", punteggio, sfida.id_sfida)
    try{
        const result = await db.execute(queries.updatePunteggioSfida, [+punteggio.punti_team1 , +punteggio.punti_team2, sfida.id_sfida ]);
        console.log("RESULT ", result);
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile aggiornare la sfida',
            err : err
        })
    }
    

    try{
        const [row, field] = await db.execute(queries.getSfidaAttivaByCitta, [cittaUtente, cittaUtente, stato]); //recupera la sfida aggiornata
        sfida = row[0];
        if(sfida == undefined || sfida == null){
            res.status(201).json({
                sfida : 'non sono presenti sfide per la tua citta'
            })
        }
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare la sfida per questo utente',
            err : err
        })
    }

    //Verifica che non partecipa già alla sfida
    let partecipa = false;
    try{
        const [row, field] = await db.execute(queries.getPartecipa, [idUtente, sfida.id_sfida]);
         if(row[0] != undefined || row[0] != null ){ //l'utente già partecipa alla sfida
            partecipa = true;
        }
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare i dati',
            err : err
        })
    }

    //Verifica che l'utente abbia partecipato alla sfida (ha effettuato almeno una sessione)
    let sessioni;
    let punti_utente = 0;
    try{
        const [rows, field] = await db.execute(queries.getSessioniByRangeData, [idUtente, sfida.data_inizio_sfida, sfida.data_fine_sfida]);
        if(rows != undefined || rows!= null || rows != []){
            sessioni = rows;
        }         
    }
    catch(err){
        console.log("err ", err)
    }
    //Calcola punteggio dell'utente
    if(sessioni.length > 0){ //Se ci sono sessioni durante la sfida allora l'utente ha diritto al premio
        flagPartecipato = true; //setta flag a true per riscattare il premio

        if(sfida.tipo_sfida =='Bonus' || sfida.tipo_sfida=='Malus') {
            for(let s of sessioni){
                if(sfida.tipo_sfida == 'Bonus'){
                    punti_utente += s.bonus;
                }
                else if(sfida.tipo_sfida =='Malus'){
                    punti_utente += s.malus;
                }
            }
        }
        else if(sfida.tipo_sfida =='PuntiDrivePass'){
            try{
                const [row,field] = await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
                punti_utente = rows[0].punti_drivepass;
            }
            catch(err){
                res.status(401).json({
                    text : 'impossibile recuperare portafoglio utente',
                    err : err
                })
            }
        }
    }

    //Se la città dell'utente è team2 scambia i valori tra team1 e team2 per rendere team1 quello dell'utente
    if(cittaUtente == sfida.team2){
        //Scambia nomi team
        sfida.team2 = sfida.team1;
        sfida.team1 = cittaUtente;
        
         //Scambia punti team
        let punti_t1 = sfida.punti_team1;
        sfida.punti_team1 = sfida.punti_team2;
        sfida.punti_team2 = punti_t1;
    }

    let sfidaArray = [];
    sfidaArray.push(sfida);


    res.status(201).json({
        sfida : sfidaArray,
        challenger : {
            partecipa : partecipa,
            punti_utente : punti_utente,
        }
    })
}

/**
 * Calcola punteggio sfida
 * @param {*} sfida 
 */
async function calcolaPunteggioSfida(sfida){
    let punti_team1 = 0;
    let punti_team2 = 0;


    if(sfida.tipo_sfida == 'PuntiDrivepass'){ //Recupera punti per la sfida PuntiDrivePass
        try{
            const [rows, field] = await db.execute(queries.getRisultatoSfidaPuntiDrivePass, [sfida.team1, sfida.team2]);
            
            if(rows[1] == undefined || rows[1] == null){ //Verifica se uno dei due team ha punteggio 0
                if(sfida.team1 == rows[0].citta){
                    punti_team1 = rows[0].punti;
                    punti_team2 = 0;
                }
                else{
                    punti_team1 = 0;
                    punti_team2 = rows[0].punti;
                }
            }
            else if(rows[0] != undefined && rows[0] != null && rows[1] != undefined && rows[1] != null){ // se entrambi i team hanno un punteggio > 0
                if(sfida.team1 == rows[0].citta){
                    punti_team1 = rows[0].punti;
                    punti_team2 = rows[1].punti;
                }
                else{
                    punti_team1 = rows[1].punti;
                    punti_team2 = rows[0].punti;

                }
            }
             
           // console.log(punti_team1, punti_team2)
        }
        catch(err){
            return {
                punti_team1 : 0,
                punti_team2 : 0
            }
        }
    }
    if(sfida.tipo_sfida == 'Bonus'){ //Recupera punteggio per la sfida "Bonus"
        try{
            const [rows, field] = await db.execute(queries.getRisultatoSfidaBonus, [sfida.team1, sfida.team2, sfida.data_inizio_sfida, sfida.data_fine_sfida]);
            
            if(rows[1] == undefined || rows[1] == null){
                if(sfida.team1 == rows[0].citta){
                    punti_team1 = rows[0].punti;
                    punti_team2 = 0;
                }
                else{
                    punti_team1 = 0;
                    punti_team2 = rows[0].punti;
                }
            }
            else if(rows[0] != undefined && rows[0] != null && rows[1] != undefined && rows[1] != null){
                if(sfida.team1 == rows[0].citta){
                    punti_team1 = rows[0].punti;
                    punti_team2 = rows[1].punti;
                }
                else{
                    punti_team1 = rows[1].punti;
                    punti_team2 = rows[0].punti;

                }
            }
            
            console.log("BONUS ",punti_team1, punti_team2)
        }
        catch(err){
            return {
                punti_team1 : 0,
                punti_team2 : 0
            }
        }
    }
    if(sfida.tipo_sfida == 'Malus'){ //Recupera punteggio per la sfida "Malus"
        try{
            const [rows, field] = await db.execute(queries.getRisultatoSfidaMalus, [sfida.team1, sfida.team2, sfida.data_inizio_sfida, sfida.data_fine_sfida]);
            
            if(rows[1] == undefined || rows[1] == null){
                if(sfida.team1 == rows[0].citta){
                    punti_team1 = rows[0].punti;
                    punti_team2 = 0;
                }
                else{
                    punti_team1 = 0;
                    punti_team2 = rows[0].punti;
                }
            }
            else if(rows[0] != undefined && rows[0] != null && rows[1] != undefined && rows[1] != null){
                if(sfida.team1 == rows[0].citta){
                    punti_team1 = rows[0].punti;
                    punti_team2 = rows[1].punti;
                }
                else{
                    punti_team1 = rows[1].punti;
                    punti_team2 = rows[0].punti;

                }
            }
            
            //console.log(punti_team1, punti_team2)
        }
        catch(err){
            return {
                punti_team1 : 0,
                punti_team2 : 0
            }
        }
    }

    
    return{
        punti_team1 : punti_team1,
        punti_team2 : punti_team2
    }
}

/**
 * L'utente si segna come partecipante alla sfida
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.partecipaSfida = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let idSfida = req.body.id_sfida;

    
    try{
        await db.execute(queries.insertPartecipa, [idUtente, idSfida]);

        res.status(201).json({
            text : 'utente aggiunto alla sfida'
        })
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile partecipare alla sfida',
            err : err 
        })
    }

}


/**
 * riscatto premio sfida
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.riscattoSfida = async (req,res,next) => {
    let idSfida = req.body.id_sfida;
    let idUtente = req.body.id_utente;
    let cittaUtente = req.body.citta;

    let sfida; 
    let sessioni;
    let flagPartecipato = false;
    let punti_utente = 0;
    let sfideDaRiscattare = [];

    //Verifica che ci siano sfide da riscattare
    try{
        const [rows, field] = await db.execute(queries.getPartecipaDaRiscattare, [idUtente]);
        for(let r of rows){
            sfideDaRiscattare.push(r.id_sfida);
        }
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile verificare se ci sono sfide da riscattare',
            err : err
        })
    }

    console.log(" Sfide da riscattare*** ", sfideDaRiscattare)
    idSfida = sfideDaRiscattare[0]; //Riscatta l'ultima sfida 
    try{ //recupera sfida da riscattare
        const [row, field] = await db.execute(queries.getSfidaById, [idSfida]);
        sfida = row[0];
    }
    catch(err){
        res.status(401).json({
            text : 'sfida non trovata ',
            err : err
        })
    }
    console.log(idUtente, sfida.data_inizio_sfida, sfida.data_fine_sfida)
 
    //Verifica che l'utente abbia partecipato alla sfida (ha effettuato almeno una sessione)
    try{
        const [rows, field] = await db.execute(queries.getSessioniByRangeData, [idUtente, sfida.data_inizio_sfida, sfida.data_fine_sfida]);
        if(rows != undefined || rows!= null || rows != []){
            sessioni = rows;
        }         
    }
    catch(err){
        console.log("err ", err)
    }

    if(sessioni.length > 0){ //Se ci sono sessioni durante la sfida allora l'utente ha diritto al premio
        flagPartecipato = true; //setta flag a true per riscattare il premio

        if(sfida.tipo_sfida =='Bonus' || sfida.tipo_sfida=='Malus') {
            for(let s of sessioni){
                if(sfida.tipo_sfida == 'Bonus'){
                    punti_utente += s.bonus;
                }
                else if(sfida.tipo_sfida =='Malus'){
                    punti_utente += s.malus;
                }
            }
        }
        else if(sfida.tipo_sfida =='PuntiDrivePass'){
            try{
                const [row,field] = await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
                punti_utente = rows[0].punti_drivepass;
            }
            catch(err){
                res.status(401).json({
                    text : 'impossibile recuperare portafoglio utente',
                    err : err
                })
            }
        }
    }

    
    //Verifica se la sfida è stata vinta dal team a cui appartiene l'utente
    if(flagPartecipato){
        if((cittaUtente == sfida.team1 && sfida.punti_team1 > sfida.punti_team2) || (cittaUtente == sfida.team2 && sfida.punti_team2 > sfida.punti_team1) ){ //Se il team dell'utente ha vinto la sfida
            if(sfida.tipo_premio == 'tickets' ){ //Aggiorna i tickets dell'utente
                try{
                    await db.execute(queries.incrementTicketPortafoglioByIdUtente, [sfida.premio, idUtente]);
                }
                catch(err){
                    res.status(401).json({
                        text : 'impossibile riscattare i tickets',
                        err : err
                    })
                }
            }
            else if(sfida.tipo_premio =='acpoints'){
                try{
                    await db.execute(queries.incrementPointPortafoglioByIdUtente, [sfida.premio, idUtente]);
                }
                catch(err){
                    res.status(401).json({
                        text : 'impossibile riscattare i points',
                        err : err
                    })
                }
            }  
        }
    }

    try{
        await db.execute(queries.updatePartecipa, [punti_utente, 1, idUtente, idSfida]); //Termina riscatto della sfida

        const [row, field] = await db.execute(queries.getSfidaById, [idSfida]); //recupera sfida aggiornata
        sfida = row[0];

        res.status(201).json({
            text : 'premio riscattato con successo',
            sfida_riscattata : sfida,
        })
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile riscattare il premio',
            err : err
        })
    }
}




exports.getAllSfide = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let sfideUtente;
    try{
        const [rows, field] = await db.execute(queries.getSfideByUtente, [idUtente]);
        console.log("***ROWS ", rows);
        if(rows != undefined || rows != null){
            sfideUtente = rows;
        }
    }
    catch(err){
        res.status(401).json({
            text : 'non sono state trovate sfide',
            err : err
        })
    }

    let vittoria = "";
    for(let sfida of sfideUtente){
        if(sfida.stato == 'terminato'){
            if(sfida.punti_team1 > sfida.punti_team2 ){
                if(sfida.tipo_sfida == 'Malus'){
                    vittoria = sfida.team2;
                }
                else{
                    vittoria = sfida.team1;
                }
            }
            else if(sfida.punti_team1 < sfida.punti_team2 ){
                if(sfida.tipo_sfida == 'Malus'){
                    vittoria = sfida.team1;
                }
                else{
                    vittoria = sfida.team2;
                }
            }
            else if(sfida.punti_team1 == sfida.punti_team2){
                vittoria = 'pareggio'
            }
        }
        sfida.vittoria = vittoria;
    }

    console.log("*** ", sfideUtente);
    res.status(201).json({
        sfide : sfideUtente
    })
}