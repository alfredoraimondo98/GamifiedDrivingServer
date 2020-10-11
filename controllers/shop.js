const conn = require('../utils/connection');
const db = require('../utils/database');
const { validationResult } = require('express-validator');
const express = require('express');
const router = express.Router();


exports.buyWithTickets = async (req,res,next) => {
    idUtente = req.body.id_utente;
    costo = req.body.costo; //costo ticket;
    idGarage = req.body.id_garage;
    let updateTicket;
    let premio;
    
    try{   //Verifica disponibilità tickets
        updateTicket = await verificaTickets(idUtente, costo);
        if(!updateTicket){
            res.status(401).json({
                message: 'Tickets non sufficienti'
            })
        }
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile verificare i tickets disponibili' + err
        })
    }

   
    try {
       
        conn.connect((err) =>{ 
            if(err) {  
              console.error("errore di connessione:" + err.stack ); 
              return;
            }
            console.log('connesso come id' + conn.threadId);
        });
        
        conn.beginTransaction(async err => {
            if (err) {
                console.log(err);
                return res.status(422).json({
                    message: 'Impossibile avviare la procedura (transaction failed)'
                });
            }

            premio = await acquistoPacchetto(idUtente, costo, idGarage); //acquisto auto

            conn.query("INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?)", [idGarage, premio.id_auto, 1, 0], (err, result) => {
                if (err) {
                    conn.rollback((err) => {
                        console.log("inserimento premio : ", err);
                    });
                    return res.status(422).json({
                        message: 'Errore insert premio'
                    });
                }


                conn.query('UPDATE portafoglio SET acpoint = ? WHERE id_utente = ?', [updateTicket, idUtente], (err, result) => {
                    if (err) {
                        conn.rollback((err) => {
                            console.log("Update portafoglio : ", err);
                        });
                        return res.status(422).json({
                            message: 'Errore update portafoglio'
                        });
                    }


                    
                    conn.commit((err) => {
                        if (err) {
                            conn.rollback((err) => {
                                return res.status(422).json({
                                    message: 'Impossibile effettuare il commit. Acquisto fallita!'
                                });
                            });
                        }
                        else {
                            console.log('Transaction Complete.');
                            console.log("chiudo connessione");
                            conn.end();
                            return res.status(201).json({
                                message : 'Acquisto completato',
                                newTickets : updateTicket, //Nuovo credito tickets
                                premio: premio
                            });
                        }
                    });
                });
            });
        });
    }
    catch(err){
        res.status(401).json({
            message : err,
        })
    } 
}



exports.buyWithPoints = async (req,res,next) => {
    idUtente = req.body.id_utente;
    costo = req.body.costo; //costo ticket;
    idPortafoglio = req.body.id_portafoglio;
    idGarage = req.body.id_garage;

    let updatePoint
    try{ //verifica points
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE id_utente = ?', [idUtente]);
        if(row[0].ticket >= costo){
            updatePoint = row[0].acpoint - costo;
        }
        else{
            res.status(401).json({
                message : 'AcPoints insufficienti'
            })
        }
    }
    catch(err){
        console.log(err);
        return err;
    }
    
    try {
       
        conn.connect((err) =>{ 
            if(err) {  
              console.error("errore di connessione:" + err.stack ); 
              return;
            }
            console.log('connesso come id' + conn.threadId);
        });
        
        conn.beginTransaction(async err => {
            if (err) {
                console.log(err);
                return res.status(422).json({
                    message: 'Impossibile avviare la procedura di regitrazione (transaction failed)'
                });
            }

            premio = await acquistoPacchetto(idUtente, costo, idGarage); //acquisto auto

            conn.query("INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?)", [idGarage, premio.id_auto, 1, 0], (err, result) => {
                if (err) {
                    conn.rollback((err) => {
                        console.log("inserimento premio : ", err);
                    });
                    return res.status(422).json({
                        message: 'Errore insert premio'
                    });
                }


                conn.query('UPDATE portafoglio SET acpoint = ? WHERE id_utente = ?', [updatePoint, idUtente], (err, result) => {
                    if (err) {
                        conn.rollback((err) => {
                            console.log("Update portafoglio : ", err);
                        });
                        return res.status(422).json({
                            message: 'Errore update portafoglio'
                        });
                    }


                    
                    conn.commit((err) => {
                        if (err) {
                            conn.rollback((err) => {
                                return res.status(422).json({
                                    message: 'Impossibile effettuare il commit. Acquisto fallita!'
                                });
                            });
                        }
                        else {
                            console.log('Transaction Complete.');
                            console.log("chiudo connessione");
                            conn.end();
                            return res.status(201).json({
                                message : 'Acquisto completato',
                                updatePoint : updatePoint,
                                premio: premio
                            });
                        }
                    });
                });
            });
        });
    }
    catch(err){
        res.status(401).json({
            message : err
        })
    }
         
  
}

