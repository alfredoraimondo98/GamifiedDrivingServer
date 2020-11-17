const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries')

/**
 * Punti del range livello
 * @param {*} livello 
 */
function rangeLivello(livello){
    if(livello >= 1 && livello <= 15){
        return 10
    }
    if(livello >= 16 && livello <= 30){
        return 15
    }
    if(livello >= 31 && livello <= 49){
        return 20
    }
    if(livello >= 50 && livello <= 65){
        return 25
    }
    if(livello >= 66 && livello <= 79){
        return 30
    }
    if(livello >= 80 && livello <= 95){
        return 35
    }
    if(livello >= 96 && livello <= 98){
        return 38
    }
    if(livello >= 99 && livello <= 100){
        return 40
    }
}

/**
 * Definisce il nuovo livello drivepass (e aggiornamento punti e livello)
 * @param {*} livello 
 * @param {*} punti 
 * @param {*} puntiDrivePass 
 */
function upLevel(livello, punti, puntiDrivePass){

    //Recupera quanti punti sono attualmente posseduti sul livello attuale
    for(let i=1; i<livello; i++){ 
        puntiDrivePass = puntiDrivePass - rangeLivello(i); //Scala i punti già completati nei livelli precedenti del drivepass
    }

    console.log("puntiDrivePass", puntiDrivePass);

    puntiDrivePass = puntiDrivePass + punti; //somma i punti di bonus al drive pass
    console.log("puntiDrivePass", puntiDrivePass);

    let rangeCurrentLivello = rangeLivello(livello); //recupera il range del livello attuale

    while(puntiDrivePass >= rangeCurrentLivello){ //Verifica se i punti attuali permettono di completare il range del livello attuale
        console.log("puntiDrivePass", puntiDrivePass, livello);
        puntiDrivePass = puntiDrivePass - rangeCurrentLivello; //decrementa i punti del rangeLivello attuale ai puntiDrivePass
        livello ++; //Incrementa il livello (Livello compleato)
    }
    console.log("puntiDrivePass", puntiDrivePass);


    console.log("livello", livello);


    return {
        puntiGuadagnati : puntiDrivePass, //Punti guadagnati su nuovo livello attuale
        nuovoLivello : livello //Nuovo livello attuale
    }
}

/**
 * Termina sessione di guida e calcola puntaggia finale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.endSession = async (req,res,next) =>{
    let idUtente = req.body.id_utente;
    let idSessione = req.body.id_sessione;

    let puntiDrivePass;
    let livello;
    let costanteCrescita;
    let punti;

    //recupera punti sessione
    try{
        const[row, field]= await db.execute(queries.getSessioneById, [idSessione, idUtente]);
        punti = row[0].bonus;
    }
    catch(err){
        res.status(401).json({
            error : err
        })
    }


    //recupera punti drive pass e livello
    try{
        const[row, field]= await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
        puntiDrivePass = row[0].punti_drivepass;
        livello = row[0].livello;
    }
    catch(err){
        res.status(401).json({
            error : err
        })
    }


    //recupera costante di crescita utente
    try{
        const[row, field]= await db.execute(queries.getCostanteCrescita, [idUtente]);
        costanteCrescita = row[0].costante_crescita;
    }
    catch(err){
        res.status(401).json({
            error : err
        })
    }

    console.log("costante",costanteCrescita)
    punti = punti * +costanteCrescita; //Normalizza punti guardagnati sulla base della costante crescita

    let newLevel = upLevel(+livello, +punti, +puntiDrivePass); //Aggiorna livello

    newPuntiDrivePass = puntiDrivePass + punti; //nuovi punti drive pass

    //Aggiornamento portafoglio e statisticheGamification (livello)
    try{
        const result = await db.execute(queries.updateDrivePassPortafoglio, [punti, newLevel.nuovoLivello, newPuntiDrivePass, idUtente ] );
        await db.execute(queries.updateLivelloStatisticheGamification,[newLevel.nuovoLivello, idUtente]);
    }
    catch(err){
        res.status(401).json({
            error : err
        })
    }

    
    res.status(201).json({
        score : {
                punti_guadagnati : newLevel.puntiGuadagnati,
                nuovo_livello : newLevel.nuovoLivello,
                nuovi_punti_drivepass : newPuntiDrivePass
            }
    })
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
    let ctr_velocita_costante = req.body.ctr_velocita_costante;
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

    if(timer_speed_limit[0] && (timer.minuti >= 5 || timer.ore >= 1)){ //Verifica se è stata commessa almeno un infrazione
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
    point = (point * health)/100; //Punti (corrisponde a bonus del db)

    //verifica se è stata mantenuta la velocità costante per 10 secondi riceve un punto bonus
    if(ctr_velocita_costante >= 10 ){
        bonus = bonus + 1;
        ctr_velocita_costante = 0; //se ctr_velocita_costante raggiunge 10 viene resetteta a zero
    }


    try{
        const result = await db.execute(queries.updateSession, [req.body.timer, km_percorsi, point, malus, id_sessione, id_utente ]);
    }
    catch(err){
        res.status(401).json({
            message : err
        })
    }

    res.status(201).json({
        message : "Update sessione",
        ctr_velocita_costante : +ctr_velocita_costante
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

    if(speed == null){
        speed = 0;
    }

    return {
        speed: speed.toFixed(0),
        distance : distance.toFixed(3),
    }
}

/**
 * Verifica velocità costante
 * @param {*} speed 
 * @param {*} ctr_velocita_costante 
 */
