const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
 
const idAdmin = 0;
const inizio_stagione_drivePass = '2020-12-01'
const fine_stagione_drivePass = '2020-12-31'

exports.updateCostanteCrescita = async (req,res,next) => {
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

    //console.log("*** ", utenti);

    res.status(201).json({
        utenti : utenti,
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