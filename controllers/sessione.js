const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries')



exports.getPosizione = (req,res,next) => {
    var request = require("request")

    var lat = req.body.lat; //latitudine
    var lon = req.body.lon; //longitudine
    var around = '50.0' //precisione di calcolo della posizione (es: 50 metri vicino alle coordinate)
   
    
    console.log(lat, lon);

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

            let result = {
                hyghway : highway,
                maxspeed : maxspeed,
                name : name,
            }

            return result;
            
           /*  res.status(201).json({
               hyghway : highway,
               maxspeed : maxspeed,
               name : name,
             // all: body,
             // dati:  body.elements[0].tags
            }) */
        }
        else{
            res.status(401).json({
                error : 'dati non disponibili'
            })
        }
    })

}