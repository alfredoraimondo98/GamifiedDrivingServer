module.exports = {
    getUtenteByEmail: "SELECT * FROM utente WHERE email = ?",
    getUtenteByIdFacebook: "SELECT * FROM utente WHERE id_facebook = ?",
    getUtenteById: "SELECT * FROM utente WHERE id_utente = ?",
    
    getPortafoglioByIdUtente: "SELECT * FROM portafoglio WHERE id_utente = ?",

    getGarageByIdUtente: "SELECT * FROM garage WHERE id_utente = ?",

    getStileDiGuidaByIdUtente: "SELECT * FROM stilediguida WHERE id_utente = ?",

    getParcheggioByIdGarage: `SELECT * 
                                FROM gamifieddrivingdb.parcheggia JOIN gamifieddrivingdb.auto 
                                ON gamifieddrivingdb.parcheggia.id_auto = gamifieddrivingdb.auto.id_auto 
                                WHERE gamifieddrivingdb.parcheggia.id_garage = ?`,


    getDrivePassByStagione: 'SELECT * FROM drivepass WHERE stagione = ?',

    getAllAuto: "SELECT * FROM auto",
    getAutoById: "SELECT * FROM auto WHERE id_auto = ? ",
    getAutoByIdAndByIdGarage: "SELECT * FROM parcheggia WHERE id_auto = ? AND id_garage = ?",


    getAllAvatar: "SELECT * FROM avatar",
    getAvatarById: "SELECT * FROM avatar WHERE id_avatar = ? ",

    createUtente: "INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso, id_facebook) values (?,?,?,?,?,?,?)",
    createGarage: "INSERT INTO garage (id_utente) values (?)",
    createPortafoglio: "INSERT INTO portafoglio (id_utente) values (?)",
    createStileDiGuida: "INSERT INTO stilediguida (id_utente, tipo, media_settimanale, costante_crescita, tolleranza_min, tolleranza_max) values (?,?,?,?,?,?)",
    createStatisticheGamification: "INSERT INTO statistichegamification (id_utente, id_app, livello) values (?,?,?)",
    createSession: "INSERT INTO sessione (durata, km_percorsi, bonus, malus, id_utente) VALUES (?,?,?,?,?)",



    insertIntoParcheggio: "INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?)",


    updateTicketPortafoglioByIdUtente: "UPDATE portafoglio SET ticket = ? WHERE id_utente = ?",
    updatePointPortafoglioByIdUtente: "UPDATE portafoglio SET acpoint = ? WHERE id_utente = ?",
    updateSession: "UPDATE sessione SET durata = ?, km_percorsi = ?, bonus = bonus + ?,  malus = ? WHERE id_sessione = ? AND id_utente = ?",

  }