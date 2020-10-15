const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries')



exports.getPosizione = (req,res,next) => {
    var request = require("request")

    var lat = req.body.lat;
    var lon = req.body.lon;


    var url = `http://overpass-api.de/api/interpreter?data=[out:json][timeout:25];%20(%20way(around:5.0,${lat},${lon});%20);%20out%20body;%20%3E;%20out%20skel%20qt;`

    request({ url: url, json: true}, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            console.log(body.elements[0].tags) // Print the json response
            res.status(201).json({
               dati:  body.elements[0].tags
            })
        }
        else{
            res.status(401).json({
                error : 'dati non disponibili'
            })
        }
    })
    
}