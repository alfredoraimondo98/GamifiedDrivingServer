module.exports = {
    getUtenteByEmail: "SELECT * FROM utente WHERE email = ?",
    getUtenteByIdFacebook: "SELECT * FROM utente WHERE id_facebook = ?",
    getUtenteById: "SELECT * FROM utente WHERE id_utente = ?",
    
    getPortafoglioByIdUtente: "SELECT * FROM portafoglio WHERE id_utente = ?",

    getGarageByIdUtente: "SELECT * FROM garage WHERE id_utente = ?",

    getStileDiGuidaByIdUtente: "SELECT * FROM stilediguida WHERE id_utente = ?",
    getCostanteCrescita: "SELECT costante_crescita FROM stilediguida WHERE id_utente = ?",


    getParcheggioByIdGarage: `SELECT heroku_344b7c2e1e3b45f.auto.id_auto, nome, rarita, img, img_sessione, colore, costo, predefinito, disponibilita 
                                FROM heroku_344b7c2e1e3b45f.parcheggia JOIN heroku_344b7c2e1e3b45f.auto 
                                ON heroku_344b7c2e1e3b45f.parcheggia.id_auto  = heroku_344b7c2e1e3b45f.auto.id_auto  
                                WHERE heroku_344b7c2e1e3b45f.parcheggia.id_garage = ?`,


    getDrivePassByStagione: 'SELECT * FROM drivepass WHERE stagione = ?',

    getAllAuto: "SELECT * FROM auto",
    getAutoById: "SELECT * FROM auto WHERE id_auto = ? ",
    getAutoPredefinita : "SELECT id_auto FROM parcheggia WHERE id_garage = ? AND predefinito = 1",
    getAutoByIdAndByIdGarage: "SELECT * FROM parcheggia WHERE id_auto = ? AND id_garage = ?",

    getSessioneById: "SELECT * FROM sessione WHERE id_sessione = ? AND id_utente = ?",

    getAllAvatar: "SELECT * FROM avatar",
    getAvatarById: "SELECT * FROM avatar WHERE id_avatar = ? ",

    getInfrazioni: "SELECT * FROM infrazione WHERE id_sessione = ? AND id_utente = ? ORDER BY id_infrazione",

    createUtente: "INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso, id_facebook) values (?,?,?,?,?,?,?)",
    createPortafoglio: "INSERT INTO portafoglio (acpoint, ticket, livello, punti_drivepass, id_utente) values (0, 0, 1, 0, ?)",
    createGarage: "INSERT INTO garage (id_utente) values (?)",
    createStileDiGuida: "INSERT INTO stilediguida (id_utente, tipo, media_settimanale, costante_crescita, tolleranza_min, tolleranza_max) values (?,?,?,?,?,?)",
    createStatisticheGamification: "INSERT INTO statistichegamification (id_utente, id_app, livello) values (?,?,?)",
    createSession: "INSERT INTO sessione (durata, km_percorsi, bonus, malus, id_utente, data) VALUES (?,?,?,?,?, ?)",

    createInfrazione: "INSERT INTO infrazione (id_sessione, id_utente, timer, tipo, descrizione) VALUES (?,?,?,?,?)",

    insertIntoParcheggio: "INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?)",


    updateTicketPortafoglioByIdUtente: "UPDATE portafoglio SET ticket = ? WHERE id_utente = ?",
    updatePointPortafoglioByIdUtente: "UPDATE portafoglio SET acpoint = ? WHERE id_utente = ?",
    updateDrivePassPortafoglio: "UPDATE portafoglio SET acpoint = acpoint + ?, livello = ?, punti_drivepass = ? WHERE id_utente = ?",

    updateSession: "UPDATE sessione SET durata = ?, km_percorsi = ?, bonus = bonus + ?,  malus = ? WHERE id_sessione = ? AND id_utente = ?",

    AutoPredefinita : "UPDATE parcheggia SET predefinito = 1 WHERE id_garage = ? AND id_auto = ?",
    setNewAutoPredefinita : "UPDATE parcheggia SET predefinito = 1 WHERE id_garage = ? AND id_auto = ?",
    deleteAutoPredefinita : "UPDATE parcheggia SET predefinito = 0 WHERE id_garage = ? AND id_auto = ?",

    updateLivelloStatisticheGamification: "UPDATE statistichegamification SET livello = ? WHERE id_utente = ? AND id_app = 1", //id_app = 1 GamifiedDriving


  }