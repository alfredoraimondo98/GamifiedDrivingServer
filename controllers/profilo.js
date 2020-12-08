const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();
const queries = require('../utils/queries');
const { promise } = require('../utils/connection');

/**
 * Recupera dati da visualizzare sulla home del profilo
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getProfilo = async (req,res,next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({
            message: 'Errore input Parametri',
            error: errors.array()
        });
    }

    idUtente = req.body.id_utente;
   
    let numeroSessioniGuide;
    let portafoglio

   try{
    const [row, fields] = await db.execute('SELECT count(*) as NumeroSessioni FROM sessione WHERE id_utente = ?', [idUtente]);
    console.log("numero guide", row[0]);
    numeroSessioniGuide = row[0].NumeroSessioni;
   }
   catch(err) {
       console.log(err);
       res.status(401).json({
           message : err
       })
   }

   try{
      portafoglio = await getPortafoglioByIdUtente(idUtente);
        if(!portafoglio){
            res.status(401).json({
                text : "impossibile recuperare il portafoglio dell'utente",
                err : err
            })
        }
   }
   catch(err){
       res.status(401).json({
           message : err
       })
   }

   //getPosizione dell'utente in classifica globale
   let classificaGlobale;
   let i = 0;
   let position;
    try{
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM utente JOIN portafoglio 
                                                ON utente.id_utente = portafoglio.id_utente 
                                            ORDER BY punti_drivepass DESC
                                                `);
        classificaGlobale = rows;
    }
    catch(err){
        res.status(401).json({
            text : "impossibile recuperare la classifica",
            err : err

        })
    } 
    classificaGlobale.forEach( (user) => {
        if(user.id_utente === idUtente){
            position = i+1;
        }
        i++;
    })

    
  
   res.status(201).json({
       totale_sessioni : numeroSessioniGuide,
       posizione : position
   })
}

/**
 * restituisce portafoglio di idUtente
 * @param {*} idUtente 
 */
async function getPortafoglioByIdUtente(idUtente) {        
    //console.log("cerco questo ", idUtente);
    let portafoglio;
    try{
        const [row, fields] = await db.execute(queries.getPortafoglioByIdUtente, [idUtente]);
        if(!row[0]){
            return false;
        }
        portafoglio = row[0];
    }
    catch(err) {
        return err
    }
    return portafoglio;
}




/**
 * recupera tutte le auto parcheggiate nel garage di un dato utente (id)
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getGarage = async (req,res,next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({
            message: 'Errore input Parametri',
            error: errors.array()
        });
    }

    let idGarage = req.body.id_garage;
   
    let parcheggio = [];
    let allAuto = [];
    
    parcheggio = await getParcheggioByIdGarage(idGarage); //Tutte le auto sbloccate dell'utente
     
    try{
        const [rows, field] = await db.execute(queries.getAllAuto); //Recupera tutte le auto
        allAuto = rows;
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare auto',
            err : err
        })
    }

  

    //Recupera le auto locked per l'utente
    let autoLocked = allAuto.filter( (item) => {
        let bool = false;
        parcheggio.forEach( (a) => {
            if(a.id_auto === item.id_auto){
                bool = true;
            }
        })
        if(!bool){
            return item;
        }
    })

    //Formatta le auto locked per la risposta
    let autoLockedFormatted = [];
    autoLocked.forEach( (item) => {
        auto = {
            id_auto : item.id_auto,
            nome : item.nome,
            rarita : item.rarita.toLowerCase(),
            img : item.img,
            img_sessione : item.img_sessione,
            colore : item.colore,
            costo : item.costo,
            predefinito : 0,
            disponibilita : 0
        };
        //console.log("AUTO FORMATTED", auto)
        autoLockedFormatted.push(auto);
    })

    
    garage = parcheggio.concat(autoLockedFormatted); //Concatena le auto locked e unlocked

    //Inserisce in posizione 0 dell'array l'auto predefinita
    let el;
    garage.forEach( (item) => {
        if( item.predefinito === 1 ){
            el = garage.splice(garage.indexOf(item),1);
         }
     })
 
    garage.splice(0, 0, el[0]);
    
    
    res.status(201).json({
        parcheggio : garage
    })
}


/**
 * recupera auto parcheggiate in un dato garage
 * @param {*} idGarage 
 */