/**
 * Acquisto pacchetto Tickets
 * @param {*} idUtente 
 * @param {*} costo 
 */
async function acquistoPacchetto(idUtente, costo, idGarage){
    let auto = [];
    let autoDisponibili = [];
    //console.log(costo);
    try{
        const [rows, field] = await db.execute("SELECT * FROM auto"); //Recupera tutte le auto
        auto = rows;
    }
    catch(err){
        return 'Impossibile recuperare le auto ' + err;
    }

    try{
        const [row, field] = await db.execute("SELECT * FROM garage WHERE id_utente = ? ", [idUtente]) //recupera id garage dell'utente
        idGarage = row[0].id_garage
    }
    catch(err){
        return 'Impossibile recuperare id garage: ' + err;
    }

    try{
        const [rows, field] = await db.execute("SELECT * FROM parcheggia WHERE id_garage = ?", [idGarage]) //recupera auto nel parcheggio dell'utente
        autoDisponibili = rows;
    }
    catch(err){
        return 'Impossibile recuperare le auto parcheggiate nel garage di questo utente: ' + err;

    }
   
    autoRandom = dispatcherPacchetto(costo, auto, autoDisponibili); //costruzione array su cui effettuare la random 
    console.log(autoRandom);

    const randomElement = autoRandom[Math.floor(Math.random() * autoRandom.length)]; //Random vincita
 
   /*  try{
        const result = await db.execute("INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?)", [idGarage, randomElement.id_auto, 1, 0]) //recupera auto nel parcheggio dell'utente
    }
    catch(err){
        return 'Impossibile inserire premio: ' +err;
    } */

    return randomElement; //Restituisce l'auto vinta!
    

}

/**
 * Costruzione array per l'estrazione sulla base del pacchetto acquistato
 * @param {*} costo 
 * @param {*} auto 
 * @param {*} autoDisponibili 
 */
function dispatcherPacchetto(costo, auto, autoDisponibili){
    if(costo === '20'){ //pacchetto bronzo
        console.log("in")
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.id_auto === item.id_auto){
                    bool = true;
                }
            })
            if(!bool){
                if(item.rarita === 'Comune' || item.rarita === 'Raro'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Comune'){ //Probabilità di un auto comune (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        
        return autoRandom;
    }
    if(costo === '50'){ //pacchetto argento
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.id_auto === item.id_auto){
                    bool = true;
                }
            })
            if(!bool){   
                if(item.rarita === 'Raro' || item.rarita === 'Epico'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Raro'){ //Probabilità di un auto rara (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        return autoRandom;
    }
    if(costo === '100'){ //pacchetto oro
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.id_auto === item.id_auto){
                    bool = true;
                }
            })
            if(!bool){
                if(item.rarita === 'Epico' || item.rarita === 'Leggendario'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Epico'){ //Probabilità di un auto epico (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        return autoRandom;
    }
    if(costo === '180'){ //pacchetto damascus
        let autoRandom = auto.filter( (item) => {
            let bool = false;
            autoDisponibili.forEach( (a) => {
                if(a.id_auto === item.id_auto){
                    bool = true;
                }
            })
            if(!bool){
                if(item.rarita === 'Leggendario' || item.rarita === 'Limited'){
                    return item;
                }
            }
        })
        autoRandom.forEach( (item) => {
            if(item.rarita === 'Leggendario'){ //Probabilità di un auto leggendario (inserita 3 volte)
                autoRandom.push(item);
                autoRandom.push(item);
            }
        })
        return autoRandom;
    }

    
}



