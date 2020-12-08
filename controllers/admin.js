const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
var format = require('date-format');

const idAdmin = 90;
const inizio_stagione_drivePass = '2020-12-01'
const fine_stagione_drivePass = '2020-12-31'
const stagione = 1;


/**
 * Genera sfide tra città
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.generaSfide = async(req,res,next) => { console.log("IIIIIII");
    let tipoSfida = ['PuntiDrivepass', 'Bonus', 'Malus'];
    let tipoPremio = ['acpoints', 'tickets'];
    let acpointsPremi = [100, 150, 200, 250, 500];
    let ticketsPremi = [1, 2, 3, 4, 5];
    let descrizioneSfida = ['Vince il team che guadagna con più punti drivepass al termine della sfida', 'Vince il team che ottiene più punti bonus durante la sfida', 'Vince il team che ottiene meno malus durante la sfida'];
    let citta = [];

    let idUtente = req.body.id_utente;

    if(idUtente != idAdmin){
        return 0;
    }

    try{
        const[rows, field] = await db.execute(queries.getAllCitta);
        for(let row of rows){
            citta.push(row.citta);
        }
    }   
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare le citta',
            err : err
        })
    }
    console.log("ARRAY ", citta)

    if(citta.length % 2 != 0){ //Se l'array è dispari elimina una citta per generare le sfide a coppia
        index = Math.floor(Math.random() * citta.length);   //genera un elemento random da eliminare
        citta.splice(index, 1);   //elimina l'elemento in posizione index
    }

    
    let numeroSfide = citta.length/2; //Numero di sfide da creare
    for(let i = 0 ; i < numeroSfide ; i++){
        //console.log("iterazione i ", i , citta)
            let indexTeam1 = Math.floor(Math.random() * citta.length);   //genera un elemento random per selezionare il team1
            let team1 = citta[indexTeam1];
            await citta.splice(indexTeam1, 1);   //elimina l'elemento in posizione index (elimina team1 dall'array)
        
            let indexTeam2 = Math.floor(Math.random() * citta.length);   //genera un elemento random per selezionare il team2
            let team2 = citta[indexTeam2];
            await citta.splice(indexTeam2, 1);   //elimina l'elemento in posizione index (elimina team2 dall'array)

            indexSfida = Math.floor(Math.random() * tipoSfida.length);   //seleziona una sfida random
            let sfida = tipoSfida[indexSfida]; //indica la sfida per i due team
            let descrizione = descrizioneSfida[indexSfida]; //descrizione della sfida assegnata ai due team

        
             
            
            let data_inizio_sfida = format('yyyy-MM-dd', new Date());

            let data_fine_sfida =  new Date();
            data_fine_sfida.setDate(data_fine_sfida.getDate() + 7); //Setta data fine sfida a tra una settimana
            
            let stato = 'in corso';

            let indexTipoPremio = Math.floor(Math.random() * tipoPremio.length);   //genera un elemento random per selezionare il tipo premio
            let tipo_premio = tipoPremio[indexTipoPremio] //setta il tipo di premio per la sfida

            let premio = '';
            if(tipo_premio == 'acpoints'){
                let indexPremio = Math.floor(Math.random() * acpointsPremi.length);   //genera un elemento random per il premio in ACPOINTS
                premio = acpointsPremi[indexPremio];
            }
            else if(tipo_premio == 'tickets'){
                let indexPremio = Math.floor(Math.random() * ticketsPremi.length);   //genera un elemento random per il premio in Tickets
                premio = ticketsPremi[indexPremio];
            }

            
            try{
                await db.execute(queries.insertSfida, [team1, team2, sfida, descrizione, data_inizio_sfida, data_fine_sfida, stato, premio, tipo_premio, 0, 0]);
            }
            catch(err){
                res.status(401).json({
                    text : 'impossibile generare le sfide',
                    err : err
                })
            }
                //console.log("team1 , team2, sfida ", team1, team2, sfida, citta.length);
    }

    res.status(201).json({
        text : 'sfide create correttamente '
    })
}

/**
 * Aggiornamento costante crescita di tutti gli utenti
 */
