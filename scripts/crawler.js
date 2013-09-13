var Crawler = require("crawler").Crawler
	, moment  = require("moment")
    , mysql = require('mysql')
;

db = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : '',
    database : 'poligame'
});

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
c.queue([{
	uri: "http://www.assemblee-nationale.fr/agendas/conference-blanc.asp",
	callback: function(error,result, $) {
		// Nettoyage du HTML de porc

		var $font_tags = $("#cblanc").find(".MsoNormal + font")
		$font_tags.each(function(i, font_tag){
		    $(font_tag).replaceWith($(font_tag).children());
		});


		var jours = [];
		var jour = null;
		var textes = {};
		$(".MsoNormal").each(function(i, ligne){
			
			// Nouveau jour
			// Suspiscion de nouveau jour
			if ($(ligne).parents(".MsoNormalTable").length){
				
				if ($(ligne).parents("td").attr("bgcolor")){

					jour && jours.push(jour);
					var text_content = $.trim($(ligne).text());
					jour = {
						date: moment(text_content, "dddd D MMMM").year("2013"),
						textes: []
					};
				}
				// On return, car c'était un jour, ou une heure
				return;
			}

			// ici, c'est pas un jour ou une heure
			var text_content = $.trim($(ligne).text());

			// ligne vide ?
			if (!text_content){
				return;
			}

			text_content = text_content.replace(/^-\s*/g,"");

			// Ligne n'est pas un texte ?
			if (text_content.indexOf("Discussion") !== 0 && text_content.indexOf("Suite de la discussion")){
				return;
			}

			var texte_link = $(ligne).find("a").attr("href");
			// On nettoie l'url des trucs genre "#xxx"
			if (texte_link.indexOf("#") > 0){
				texte_link = texte_link.substr(0, texte_link.indexOf("#"));
			}

			if (!textes[texte_link]){
				textes[texte_link] = {
					id_hash: Math.abs(texte_link.hashCode()),
					link: "http://www.assemblee-nationale.fr"+texte_link,
					dates : [
						jour.date
					]
				}
			}
			else{
				textes[texte_link].dates.push(jour.date);
			}

			jour.textes.push({
				node: ligne,
				link: texte_link
			});
		});

		//console.log(textes);

		// Boucle sur chaque texte pour déterminer les dates et lancer le crawl détaillé
		$.each(textes, function(i, texte){
			if (!texte.dates[0]){
				return;
			}

			texte.starts_at = texte.dates[0].format("YYYY-MM-DD 00:00:00");
			texte.ends_at = texte.dates[texte.dates.length-1].format("YYYY-MM-DD 23:59:59");

			c.queue([{
				uri: texte.link,
				callback: parse_detail,
				texte: texte
			}]);
		});
	}
}]);



function parse_detail(error,result, $){

	var texte = this.texte;
	texte.points = [];

	texte.title = $.trim($("p font").eq(0).text()).replace(/\s+/g, " ");
	console.log("Analysing "+texte.title+"...");

	// Boucle sur les cadres à la con
	var $coms = $("commentaire");
	$coms.each(function(i, commentaire){
	    var $ps = $(commentaire).find("td p");

		if ($ps.length != 2){
			return;
		}
		var bloc_title = $.trim($ps.eq(0).text());
		if (bloc_title.indexOf("Extrait") === 0){
			texte.description_title = bloc_title;
			var txt = $.trim($ps.eq(1).html()).replace(/<br ?\/>/g, "\n");
			texte.description = $(txt).text();
		}
		else if (bloc_title.indexOf("Principales dispositions") === 0){
			var txt = $.trim($ps.eq(1).html()).replace(/<br ?\/>/g, "\n");
			txt = $(txt).text();	
			//console.log(txt);
			var lignes = txt.split("\n");
			var ligne = null;
			var point_title = null;
			var point_texte = null;
			for(var i=0; i<lignes.length; i++){
				ligne = $.trim(lignes[i]); 

				// ligne vide ? On fait rien
				if (!ligne.length) {
					continue;
				}

				// Titre d'article ?
				if (ligne.match(/^article\s+\d+/gi)){
					point_title && texte.points.push({
						title: point_title,
						texte: point_texte,
						numero: point_title.match(/\d+/)[0]
					});
					point_title = $.trim(ligne.replace(/\s?:/g, ""));
					point_texte = "";
				}
				// Contenu d'article ?
				else{
					point_texte+=ligne+"\n";
				}
			}
			point_title && texte.points.push({
				title: point_title,
				texte: point_texte,
				numero: point_title.match(/\d+/)[0]
			});
		}
	});

	var data = {
		id_hash: texte.id_hash,
		title: texte.title,
		description: texte.description,
		description_title: texte.description_title,
		link: texte.link,
		starts_at: texte.starts_at,
		ends_at: texte.ends_at
	}
	
	db.query("SELECT * FROM textes WHERE id_hash = ?", texte.id_hash, function(err, rows, fields) {
		if (rows.length == 0){
			console.log("NOUVEAU : texte.text");
			db.query("INSERT INTO textes SET ?", data, function(err, result) {
				if (err) throw err;
				texte.id = result.insertId;
				insert_points(texte);
			});
			return;
		}

		texte.id = rows[0].id;

		var starts_at = moment(rows[0].starts_at);
		var texte_start_at = moment(texte.starts_at);
		var ends_at = moment(rows[0].ends_at);
		var texte_ends_at = moment(texte.ends_at);

		if (starts_at < texte_start_at){
			data.starts_at = starts_at.format('YYYY-MM-DD 00:00:00');
		}
		if (ends_at > texte_ends_at){
			data.ends_at = ends_at.format('YYYY-MM-DD 23:59:59');
		}

		db.query("UPDATE textes SET ?  WHERE id_hash = "+texte.id_hash, data, function(err, rows, fields) {
  			if (err) throw err;
		});
		insert_points(texte);
	});
}


function insert_points(texte){
	var point = null;
	for(var i=0; i<texte.points.length; i++){
		point = texte.points[i];
		var data = {
			texte_id: texte.id,
			type: 1,
			numero: point.numero,
			title: point.title,
			content: point.texte
		};

		db.query("INSERT IGNORE INTO points SET ?", data, function(err, result) {
			if (err) throw err;
		});
	}

}

String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0, l = this.length; i < l; i++) {
        char  = this.charCodeAt(i);
        hash  = ((hash<<5)-hash)+char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};