function velocitaCostante(speed, ctr_velocita_costante){
    let velocita = [];
    if(speed.length < 5){ //Se l'array di speed contiene meno di 5 elementi considera tutti gli elementi presenti
        speed.forEach( (item) => {
            velocita.push(item);
        })
    }
    else{
        let j = speed.length - 1; //indice j corrispondente all'ultimo elemento dell'array Speed
    
        for(let i=0 ; i < 5; i++){ //preleva 5 elementi
            velocita.push(speed[j]); //inserisce gli ultimi 5 elementi di speed in velocita
            j--; 
        }
    }

    //Calcola range
    let velMin = velocita[0];//velocità minima iniziale
    let velMax = velocita[0];//velocità massima iniziale



    //Calcola velocità minima/massima
    velocita.forEach( (item) =>{
        if(item < velMin){ //Calcolo minimo
            velMin = item;
        }
        if(item > velMax){ //calcolo massimo
            velMax = item; 
        }
    })

    //Verifica se la velocità mantenuta risulta costante
    if( (velMax - velMin) > 20 ){
        flagVelocitaCostante = false; //velocità costante non rispettata
        ctr_velocita_costante = 0; //Resetta contatore velocità costante
    }
    else{
        flagVelocitaCostante = true;
        ctr_velocita_costante = ctr_velocita_costante + 1;
    }

    return {
        flagVelocitaCostante : flagVelocitaCostante,
        ctr_velocita_costante : ctr_velocita_costante
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
    var speed = req.body.speed; //Array delle velocità dell'utente
    var ctr_velocita_costante = req.body.ctr_velocita_costante; //costante velocità costante

    var around = '50.0' //precisione di calcolo della posizione (es: 50 metri vicino alle coordinate)
    
    
   var velocitaCostanteResult = velocitaCostante(speed, ctr_velocita_costante);

//Test velocità  
    var speedObject = getMySpeed(latA, lonA, latB, lonB);
  
  //Test velocità


    var url = `http://overpass-api.de/api/interpreter?data=[out:json][timeout:25];%20(%20way(around:${around},${latB},${lonB});%20);%20out%20body;%20%3E;%20out%20skel%20qt;`
    

    request({ url: url, json: true}, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            console.log(body.elements[0].tags) // Print the json response

            let idWay = body.elements[0].id; //Id nodo strada
            let highway = body.elements[0].tags.highway; //Tipo strada
            let maxspeed = body.elements[0].tags.maxspeed;  //velocità max sulla strada
            let name = body.elements[0].tags.name;  //nome strada
            let access = body.elements[0].tags.access; //access strada
            let stop = ""; //stop

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
            if(body.elements[0].tags.access){
                if(access === 'no' || access ==='private'){
                    access = "ztl"
                }
                else{
                    access = ""
                }
            }

            //url query id node per verificare se sono presenti elementi stop.
            var urlIdWay = `http://overpass-api.de/api/interpreter?data=[out:json][timeout:25];way(${idWay})(._;>;);%20out%20body;%20%3E;%20out%20skel%20qt;`

            request({ url: urlIdWay, json: true}, (error, response, body) => {
                if (!error && response.statusCode === 200) {
                    body.elements.forEach( (item) => {
                        if(item.tags.highway == 'give_way'){
                            stop = "stop";
                        }
                    })
                }
            });

            console.log("Acc", access);
            console.log("VelocitaResponse", velocitaCostanteResult)
            res.status(201).json({
               hyghway : highway,
               maxspeed : +maxspeed,
               name : name,
               speed : +speedObject.speed,
               distance : +speedObject.distance,
               ztl : access,
               stop : stop,
               velocita_costante : velocitaCostanteResult.flagVelocitaCostante,
               ctr_velocita_costante : velocitaCostanteResult.ctr_velocita_costante
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

/**
 * getAuto by Id
 */
exports.getAutoPredefinita = async (req,res,next) => {
    var idAuto = req.body.id_auto;

    let auto;
    try{
        const [row, field] = await db.execute(queries.getAutoById, [idAuto]);
        auto = row[0];
    }
    catch(err){
        res.status(401).json({
            error : err
        })
    }

    res.status(201).json({
        auto : auto
    })

}