exports.updateCostanteCrescita = async (req,res,next) => {
    let azione = "Aggiornamento costanti di crescita degli utenti";
    let idUtente = req.body.id_utente;

    if(idUtente != idAdmin){
        return 0;
    }

    let utenti; //Recupera tutti gli utenti
    try{
        const [rows, field] = await db.execute(queries.getAllUtenti, []);
        utenti = rows;
    }
    catch(err){
        res.status(401).json({
            text : ' impossibile recuperare gli utenti ',
            err : err
        })
    }


    for(let user of utenti){
        var stileDiGuida = '';
        let sessioni = [];
        let totaleKM = 0;
        let newCostante = '1';
        var tipo = 'Standard';
        let flagAggiornamento = false; //se flag = true effettuare aggiornamento, se flag = false nessun aggiornamento è richiesto
        try{
            const [row, field] = await db.execute(queries.getStileDiGuidaByIdUtente, [user.id_utente]); //Recupera stile di guida
            console.log("STILE DI GUIDA", row[0])
            if(row[0] != [] || row[0] != null || row[0] != undefined){
                console.log("STILE ",stileDiGuida)
                stileDiGuida = row[0];
                tipo = stileDiGuida.tipo;
                console.log("************STILE ",stileDiGuida)
            }
            else{
                return ;
            }
            
            const [rows, fields] = await db.execute(queries.getSessioniByRangeData, [user.id_utente, inizio_stagione_drivePass, fine_stagione_drivePass]); //Recupera tutte le sessioni dell'utente
            if(row[0] != [] || row[0] != null || row[0] != undefined){
                rows.forEach( r => {
                    sessioni.push(r);
                })
            }
            console.log("***SESSIONI ", sessioni)

            if(sessioni != [] || sessioni != null || sessioni != undefined){ //Verifica se ci sono sessioni per l'utente
                
                for(let s of sessioni){ //Somma i km percorsi in tutte le sessioni
                    totaleKM = totaleKM + s.km_percorsi.toFixed(1); 
                }
                console.log("**** TOTALE KM ", totaleKM);
                console.log("TOOOLLEERANZA  ", stileDiGuida.tolleranza_min)
                //Verifica costante crescita
                if(totaleKM >= stileDiGuida.tolleranza_min && totaleKM <= stileDiGuida.tolleranza_max){
                    //non fa nulla
                    flagAggiornamento = false;
                }
                else if(totaleKM > stileDiGuida.tolleranza_max){
                    //Diminuisce costante cresceta
                    if(stileDiGuida.costante_crescita == 1){
                        newCostante = 0.5;
                        tipo = 'Viaggiatore';
                        flagAggiornamento = true;
                    }
                    else if(stileDiGuida.costante_crescita == 2){
                        newCostante = 1;
                        tipo = 'Standard';
                        flagAggiornamento = true;
                    }
                }
                else if(totaleKM < stileDiGuida.tolleranza_min){
                    //Aumenta costante crescita
                    if(stileDiGuida.costante_crescita == 0.5){
                        newCostante = 1;
                        tipo = 'Standard';
                        flagAggiornamento = true;
                    }
                    else if(stileDiGuida.costante_crescita == 1){
                        newCostante = 2;
                        tipo = 'Salutista';
                        flagAggiornamento = true;
                    }
                }
                console.log("********AGGIORNAMENTO ", flagAggiornamento)
                if(flagAggiornamento){
                    updateResult = defineStileGuida(tipo);
                    console.log("UPDATE RESULT ",updateResult)
                    try{console.log("******QUERY UPDATE ", tipo, updateResult.media, newCostante, updateResult.tolleranza_min, updateResult.tolleranza_max, user.id_utente)
                        await db.execute(queries.updateStileDiGuida, [tipo, updateResult.media, newCostante, updateResult.tolleranzaMin, updateResult.tolleranzaMax, user.id_utente]);
                    }
                    catch(err){
                        console.log("err update ", err)
                        res.status(401).json({
                            text : ' aggiornamento non riuscito ' ,
                            err : err
                        })
                    }
                }
            }
        }
        catch(err){console.log(err)
            res.status(401).json({
                text : 'aggiornamento non riuscito ' ,
                err : err
            })
        }
    }


    //Aggiornamento tabella log azioni admin
    try{
        await db.execute(queries.insertLog, [idUtente, azione, new Date() ])
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile aggiornare il log',
            err : err
        })
    }
   

    res.status(201).json({
        utenti : utenti,
    })

}

