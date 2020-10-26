const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries')


exports.endSession = async (req,res,next) =>{

}


/**
 * Create e insert new Session nel database
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.startSession = async (req,res,next) => {
    let id_utente = req.body.id_utente;

    db.execute(queries.createSession, [0,0,0,0,id_utente])
    .then( (result) => {
        res.status(201).json({
            id_sessione : result[0].insertId
        })
    })
    .catch( (err) => {
        res.status(401).json({
            err : err
        })
    })
}

/**
 * Update Session
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.updateSession = async (req,res,next) => {
    let id_sessione = req.body.id_sessione;
    let id_utente = req.body.id_utente;
    let km_percorsi = req.body.distance;
    let timer_speed_limit = req.body.timer_speed_limit;
    let timer = getTime(req.body.timer);
    let health =  req.body.health;
    let timeGoodDriving;
    let bonus;
    let point;
    const timerUpdate = 5;
    //Calcolo del malus
    let malus = (100 - health)/10;

/*  console.log("id sessione ", id_sessione);
    console.log("id utente ", id_utente);
    console.log("km percorsi ", km_percorsi);
    console.log("timer speed limit ", timer_speed_limit);
    console.log("timer ", timer);
    console.log("health ", health);

 */

    if(timer_speed_limit[0]){ //Verifica se è stata commessa almeno un infrazione
        timerFirstSpeedLimit = getTime(timer_speed_limit[0]); // conversione getTime
        let timeStart = timer.minuti - 5; //Calcolo tempo di partenza dello slot della sessione
        timeGoodDriving = timerFirstSpeedLimit.minuti - timeStart; //calcolo tempo di guida corretta (In minuti, perchè il controllo si effettua ogni 5 minuti)
        point = timeGoodDriving; //point calcolati sul tempo di guida corretta
        bonus = 0; //nessun bonus aggiuntivo per questo slot
    }
    else{ //Non sono state commesse infrazioni
        bonus = 1;
        point = timerUpdate; //Setta punti 
    }

    //console.log("TEMPO OK, ", timeGoodDriving);
    point = (point * health)/100; //Punti

    try{
        const result = await db.execute(queries.updateSession, [req.body.timer, km_percorsi, bonus, malus, id_sessione, id_utente ]);
    }
    catch(err){
        res.status(401).json({
            message : err
        })
    }

    res.status(201).json({
        message : "Update sessione"
    })
}


function getTime(timer){
    let ore = +timer.split(":")[0];
    let minuti = +timer.split(":")[1];
    let secondi = +timer.split(":")[2];

    return {
        ore : ore,
        minuti : minuti,
        secondi : secondi
    }
    
}

/**
 * Calcola velocità da punto A a punto B (A è il punto iniziale, B è il punto di arrivo)
 * @param {*} latA //Latitudine punto A (precedente)
 * @param {*} lonA //longitudine punto A (precedente)
 * @param {*} latB //latitudine punto B (attuale)
 * @param {*} lonB //longitudine punto B (attuale)
 */
function getMySpeed(latA, lonA, latB, lonB){
    let distance;
    const R = 6371; //raggio terrestre
    const pi = 3.1415926535;
    const time = 20; //Tempo di ricalcolo 

    //Conversione coordinate in radianti
    let minlon = parseFloat(lonA)*2*pi/360;
    let maxlon = parseFloat(lonB)*2*pi/360;
    let minlat = parseFloat(latA)*2*pi/360;
    let maxlat = parseFloat(latB)*2*pi/360;
    
    distance = Math.acos(Math.sin(minlat)*Math.sin(maxlat)+Math.cos(minlat)*Math.cos(maxlat)*Math.cos(maxlon-minlon))*R; //Calcolo della distanza

    console.log("distanza", distance.toFixed(3) +" km")


    var speed = ((distance/time)*(3600)); //Calcolo velocità e conversione in mk/h

    console.log("velocità ", speed.toFixed(0)+" km/h" ) //in km/h


    return {
        speed: speed.toFixed(0),
        distance : distance.toFixed(3),
    }
}



/**
 * Recupera posizione attuale e informazioni relative alla velocità
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getPosizione = (req,res,next) => {
    var request = require("request")

    var latA = req.body.latA; //latitudine A
    var lonA = req.body.lonA; //longitudine A
    var latB = req.body.latB; //latitudine A
    var lonB = req.body.lonB; //longitudine A

    var around = '50.0' //precisione di calcolo della posizione (es: 50 metri vicino alle coordinate)
   
    
  

//Test velocità  
    var speedObject = getMySpeed(latA, lonA, latB, lonB);
  
  //Test velocità


    var url = `http://overpass-api.de/api/interpreter?data=[out:json][timeout:25];%20(%20way(around:${around},${latB},${lonB});%20);%20out%20body;%20%3E;%20out%20skel%20qt;`

    request({ url: url, json: true}, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            console.log(body.elements[0].tags) // Print the json response

            let highway = body.elements[0].tags.highway; //Tipo strada
            let maxspeed = body.elements[0].tags.maxspeed;  //velocità max sulla strada
            let name = body.elements[0].tags.name;  //nome strada
            console.log(body);

            //Verifica la disponibilità dei dati, altrimenti setta i valori di default
            if(!body.elements[0].tags.highway){
                highway = 'Unclassified'
            }
            if(!body.elements[0].tags.maxspeed){
                maxspeed = 50
            }
            if(!body.elements[0].tags.name){
                if(body.elements[0].tags.ref){
                    name = body.elements[0].tags.ref;
                }
                else{
                    name = highway
                }
            }

            res.status(201).json({
               hyghway : highway,
               maxspeed : maxspeed,
               name : name,
               speed : speedObject.speed,
               distance : +speedObject.distance
             // all: body,
             // dati:  body.elements[0].tags
            })
        }
        else{
            res.status(401).json({
                error : 'dati non disponibili'
            })
        }
    })
}