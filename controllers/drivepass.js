const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');


exports.getDrivepass = async (req,res,next) => {
    let stagione = 1;
    let dp;
    var drivePass = [];

    //get Drivepass stagione 1
    try{
        const [row, fields] = await db.execute(queries.getDrivePassByStagione, [stagione]);
        dp = row;
    }
    catch(err){
        res.status(401).json({
            message : err
        })
    }



    var promiseDP = [];
 

    dp.forEach( async (item) => {

        var promise = new Promise( async function(resolve, reject) {
            if(item.tipo_premio === 'auto'){
                let auto;
                try{
                    const [row, field] = await db.execute(queries.getAutoById, [item.premio]);
                    auto = row[0]; 
                }
                catch(err){
                    res.status(401).json({
                        message : err
                    })
                }


             let premioAuto = {
                    stagione : item.stagione,
                    livello : item.livello,
                    premio : item.premio,
                    tipo_premio : item.tipo_premio,
                    nome : auto.nome,
                    rarita : auto.rarita,
                    img : auto.img,
                    colore : auto.colore
                }
                drivePass.push(premioAuto);   
            }
        
        
            if(item.tipo_premio === 'avatar'){
                let avatar;
                try{
                    const [row, field] = await db.execute(queries.getAvatarById, [item.premio]);
                    avatar = row[0]; 
                }
                catch(err){
                    res.status(401).json({
                        message : err
                    })
                }

                let premioAvatar = {
                    stagione : item.stagione,
                    livello : item.livello,
                    premio : item.premio,
                    tipo_premio : item.tipo_premio,
                    nome : avatar.nome,
                    img : avatar.img,
                }

                drivePass.push(premioAvatar); 
            }


            if(item.tipo_premio === 'acpoints'){
                //premio corrisponde al valore di acpoints del premio
                drivePass.push(item);
            }


            if(item.tipo_premio === 'tickets'){
                drivePass.push(item);
            } 

            resolve(drivePass);
            return promise;
        }) 

        promiseDP.push(promise);
    })


    const resultDrivePass = await Promise.all(promiseDP);
 
    //Ordinamento livelli (punti_drivepass)
    drivePass.sort(function(a, b) {
        var livelloA = a.livello;
        var livelloB = b.livello;
        if (livelloA < livelloB) return -1;
        if (livelloA > livelloB) return 1;
        return 0;
    });

    
     
    res.status(201).json({
        drivePass : drivePass
    })
   
}