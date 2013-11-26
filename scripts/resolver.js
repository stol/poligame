var Crawler = require("crawler").Crawler
	, moment  = require("moment")
    , mysql = require('mysql')
;

var TYPE_TEXTE = 1,
	TYPE_ARTICLE = 2,
	TYPE_AMENDEMENT = 3;


if (process.env.NODE_ENV && "production" == process.env.NODE_ENV){
	db = mysql.createConnection({
	    host     : 'localhost',
	    user     : 'stol',
	    password : 'Je suis une chaise',
	    database : 'stol'
	});
}
else{
	db = mysql.createConnection({
	    host     : 'localhost',
	    user     : 'root',
	    password : '',
	    database : 'poligame'
	});
}

moment.lang('fr', {
    months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
    monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
    weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
    weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
    weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
    longDateFormat : {
        LT : "HH:mm",
        L : "DD/MM/YYYY",
        LL : "D MMMM YYYY",
        LLL : "D MMMM YYYY LT",
        LLLL : "dddd D MMMM YYYY LT"
    },
    calendar : {
        sameDay: "[Aujourd'hui à] LT",
        nextDay: '[Demain à] LT',
        nextWeek: 'dddd [à] LT',
        lastDay: '[Hier à] LT',
        lastWeek: 'dddd [dernier à] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : "dans %s",
        past : "il y a %s",
        s : "quelques secondes",
        m : "une minute",
        mm : "%d minutes",
        h : "une heure",
        hh : "%d heures",
        d : "un jour",
        dd : "%d jours",
        M : "un mois",
        MM : "%d mois",
        y : "une année",
        yy : "%d années"
    },
    ordinal : function (number) {
        return number + (number === 1 ? 'er' : 'ème');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});

var c = new Crawler({
	maxConnections: 2,
	forceUTF8: true
});

// Queue URLs with custom callbacks & parameters
/*
c.queue([{
	uri: "http://www.assemblee-nationale.fr/agendas/conference-blanc.asp",
	callback: function(error,result, $) {

	}
}]);
*/

db.query("SELECT * FROM textes WHERE ends_at < ? AND analysed = 0", [moment().format('YYYY-MM-DD 23:59:59')], function(err, textes, fields) {
	for(var i=0; i<textes.length; i++){
		c.queue([{
			uri: textes[i].link,
			callback: get_scrutin_url,
			texte: textes[i]
		}]);
	}
});

function get_scrutin_url(error,result, $){
	var texte = this.texte;
	var scrutin_url = $("table a:contains('Scrutin')").last().attr("href");

	
	if (scrutin_url){
		
		scrutin_url = 'http://www.assemblee-nationale.fr' + scrutin_url;
		
		console.log("Analyse détaillée de "+scrutin_url);
		
		c.queue([{
			uri: scrutin_url,
			callback: analyse_scrutin,
			texte: texte
		}]);
	}
	else if ( $("body").text().match(/adopté.*l'assemblée/ig) ){
		console.log("TEXTE ADOPTÉ TROUVÉ");
        var data = {
            status: 1
            ,analysed : 1
        }
        if (moment(texte.ends_at) > moment()){
            data.ends_at = moment().format("YYYY-MM-DD HH:mm:ss");
        }
		db.query("UPDATE textes SET ? WHERE id = "+texte.id, data, function(err, rows, fields) {
			if (err) throw err;
		});
	}
	else if ( $("body").text().match(/rejeté.*l'assemblée/ig) ){
		console.log("TEXTE REJETÉ TROUVÉ");
        var data = {
            status: 2
            ,analysed : 1
        }
        if (moment(texte.ends_at) > moment()){
            data.ends_at = moment().format("YYYY-MM-DD HH:mm:ss");
        }
		db.query("UPDATE textes SET ? WHERE id = "+texte.id, data, function(err, rows, fields) {
			if (err) throw err;
		});
	}
	else{
		console.log("status inconnu pour "+texte.link);
	}

}

function analyse_scrutin(error,result, $){
	var texte = this.texte;
	var total = parseInt($.trim($("#total b").text()),10);
	var pour = parseInt($.trim($("#pour b").text()),10);
	var contre = parseInt($.trim($("#contre b").text()),10);
	var abstention = total - pour - contre;
	var data = {
		 pour_assemblee       : pour
		,contre_assemblee     : contre
		,abstention_assemblee : abstention
		,analysed 			 : 1
	};

	//console.log(data);

	db.query("UPDATE textes SET ?  WHERE id = "+texte.id, data, function(err, rows, fields) {
		if (err) throw err;
	});
}

















