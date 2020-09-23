const fs = require('fs')

exports.getProvince = (req,res,next) => {
    const rawdata = fs.readFileSync('./json/province.json');
    const province = JSON.parse(rawdata);

    res.json(province);
}

exports.getCitta = (req,res,next) => {
    const rawdata = fs.readFileSync('./json/citta.json');
    const citta = JSON.parse(rawdata);  //restituisce tutte le citta

    const sigla = req.params.sigla;
    console.log(sigla);

    const cittaFilter = citta.filter( elem => {
        return elem.provincia == sigla;
    })

    res.json(cittaFilter);
}