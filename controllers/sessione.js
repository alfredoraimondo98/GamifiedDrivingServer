const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries')
//Variabili globali per la posizione di partenza (Da settare all'avvio della sessione di guida)
var latA = 40.73916;
var lonA = 15.20591;

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

    console.log("velocità ", speed.toFixed(2)+" km/h" ) //in km/h

    //Aggiornamento coordinate punto di partenza per il prossimo calcolo
    latA=latB;
    lonA=lonB;

    return speed;
}



/**
 * Recupera posizione attuale e informazioni relative alla velocità
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getPosizione = (req,res,next) => {
    var request = require("request")

    var lat = req.body.lat; //latitudine
    var lon = req.body.lon; //longitudine
    var around = '50.0' //precisione di calcolo della posizione (es: 50 metri vicino alle coordinate)
   
    console.log(lat, lon);
    var speed;
//Test velocità
   
    var latB = 40.74019;
    var lonB = 15.20792;
    speed = getMySpeed(latA, lonA, latB, lonB);
    console.log("MySpeed ", speed);
  //Test velocità


    var url = `http://overpass-api.de/api/interpreter?data=[out:json][timeout:25];%20(%20way(around:${around},${lat},${lon});%20);%20out%20body;%20%3E;%20out%20skel%20qt;`

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
               speed : speed,
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