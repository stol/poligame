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

		console.log(textes);

		// Boucle sur chaque texte pour déterminer les dates et lancer le crawl détaillé
		$.each(textes, function(i, texte){
			if (!texte.dates[0]){
				return;
			}

			texte.starts_at = texte.dates[0].format("YYYY-MM-DD 00:00:00");
			texte.ends_at = texte.dates[texte.dates.length-1].format("YYYY-MM-DD 23:59:59");
			console.log(texte.starts_at + " => " + texte.ends_at);

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

	texte.titre = $.trim($("p font").eq(0).text()).replace(/\s+/g, " ");
	console.log("Analysing "+texte.titre+"...");

	// Boucle sur les cadres à la con
	var $coms = $("commentaire");
	$coms.each(function(i, commentaire){
	    var $ps = $(commentaire).find("td p");

		if ($ps.length != 2){
			return;
		}
		var bloc_titre = $.trim($ps.eq(0).text());
		if (bloc_titre.indexOf("Extrait") === 0){
			texte.description_titre = bloc_titre;
			var txt = $.trim($ps.eq(1).html()).replace(/<br ?\/>/g, "\n");
			texte.description = $(txt).text();
		}
	});

	var data = {
		text: texte.titre,
		description: texte.description,
		description_titre: texte.description_titre,
		link: texte.link,
		starts_at: texte.starts_at,
		ends_at: texte.ends_at
	}

	db.query("INSERT INTO textes SET ?", data, function(err, rows, fields) {
		if (err) throw err;
	});

}



















