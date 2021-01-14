module.exports = {
    getUtenteByEmail: "SELECT * FROM utente WHERE email = ?",
    getUtenteByIdFacebook: "SELECT * FROM utente WHERE id_facebook = ?",
    getUtenteById: "SELECT * FROM utente WHERE id_utente = ?",
    getAllUtenti : "SELECT * FROM utente",

    getAllPortafoglio : "SELECT * FROM portafoglio",
    getPortafoglioByIdUtente: "SELECT * FROM portafoglio WHERE id_utente = ?",

    getGarageByIdUtente: "SELECT * FROM garage WHERE id_utente = ?",

    getStileDiGuidaByIdUtente: "SELECT * FROM stilediguida WHERE id_utente = ?",
    getCostanteCrescita: "SELECT costante_crescita FROM stilediguida WHERE id_utente = ?",


    getParcheggioByIdGarage: `SELECT auto.id_auto, nome, rarita, img, img_sessione, colore, costo, predefinito, disponibilita 
                                FROM parcheggia JOIN auto 
                                ON parcheggia.id_auto  = auto.id_auto  
                                WHERE parcheggia.id_garage = ?`,


                                
    getAvatarByProfiloAvatar: `SELECT profiloavatar.id_utente, avatar.id_avatar, nome, img, costo, predefinito, disponibilita 
                              FROM profiloavatar JOIN avatar 
                              ON profiloavatar.id_avatar  = avatar.id_avatar 
                              WHERE profiloavatar.id_utente= ?`,

    getItemParcheggia: 'SELECT * FROM parcheggia WHERE id_garage = ? AND id_auto = ?',
    getItemProfiloavatar: 'SELECT * FROM profiloavatar WHERE id_utente = ? AND id_avatar = ?',

    getDrivePassByStagione: 'SELECT * FROM drivepass WHERE stagione = ?',
    getDrivePassByLivello: 'SELECT * FROM drivepass WHERE livello = ?',

     getAllAuto: "SELECT * FROM auto",
    getAutoById: "SELECT * FROM auto WHERE id_auto = ? ",
    getAutoPredefinita : "SELECT id_auto FROM parcheggia WHERE id_garage = ? AND predefinito = 1",
    getAutoByIdAndByIdGarage: "SELECT * FROM parcheggia WHERE id_auto = ? AND id_garage = ?",
    getAvatarByIdAndByIdUtente: "SELECT * FROM profiloavatar WHERE id_avatar = ? AND id_utente = ?",

    getSessioneById: "SELECT * FROM sessione WHERE id_sessione = ? AND id_utente = ?",
    getSessioniByRangeData: "SELECT * FROM sessione WHERE id_utente = ? AND data >= ? AND data <= ?",

    getAllAvatar: "SELECT * FROM avatar",
    getAvatarById: "SELECT * FROM avatar WHERE id_avatar = ? ",

    getInfrazioni: "SELECT * FROM infrazione WHERE id_sessione = ? AND id_utente = ? ORDER BY id_infrazione",

    getAllCitta : "SELECT citta FROM utente GROUP BY citta",

    getSfidaByCitta : "SELECT * FROM sfida WHERE team1 = ? OR team2 = ?",
    getSfidaAttivaByCitta : "SELECT * FROM sfida WHERE (team1 = ? OR team2 = ?) AND stato = ?",

    getSfidaById : "SELECT * FROM sfida WHERE id_sfida = ?",

    getPartecipa : "SELECT * FROM partecipa WHERE id_utente = ? AND id_sfida = ?",

    getPartecipaDaRiscattare : "SELECT * FROM partecipa WHERE id_utente = ? AND riscatto_premio = 0 ORDER BY id_sfida DESC",

    getRisultatoSfidaPuntiDrivePass : "SELECT citta, SUM(punti_drivepass) as punti FROM portafoglio JOIN utente WHERE portafoglio.id_utente = utente.id_utente AND (citta = ? OR citta = ?) GROUP BY citta", //Restituisce punti drivepass per la sfida "PuntiDrivePass" tra le due citta coinvolte
    getRisultatoSfidaBonus : "SELECT citta, SUM(bonus) as punti FROM sessione JOIN utente WHERE sessione.id_utente = utente.id_utente AND (citta = ? OR citta = ?) AND sessione.data >= ? AND sessione.data <= ? GROUP BY citta", //Risultato sfida BONUS
    getRisultatoSfidaMalus : "SELECT citta, SUM(malus) as punti FROM sessione JOIN utente WHERE sessione.id_utente = utente.id_utente AND (citta = ? OR citta = ?) AND sessione.data >= ? AND sessione.data <= ? GROUP BY citta", //Risultato sfida MALUS
    
    insertSfida : "INSERT INTO sfida (team1, team2, tipo_sfida, descrizione, data_inizio_sfida, data_fine_sfida, stato, premio, tipo_premio, punti_team1, punti_team2) VALUE (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",

    insertPartecipa : "INSERT INTO partecipa (id_utente, id_sfida, punti_utente, riscatto_premio) VALUES (?, ?, 0, 0)",

    insertLog : "INSERT INTO log (id_utente, attivita, data) VALUES (?, ?, ?)",

    getSfideByUtente : "SELECT sfida.id_sfida, sfida.team1, sfida.team2, sfida.tipo_sfida, sfida.descrizione, sfida.data_inizio_sfida, sfida.data_fine_sfida, sfida.stato, sfida.premio, sfida.tipo_premio, sfida.punti_team1, sfida.punti_team2 FROM partecipa JOIN sfida WHERE partecipa.id_sfida = sfida.id_sfida AND partecipa.id_utente = ?",

    createUtente: "INSERT INTO utente (nome, cognome, email, password, citta, tipo_accesso, id_facebook) values (?,?,?,?,?,?,?)",
    createPortafoglio: "INSERT INTO portafoglio (acpoint, ticket, livello, punti_drivepass, id_utente) values (0, 0, 1, 0, ?)",
    createGarage: "INSERT INTO garage (id_utente) values (?)",
    createStileDiGuida: "INSERT INTO stilediguida (id_utente, tipo, media_settimanale, costante_crescita, tolleranza_min, tolleranza_max) values (?,?,?,?,?,?)",
    createStatisticheGamification: "INSERT INTO statistichegamification (id_utente, id_app, livello) values (?,?,?)",
    createSession: "INSERT INTO sessione (durata, km_percorsi, bonus, malus, id_utente, data) VALUES (?,?,?,?,?, ?)",

    createInfrazione: "INSERT INTO infrazione (id_sessione, id_utente, timer, tipo, descrizione, road_name, maxspeed) VALUES (?,?,?,?,?,?,?)",
    createStoricoDrivePass : "INSERT INTO storicodrivepass (stagione, id_utente, livello_finale, punti_guadagnati, data_fine) VALUE (?,?,?,?,?)",

    insertIntoParcheggio: "INSERT INTO parcheggia (id_garage, id_auto, disponibilita, predefinito) VALUES (?, ?, ?, ?)",
    insertIntoProfiloAvatar: "INSERT INTO profiloavatar (id_utente, id_avatar, disponibilita, predefinito) VALUES (?, ?, ?, ?)",

    updateTicketPortafoglioByIdUtente: "UPDATE portafoglio SET ticket = ? WHERE id_utente = ?",
    incrementTicketPortafoglioByIdUtente: "UPDATE portafoglio SET ticket = ticket + ? WHERE id_utente = ?",

    updatePointPortafoglioByIdUtente: "UPDATE portafoglio SET acpoint = ? WHERE id_utente = ?",
    incrementPointPortafoglioByIdUtente: "UPDATE portafoglio SET acpoint = acpoint + ? WHERE id_utente = ?",

    updateDrivePassPortafoglio: "UPDATE portafoglio SET acpoint = acpoint + ?, livello = ?, punti_drivepass = ? WHERE id_utente = ?",

    updateLivelloRiscattatoPortafoglioByIdUtente: "UPDATE portafoglio SET livello_riscattato = ? WHERE id_utente = ?",

    updateStileDiGuida : "UPDATE stilediguida SET tipo = ?, media_settimanale = ?, costante_crescita = ?, tolleranza_min = ?, tolleranza_max = ? WHERE id_utente = ?",
    
    updateSession: "UPDATE sessione SET durata = ?, km_percorsi = ?, bonus = bonus + ?,  malus = ? WHERE id_sessione = ? AND id_utente = ?",

    updatePartecipa: "UPDATE partecipa SET punti_utente = ?, riscatto_premio = ? WHERE id_utente = ? AND id_sfida = ?",

    AutoPredefinita : "UPDATE parcheggia SET predefinito = 1 WHERE id_garage = ? AND id_auto = ?",
    setNewAutoPredefinita : "UPDATE parcheggia SET predefinito = 1 WHERE id_garage = ? AND id_auto = ?",
    deleteAutoPredefinita : "UPDATE parcheggia SET predefinito = 0 WHERE id_garage = ? AND id_auto = ?",

    setNewAvatarPredefinito : "UPDATE profiloavatar SET predefinito = 1 WHERE id_utente = ? AND id_avatar = ?",
    deleteAvatarPredefinito : "UPDATE profiloavatar SET predefinito = 0 WHERE id_utente = ? AND id_avatar = ?",

    updateLivelloStatisticheGamification: "UPDATE statistichegamification SET livello = ? WHERE id_utente = ? AND id_app = 1", //id_app = 1 GamifiedDriving

    updateStoricoDrivepass : "UPDATE storicodrivepass SET livello_finale = ? , punti_guadagnati = ? WHERE id_utente = ? AND stagione = ?",

    updatePunteggioSfida : "UPDATE sfida SET punti_team1 = ?, punti_team2 = ? WHERE id_sfida = ? ", //update punteggio Sfida

    updateLivelloPortafoglio : "UPDATE portafoglio SET livello = ? WHERE id_utente = ?",

    getUltimoAccesso : "SELECT ultimo_accesso FROM utente WHERE id_utente = ?",
    setUltimoAccesso : "UPDATE utente SET ultimo_accesso = ? WHERE id_utente = ?"

  }