/**
 * getShopAuto : restituisci le auto per lo shop del singolo utente.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getShopAuto = async (req,res,next) =>{
    let idUtente = req.body.id_utente;

    let auto = []; //Tutte le auto disponibili
    let idGarage;
    let autoDisponibili = []; //Auto disponibili per l'utente
    
    try{
        const [rows, field] = await db.execute("SELECT * FROM auto"); //Recupera tutte le auto
        auto = rows;
    }
    catch(err){
        res.status(201).json({
            message : 'Impossibile recuperare auto',
            err : err
        })
    }

    try{
        const [row, field] = await db.execute("SELECT * FROM garage WHERE id_utente = ? ", [idUtente]) //recupera id garage dell'utente
        idGarage = row[0].id_garage
    }
    catch(err){
        res.status(201).json({
            message : 'Impossibile recuperare id garage',
            err : err
        })
    }

    try{
        const [rows, field] = await db.execute("SELECT * FROM parcheggia WHERE id_garage = ?", [idGarage]) //recupera auto nel parcheggio dell'utente
        autoDisponibili = rows;
    }
    catch(err){
        res.status(201).json({
            message : 'Impossibile recuperare le auto parcheggiate nel garage di questo utente',
            err : err
        })
    

    }
   
    let autoIntoShop = auto.filter( (item) => {
        let bool = false;
        autoDisponibili.forEach( (a) => {
            if(a.idauto === item.id_auto){
                bool = true;
            }
        })
        if(!bool){
            return item;
        }
    })

    res.status(201).json({
        shopAuto : autoIntoShop
    })
     
}


exports.buyAuto = async (req,res,next) => {
    let idUtente = req.body.id_utente;
    let idAuto = req.body.id_auto;
    let idGarage = req.body.id_garage;
    let updatePoint;
    let auto;
    try{ //recupera dati auto da acquistare
        const [row, field] = await db.execute("SELECT * FROM auto WHERE id_auto = ? ", [idAuto]);
        auto = row[0];
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile trovare auto'
        })
    } 

    //Verifica che l'auto non sia già disponibile per quell'utente
    try{
        const [row, field] = await db.execute("SELECT * FROM parcheggia WHERE id_auto = ? AND id_garage = ?", [idAuto, idGarage]);
        if(row[0]){
            res.status(401).json({
                message : 'Auto già presente nel tuo garage.'
            })
        }
    }  
    catch(err){
        res.status(401).json({
            message : err
        })
    }

    try{   //Verifica disponibilità point
        updatePoint = await verificaPoints(idUtente, auto.costo);
        if(!updatePoint){
            res.status(401).json({
                message: 'AcPoint non sufficienti'
            })
        }
    }
    catch(err){
        res.status(401).json({
            message : 'impossibile verificare i coin disponibili'
        })
    }

    //console.log(updatePoint)

    try{
        
        conn.connect((err) =>{ 
            if(err) {  
            console.error("errore di connessione:" + err.stack ); 
            return;
            }
            console.log('connesso come id' + conn.threadId);
        });
        
        conn.beginTransaction(async err => {
            if (err) {
                console.log(err);
                return res.status(422).json({
                    message: 'Impossibile avviare la procedura (transaction failed)'
                });
            }

        

            conn.query('INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?) ', [idGarage, auto.id_auto, 1, 0], (err, result) => {
                if (err) {
                    conn.rollback((err) => {
                        console.log("inserimento auto : ", err);
                    });
                    return res.status(422).json({
                        message: 'Errore insert auto'
                    });
                }


                conn.query('UPDATE portafoglio SET acpoint = ? WHERE id_utente = ?', [updatePoint, idUtente], (err, result) => {
                    if (err) {
                        conn.rollback((err) => {
                            console.log("Update portafoglio : ", err);
                        });
                        return res.status(422).json({
                            message: 'Errore update portafoglio'
                        });
                    }


                    
                    conn.commit((err) => {
                        if (err) {
                            conn.rollback((err) => {
                                return res.status(422).json({
                                    message: 'Impossibile effettuare il commit. Acquisto fallita!'
                                });
                            });
                        }
                        else {
                            console.log('Transaction Complete.');
                            console.log("chiudo connessione");
                            conn.end();
                            return res.status(201).json({
                                message : 'Acquisto completato',
                                updatePoint : updatePoint,
                                auto: auto
                            });
                        }
                    });
                });
            });
        });
    }
    catch(err){
        res.status(401).json({
            message : err
        })
    }

}


/**
 * verifica se i points posseduti sono sufficienti per effettuare l'acquisto di costo "costo"
 * @param {*} idUtente 
 * @param {*} costo 
 */
async function verificaPoints(idUtente, costo){
    let updatePoint
    try{ //verifica points
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE id_utente = ?', [idUtente]);
        if(row[0].acpoint >= costo){
            updatePoint = row[0].acpoint - costo;
            return updatePoint;
        }
        else{
            return false;
        }
    }
    catch(err){
        console.log(err);
        return err;
    }
}

/**
 *  * verifica se i tickets posseduti sono sufficienti per effettuare l'acquisto di costo "costo"
 * @param {*} idUtente 
 * @param {*} costo 
 */
async function verificaTickets(idUtente, costo){
    let updateTickets
    try{ //verifica points
        const [row, fields] = await db.execute('SELECT * FROM portafoglio WHERE id_utente = ?', [idUtente]);
        if(row[0].ticket >= costo){
            updateTickets = row[0].ticket - costo;
            return updateTickets;
        }
        else{
            return false;
        }
    }
    catch(err){
        console.log(err);
        return err;
    }
}