/**
 * Aggiornamento livello di ogni utente nella tabella statistiche.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.updateStatisticheGamification = async (req,res,next) => {
    let azione = "Aggiornamento statistiche degli utenti per GamifiedDriving";
    let idUtente = req.body.id_utente;

    if(idUtente != idAdmin){
        return 0;
    }

    let portafoglio; //Recupera tutti gli utenti
    try{
        const [rows, field] = await db.execute(queries.getAllPortafoglio, []);
        portafoglio = rows;
    }
    catch(err){
        res.status(401).json({
            text : ' impossibile recuperare gli utenti ',
            err : err
        })
    }
 
    for(let p of portafoglio){
        try{
            await db.execute(queries.updateLivelloStatisticheGamification, [p.livello, p.id_utente])
        }
        catch(err){
            res.status(401).json({
                text : "impossibile effettuare l'aggiornamento",
                err : err
            })
        }
    
    }

    //Aggiornamento tabella log azioni admin
    try{
        await db.execute(queries.insertLog, [idUtente, azione, new Date() ])
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile aggiornare il log',
            err : err
        })
    }

    res.status(201).json({
        text : 'aggiornamento completato '
    })

}

/**
 * Aggiornamento storico drivepass degli utenti
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.updateStoricoDrivepass = async (req,res,next) => {
    let azione = "Aggiornamento storico drivepass degli utenti";
    let idUtente = req.body.id_utente;

    if(idUtente != idAdmin){
        return 0;
    }

    let portafoglio; //Recupera tutti gli utenti
    try{
        const [rows, field] = await db.execute(queries.getAllPortafoglio, []);
        portafoglio = rows;
    }
    catch(err){
        res.status(401).json({
            text : ' impossibile recuperare gli utenti ',
            err : err
        })
    }
 
    for(let p of portafoglio){
        try{
            await db.execute(queries.updateStoricoDrivepass, [p.livello, p.punti_drivepass, p.id_utente, stagione])
        }
        catch(err){
            res.status(401).json({
                text : "impossibile effettuare l'aggiornamento",
                err : err
            })
        }
    
    }

    //Aggiornamento tabella log azioni admin
    try{
        await db.execute(queries.insertLog, [idUtente, azione, new Date() ])
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile aggiornare il log',
            err : err
        })
    }

    res.status(201).json({
        text : 'aggiornamento completato '
    })

}

/**
 * Aggiornamento portafoglio utente admin
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.updateMyPortafoglio = async (req,res,next) => {
    let azione = "Aggionamento dati portafoglio utente di test ";
    let idUtente = req.body.id_utente;
    let acpoints = req.body.acpoints;
    let tickets = req.body.tickets;
    let livello = req.body.livello;

    if(idUtente != idAdmin){
        return 0;
    }

    try{
        console.log("acpoints ", acpoints)
        if(acpoints != null || acpoints != undefined){
             await db.execute(queries.updatePointPortafoglioByIdUtente, [acpoints, idUtente]);
        }

        if(tickets != null || tickets != undefined){
            await db.execute(queries.updateTicketPortafoglioByIdUtente, [tickets, idUtente])
        }

        if(livello != null || livello != undefined){
            await db.execute(queries.updateLivelloPortafoglio, [livello, idUtente])
        }
     
    }
    catch(err){
        res.status(401).json({
            text : " impossibile effettuare l'aggiornamento" ,
            err : err
        })
    }

    let portafoglio;
    try{
        const [row, field] = await db.execute(queries.getPortafoglioByIdUtente , [idUtente]);
        portafoglio = row[0];
    }
    catch(err){
        res.status(401).json({
            text :  " impossibile effettuare l'aggiornamento" ,
            err : err
        })
    }

    //Aggiornamento tabella log azioni admin
    try{
        await db.execute(queries.insertLog, [idUtente, azione, new Date() ])
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile aggiornare il log',
            err : err
        })
    }

    res.status(201).json({
        portafoglio : portafoglio
    })

}

/**
 * Definizione dello stile di guida sulla base del tipo di utente (tutti i valori sono stati convertiti da settimanale in mensile)
 * @param {*} tipo 
 */
function defineStileGuida(tipo){
    if(tipo==='Viaggiatore'){
        return {
            media : 880,
            costanteCrescita : 0.5,
            tolleranzaMin : 720,
            tolleranzaMax : 1200,
        }
        
    }
    else if(tipo==='Standard'){
        return{
            media : 600,
            costanteCrescita : 1,
            tolleranzaMin : 480,
            tolleranzaMax : 720,
        }
    }
    else if(tipo==='Salutista'){
        return{
            media : 400,
            costanteCrescita : 2,
            tolleranzaMin : 0,
            tolleranzaMax : 480,   
        } 
    }
 }