async function getParcheggioByIdGarage(idGarage){
    try{
        const [rows, field] = await db.execute(queries.getParcheggioByIdGarage, [idGarage]);
        parcheggio = rows;
        //console.log(parcheggio);
    }
    catch(err){
       return err;
    }
    return parcheggio;
}

/**
 * Settare l'auto predefinita da utilizzare //id vecchia  e id nuova
 * @param {*} idAuto 
 */
exports.setAutoPredefinita = async (req,res,next) => {
    let idGarage = req.body.id_garage;
    let oldAuto = req.body.old_auto;
    let newAuto = req.body.new_auto;

    try{
        result = await db.execute(queries.deleteAutoPredefinita, [idGarage, oldAuto]);
        resultUpdate = await db.execute(queries.setNewAutoPredefinita, [idGarage, newAuto]);
    }
    catch(err){
        res.status(401).json({
            text : "impossibile settare l'auto predefinita",
            err : err
        })
    }

    res.status(201).json({
        message : 'update auto predefinita ok'
    })

}


/**
 * Classifica globale
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getClassificaGlobale = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let classifica;
    try{
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM utente JOIN portafoglio 
                                                ON utente.id_utente = portafoglio.id_utente 
                                            ORDER BY punti_drivepass DESC
                                                `);
        classifica = rows;
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile ottenere la classifica globale',
            err : err
        });
    }

    res.status(201).json({
        classifica : classifica
    })
}

/**
 * Classifica città
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getClassificaLocale = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let utente;
    let classifica;
     try{
        const [row, field] = await db.execute(queries.getUtenteById, [idUtente]);
        utente = row[0];
    }   
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare dati utente',
            err : err
        })
    }
    

    try{
        const [rows, field] = await db.execute(`SELECT * 
                                                FROM utente JOIN portafoglio 
                                                ON utente.id_utente = portafoglio.id_utente 
                                                WHERE citta = ?
                                             ORDER BY punti_drivepass DESC
        `, [utente.citta]);
        classifica = rows;
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile ottenere la classifica locale',
            err : err
        });
    }

    res.status(201).json({
        classifica : classifica
    })
}


/**
 * Recupera classifica amici fb
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getClassificaFacebook = async (req,res,next) => {
    let friends = req.body.friends;
    let myId = req.body.id_utente;
    var amici = []; //Array degli amici

    var p;
    var promisesArray = [];
    var promisesClassifica = [];

    console.log(friends);

    //Recupera id facebook myutente
    const [row, field] = await db.execute(queries.getUtenteById, [myId]);
    friends.push(row[0].id_facebook);


    await friends.forEach( async (userFriend) => {
       p = db.execute(queries.getUtenteByIdFacebook, [userFriend]);
       promisesArray.push(p);   
    })
    const result = await Promise.all(promisesArray);


    result.forEach( async (friend) => {
        var promise = new Promise( async function(resolve, reject) {
        //console.log("QQ",friend[0][0]);
       // friendsUtente.push(friend[0][0]);


        let portafoglio = await db.execute(queries.getPortafoglioByIdUtente, [friend[0][0].id_utente]);
        if(!portafoglio){
            return res.status(401).json({
                text : 'impossibile recuperare classifica facebook',
                err : err
            });
        }
        let stileDiGuida = await db.execute(queries.getStileDiGuidaByIdUtente, [friend[0][0].id_utente]);
        if(!stileDiGuida){
            return res.status(401).json({
                message : 'impossibile recuperare classifica facebook'
            });
        }

        let amico = {
            id_utente : friend[0][0].id_utente,
            nome : friend[0][0].nome,
            cognome : friend[0][0].cognome,
            email : friend[0][0].email,
            citta : friend[0][0].citta,
            tipo_accesso : friend[0][0].tipo_accesso,
            tipo_utente : stileDiGuida[0][0].tipo,
            livello : portafoglio[0][0].livello,
            ac_point : portafoglio[0][0].acpoint,
            ticket : portafoglio[0][0].ticket,
            punti_drivepass : portafoglio[0][0].punti_drivepass,
            id_portafoglio : portafoglio[0][0].id_portafoglio,
        }

        //console.log("AMICO ", amico);
        amici.push(amico);
        //console.log("AMICI ARRAY iterazione", amici);
        resolve(amici);
        
        return promise;
        })

        promisesClassifica.push(promise);
        
    });

    
    const resultClassifica = await Promise.all(promisesClassifica);
    
    //Ordinamento classifica (punti_drivepass)
    amici.sort(function(a, b) {
        var puntiA = a.punti_drivepass;
        var puntiB = b.punti_drivepass;
        if (puntiA > puntiB) return -1;
        if (puntiA < puntiB) return 1;
        return 0;
    });

    res.status(201).json({
        classifica : amici
    })
}






//AVATAR

/**
 * Recupera tutti gli avatar nel db
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getAllAvatar = async (req,res,next) => {
    const errors = validationResult(req);
    let allAvatar;
    if (!errors.isEmpty()) {
        return res.json({
            message: 'Errore input Parametri',
            error: errors.array()
        });
    }
     
    try{
        const [rows, field] = await db.execute(queries.getAllAvatar); //Recupera tutti gli avatar
         allAvatar = rows;
 
       
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare gli avatar',
            err : err
        })
    }

    res.status(201).json({
        avatar : allAvatar
    })
   
}


exports.setAvatarPredefinito = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let oldAvatar = req.body.old_avatar;
    let newAvatar = req.body.new_avatar;

    try{
        result = await db.execute(queries.deleteAvatarPredefinito, [idUtente, oldAvatar]);
        resultUpdate = await db.execute(queries.setNewAvatarPredefinito, [idUtente, newAvatar]);
    }
    catch(err){
        res.status(401).json({
            text : "impossibile settare l'auto predefinita",
            err : err
        })
    }

    res.status(201).json({
        message : 'update auto predefinita ok'
    })

}




exports.getAvatar = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    console.log("***** ID UTENTE ", idUtente);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.json({
            message: 'Errore input Parametri',
            error: errors.array()
        });
    }

   
    let profiloAvatar = [];
    let allAvatar = [];

    profiloAvatar = await getProfiloAvatarByIdUtente(idUtente); //Recupera tutti gli avatar disponibili
     
    try{
        const [rows, field] = await db.execute(queries.getAllAvatar); //Recupera tutti gli avatar
        allAvatar = rows;
    }
    catch(err){
        res.status(401).json({
            text : 'impossibile recuperare avatar',
            err : err
        })
    }

  

    //Recupera gli avatar locked per l'utente
    let avatarLocked = allAvatar.filter( (item) => {
        let bool = false;
        profiloAvatar.forEach( (a) => {
            if(a.id_avatar === item.id_avatar){
                bool = true;
            }
        })
        if(!bool){
            return item;
        }
    })

    //Formatta le avatar locked per la risposta
    let avatarLockedFormatted = [];
    avatarLocked.forEach( (item) => {
        avatar = {
            id_avatar : item.id_avatar,
            nome : item.nome,
            img : item.img,
            costo : item.costo,
            predefinito : 0,
            disponibilita : 0
        };
         
        avatarLockedFormatted.push(avatar);
    })

    
    avatar = profiloAvatar.concat(avatarLockedFormatted); //Concatena avatar locked e unlocked

    //Inserisce in posizione 0 dell'array l'avatar predefinito
    let el;
    avatar.forEach( (item) => {
        if( item.predefinito === 1 ){
            el = avatar.splice(avatar.indexOf(item),1);
         }
     })
 
    avatar.splice(0, 0, el[0]);
    
    
    res.status(201).json({
        avatar : avatar
    })
}


async function getProfiloAvatarByIdUtente(idUtente){
    try{
        const [rows, field] = await db.execute(queries.getAvatarByProfiloAvatar, [idUtente]);
        profiloAvatar = rows;
        //console.log(parcheggio);
    }
    catch(err){
       return err;
    }
    return profiloAvatar;
}
