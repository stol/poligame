"use strict";

var Crawler = require("crawler").Crawler
	, moment  = require("moment")
    , mysql = require('mysql')
    , q = require('q')
;

var TYPE_TEXTE = 1,
	TYPE_ARTICLE = 2,
	TYPE_AMENDEMENT = 3;


if (process.env.NODE_ENV && "production" == process.env.NODE_ENV){
	var db = mysql.createConnection({
	    host     : 'localhost',
	    user     : 'stol',
	    password : 'Je suis une chaise',
	    database : 'stol'
	});
}
else{
	var db = mysql.createConnection({
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
/*
parse_lois_en_preparation()
.then(parse_lois_votees)
.then(parse_liste_scrutins)
.then(function(){
    console.log("DONE");
})
*/
parse_agenda();


/**
 * Analyse de la liste des lois en préparation
 */
function parse_lois_en_preparation(){
    var deferred = q.defer();

    // On part de la liste des lois en préparation de legifrance
    c.queue([{
        uri: "http://www.legifrance.gouv.fr/affichLoiPreparation.do",
        callback: function(error,result, $) {
            // On trouve toutes les années (ou juste 2013 en l'occurence)
            var $year_titles = $("[id^='an2013']");

            if (!$year_titles.length){
                console.log("ALERTE : parse_lois_en_preparation => aucune trouvée !!!");
                deferred.resolve();
                return;
            }
            // on boucle sur chaque année et on cherche les lois en préparation
            $year_titles.each(function(i, year_tit){
                var year = $.trim($(year_tit).text())
                var total = $(year_tit).next().find("li a").length;
                var done = 0;
                $(year_tit).next().find("li a").each(function(i, a){
                    var texte = {};

                    // Le titre de la loi
                    texte.title = $.trim($(a).text());

                    // Url légifrance de la loi
                    texte.url_lf = "http://www.legifrance.gouv.fr/"+$(a).attr("href").replace(/jsessionid=[^?]+/, "");

                    // On lance la cascade d'analyse des pages liées
                    parse_legifrance(texte)
                    .then(parse_gouvernement)
                    .then(function(texte){
                        if (texte.starts_at && texte.ends_at){
                            console.log((done+1)+"/"+total+" : " + texte.title + " du "+texte.starts_at.format('DD/MM/YYYY')+" au "+texte.ends_at.format('DD/MM/YYYY'));
                        }
                        else{
                            console.log((done+1)+"/"+total+" : " + texte.title + " (dates inconnues)");
                        }
                        
                        // insertion dans la BDD !
                        delete texte.url_communique;
                        db.query("INSERT INTO bills SET ?", texte, function(err, result) {
                            if (err) throw err;
                            
                            // Tout a été analysé ? On le signale
                            if (++done == total){
                                deferred.resolve();
                            }
                        });
                    });
                });
            });
        }
    }]);
    return deferred.promise;
}


/**
 * Analyse d'une page de détail sur légifrance
 * ex : http://www.legifrance.gouv.fr/affichLoiPreparation.do;?idDocument=JORFDOLE000028196681&type=general
 */

function parse_legifrance(texte){
    var deferred = q.defer();

    // Analyse du détail de la page légifrance de la loi
    c.queue([{
        uri: texte.url_lf,
        callback: function (error,result, $){
            // Le titre du communiqué
            texte.communique_title = $.trim($("a:contains('Communiqué de presse')").text()) || false;

            // Le lien vers le communiqué
            texte.url_communique = $("a:contains('Communiqué de presse')").attr("href") || false;

            // Le lien vers le dossier de l'assemblée nationale ?
            texte.url_an = $('a:contains("Dossier législatif de l\'Assemblée nationale")').attr("href").replace(/#.*/,'') || false;

            // Le lien vers le dossier du sénat ?
            texte.url_sn = $('a:contains("Dossier législatif du Sénat")').attr("href").replace(/#.*/,'') || false;
            
            // Les dates de début et de fin du débat, pour matcher 
            // Débats parlementaires (Procédure accélérée)
            //     Assemblée nationale (1ère lecture)
            //         .titre2 : Compte rendu intégral des séances du XXXX 2013
            //         .titre2 Compte rendu intégral des séances du XXXX 2013
            //         etc
            // puis nettoyage pour n'avoir que la date

            var $dates = $(".titre0:contains('Débats parlementaires')")
                .next().find(".titre1:contains('Assemblée nationale')")
                .next().find("> li").find(".titre2").each(function(i, date){

                    // Nettoyage et parsage de la date
                    date = $(date).text().replace('Compte rendu intégral des séances du ', '').replace("1er", "1");
                    var m = moment(date, "D MMM YYYY");

                    // Date invalide ? On stop là pour cette date
                    if (!m.isValid()){ 
                        console.log("ERR : "+date+" INVALIDE");
                        return;
                    }
                    texte.starts_at = texte.starts_at || m;
                    texte.ends_at   = m;
                });

            deferred.resolve(texte);
        }
    }]);

    return deferred.promise;
}

/**
 * Analyse une page de détail sur le site du gouvernement
 * ex : http://www.gouvernement.fr/gouvernement/loi-de-finances-rectificative-pour-2013
 */

function parse_gouvernement(texte){
    var deferred = q.defer();

            
    if (!texte.url_communique){
        deferred.resolve(texte);
    }
    else{
        c.queue([{
            uri: texte.url_communique,
            callback: function (error,result, $){
                texte.communique = $(".field-field-body").text();
                texte.communique = $(".field-field-body").text();

                deferred.resolve(texte);
            }
        }]);
    }

    return deferred.promise;
}

/**
 * Analyse de la liste des lois déjà voitées
 */
function parse_lois_votees(){
    var deferred = q.defer();
    // On part de la liste des lois en préparation de legifrance
    c.queue([{
        uri: "http://www.legifrance.gouv.fr/affichLoiPubliee.do",
        callback: function(error,result, $) {
            // On trouve toutes les années (ou juste 2013 en l'occurence)
            var $year_titles = $("[id^='an2013']");

            if (!$year_titles.length){
                console.log("ALERTE : parse_lois_en_preparation => aucune trouvée !!!");
                deferred.resolve();
                return;
            }

            // on boucle sur chaque année et on cherche les lois en préparation
            $year_titles.each(function(i, year_tit){
                var year = $.trim($(year_tit).text())
                var total = $(year_tit).next().find("li a").length;
                var done = 0;
                $(year_tit).next().find("li").each(function(i, li){
                    var texte = {};

                    // Le titre de la loi
                    texte.title = $.trim($(li).text());

                    // Url légifrance de la loi
                    texte.url_lf = "http://www.legifrance.gouv.fr/"+$(li).find("a").attr("href").replace(/jsessionid=[^?]+/, "");

                    // On lance la cascade d'analyse des pages liées
                    parse_legifrance(texte)
                    .then(parse_gouvernement)
                    .then(function(texte){
                        if (texte.starts_at && texte.ends_at){
                            console.log((done+1)+"/"+total+" : " + texte.title + " du "+texte.starts_at.format('DD/MM/YYYY')+" au "+texte.ends_at.format('DD/MM/YYYY'));
                        }
                        else{
                            console.log((done+1)+"/"+total+" : " + texte.title + " (dates inconnues)");
                        }
                        
                        // insertion dans la BDD !
                        delete texte.url_communique;
                        texte.starts_at = texte.starts_at ? texte.starts_at.format('YYYY-MM-DD 00:00:00') : false;
                        texte.ends_at = texte.ends_at ? texte.ends_at.format('YYYY-MM-DD 00:00:00') : false;
                        db.query("INSERT INTO bills SET ?", texte, function(err, result) {
                            if (err) throw err;
                            
                            // Tout a été analysé ? On le signale
                            if (++done == total){
                                deferred.resolve();
                            }
                        });


                    });
                })
            })                
        }
    }]);

    return deferred.promise;
}

/**
 * Analyse de la liste des scrutins de l'assemblée
 */
function parse_liste_scrutins(){
    var deferred = q.defer();

    c.queue([{
        uri: "http://www.assemblee-nationale.fr/14/documents/index-scrutins.asp",
        callback: function (error,result, $){
            var $scrutins = $("tr");

            var total = $scrutins.length
            var done = 0;
            if (!total){
                console.log("ALERTE : aucun scrutin trouvé dans la liste de scrutins");
                deferred.resolve();
            }
            else{
                $scrutins.each(function(i, scrutin){

                    var scrutin_url = "http://www.assemblee-nationale.fr" + $(scrutin).find("td").eq(0).find('a').attr("href");
                    var url_an = "http://www.assemblee-nationale.fr" + $(scrutin).find("td").eq(1).find('a').attr("href")
                        .replace(/#.*/,'');

                    // On cherche la loi existante, en BDD, pour compléter avec les infos
                    db.query("SELECT * FROM bills WHERE url_an = ?", url_an, function(err, textes, fields) {
                        
                        if (textes.length == 1){
                            parse_scrutin(textes[0], scrutin_url).then(function(){
                                console.log("Scrutin "+(done+1)+"/"+total + ": parse OK");
                                if (++done == total){
                                    deferred.resolve();
                                }
                            });
                        }
                        else{
                            console.log("Scrutin "+(done+1)+"/"+total + ": not found in DB ("+url_an+")");
                            if (++done == total){
                                deferred.resolve();
                            }
                        }
                    });
                });
            }
        }
    }]);

    return deferred.promise;
}

/**
 * Analyse d'un scrutin
 */

function parse_scrutin(texte, scrutin_url){
    var deferred = q.defer();
    c.queue([{
        uri: scrutin_url,
        callback: function (error,result, $){
            var total = parseInt($.trim($("#total b").text()),10);
            var pour = parseInt($.trim($("#pour b").text()),10);
            var contre = parseInt($.trim($("#contre b").text()),10);
            var abstention = total - pour - contre;
            var data = {
                 pour_assemblee       : pour
                ,contre_assemblee     : contre
                ,abstention_assemblee : abstention
                ,analysed             : 1
            };
            db.query("UPDATE bills SET ?  WHERE id = "+texte.id, data, function(err, rows, fields) {
                if (err) throw err;
                deferred.resolve();
            });

            
        }
    }]);
    return deferred.promise;
}

/**
 * Analyse de l'agenda de l'assemblée nationale pour tenter d'y comprendre qq chose
 */
function parse_agenda(){
    var deferred = q.defer();

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
                if (   text_content.indexOf("Discussion") !== 0
                    && text_content.indexOf("Suite de la discussion") !== 0
                    && text_content.indexOf("Explications de vote et vote") !== 0
                ){
                    return;
                }

                var texte_link = $(ligne).find("a").attr("href") || '';

                // On nettoie l'url des trucs genre "#xxx"
                if (texte_link.indexOf("#") > 0){
                    texte_link = texte_link.substr(0, texte_link.indexOf("#"));
                }

                // Pas de lien pour le texte = pas de id_hash, donc on peut pas savoir s'il existe dans la liste ou pas 
                if (!texte_link){
                    return;
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

    return deferred.promise;
}


/*
db.query("SELECT * FROM textes WHERE id_hash = ?", texte.id_hash, function(err, rows, fields) {
        if (rows.length == 0){
}
*/