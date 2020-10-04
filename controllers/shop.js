const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();


exports.buyWithTickets = async (req,res,next) => {
    idutente = req.body.id;
    costo = req.body.costo; //costo ticket;

    let updateTicket
    try{
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE idutente = ?', [idutente]);
        if(row[0].ticket >= costo){
            updateTicket = row[0].ticket - costo;
        }
        else{
            res.status(401).json({
                message : 'Tickets insufficienti'
            })
        }
    }
    catch(err){
        console.log(err);
        return err;
    }

    try{
        const [row, field] = await db.execute('UPDATE portafoglio SET ticket = ? WHERE idutente = ?', [updateTicket, idutente])
    }
    catch(err){
        console.log(err);
        return err;
    }

    res.status(201).json({
        message : 'Acquisto completato'
    })
}

exports.buyWithPoints = async (req,res,next) => {
    idutente = req.body.id;
    costo = req.body.costo; //costo ticket;

    let updatePoint
    try{
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE idutente = ?', [idutente]);
        if(row[0].ticket >= costo){
            updatePoint = row[0].acpoint - costo;
        }
        else{
            res.status(401).json({
                message : 'Points insufficienti'
            })
        }
    }
    catch(err){
        console.log(err);
        return err;
    }

    try{
        const [row, field] = await db.execute('UPDATE portafoglio SET acpoint = ? WHERE idutente = ?', [updatePoint, idutente])
    }
    catch(err){
        console.log(err);
        return err;
    }

    res.status(201).json({
        message : 'Acquisto completato'
    })
}