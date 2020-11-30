const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
var format = require('date-format');

exports.generateSfide = async(req,res,next) => {
    let tipoSfida = ['PuntiDrivepass', 'Bonus', 'Malus'];
    let tipoPremio = ['acpoints', 'tickets'];
    let acpointsPremi = [100, 150, 200, 250, 500];
    let ticketsPremi = [1, 2, 3, 4, 5];
    let descrizioneSfida = ['Vince il team che guadagna con più punti drivepass al termine della sfida', 'Vince il team che ottiene più punti bonus durante la sfida', 'Vince il team che ottiene meno malus durante la sfida'];
    let citta = [];
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

exports.getSfida = async (req,res,next) => {
    let cittaUtente = req.body.citta;
    let sfida;

    try{
        const [row, field] = await db.execute(queries.getSfidaByCitta, [cittaUtente, cittaUtente]);
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
        const [row, field] = await db.execute(queries.getSfidaByCitta, [cittaUtente, cittaUtente]); //recupera la sfida aggiornata
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
    res.status(201).json({
        sfida : sfida
    })
}


async function calcolaPunteggioSfida(sfida){
    let punti_team1 = 0;
    let punti_team2 = 0;


    if(sfida.tipo_sfida == 'PuntiDrivepass'){ //Recupera punti per la sfida PuntiDrivePass
        try{

            const [rows, field] = await db.execute(queries.getRisultatoSfidaPuntiDrivePass, [sfida.team1, sfida.team2]);
            
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