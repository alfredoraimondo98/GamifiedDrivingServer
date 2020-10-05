const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();


exports.getDrivepass = async (req,res,next) => {
    let stagione = 1;
    let dp;
    var drivePassView = [];
    try{
        const [row, fields] = await db.execute('SELECT * FROM drivepass WHERE stagione = ?', [stagione]);
        dp = row;
    }
    catch(err){
        res.status(401).json({
            message : err
        })
    }

    
    var i = 0;
 
    dp.forEach( async (item) => {
        if(item.tipo_premio === 'auto'){
            let auto;
            try{
                const [row, field] = await db.execute('SELECT * FROM auto WHERE idauto = ?', [item.premio]);
                auto = row[0]; 
            }
            catch(err){
                console.log("err");
            }


            let premioauto = {
                stagione : item.stagione,
                livello : item.livello,
                premio : item.premio,
                tipo_premio : item.tipo_premio,
                nome : auto.nome,
                rarita : auto.rarita,
                img : auto.img,
                colore : auto.colore
            }
            console.log(premioauto);
            drivePassView.push(premioauto);   
        }
       
    
    

        if(item.tipo_premio === 'avatar'){
            let avatar;
            try{
                const [row, field] = db.execute('SELECT * FROM avatar WHERE idavatar = ?', [item.premio]);
                avatar = row[0]; 
            }
            catch(err){
                console.log("err");
            }

            drivePassView.push({
                stagione : item.stagione,
                livello : item.livello,
                premio : item.premio,
                tipo_premio : item.tipo_premio,
                nome : auto.nome,
                img : auto.img,
            })
            
        }

        if(item.tipo_premio === 'acpoints'){
            //premio corrisponde al valore di acpoints del premio
            drivePassView.push(item);
        }

        if(item.tipo_premio === 'tickets'){
            drivePassView.push(item);
        } 
    })

   
     
    res.status(201).json({
        drivePassView : drivePassView
    })
   
}