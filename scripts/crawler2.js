"use strict";

var Crawler = require("crawler").Crawler
    , defines = require('../server/defines.js')
	, moment  = require("moment")
    , mysql = require('mysql')
    , q = require('q')
;

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


// MAIN
q.all([
     parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPreparation.do", 1)
    ,parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPubliee.do", 2)
    ,parse_an_lois("http://www.assemblee-nationale.fr/14/documents/index-projets.asp", defines.TYPE_PROJET),
    ,parse_an_lois("http://www.assemblee-nationale.fr/14/documents/index-proposition.asp", defines.TYPE_PROPOSITION)
])
.then(parse_liste_scrutins)             // Parsing des scrutins
.then(parse_agenda)                     // Parsing de la'agenda
.then(function(){
    console.log("Analyse terminée");
    exit(0);
});
//\ END MAIN

/**
 * Analuse d'une liste de lois sur legifrance
 */
function parse_lf_lois(url, mode){
    console.log("(LF_LOIS"+mode+") Analyse des lois en préparation sur LEGIFRANCE");
    var deferred = q.defer();

    // On part de la liste des lois en préparation de legifrance
    c.queue([{
        uri: url,
        callback: function(error,result, $) {
            // On trouve toutes les années 2010+
            var $year_titles = $("[id^='an201']");

            if (!$year_titles.length){
                console.log("ALERTE : parse_lf_lois => aucune trouvée sur "+url);
                deferred.resolve();
                return;
            }

            // on boucle sur chaque année et on cherche les lois en préparation
            $year_titles.each(function(i, year_tit){
                var year = $.trim($(year_tit).text())
                var total = $(year_tit).next().find("li").length;
                var done = 0;
                $(year_tit).next().find("li").each(function(i, li){
                    var texte = {};

                    // Le titre de la loi
                    texte.title = $.trim($(li).text()).replace(/ +\([^)]+\)/,'');

                    if( texte.title.indexOf('Projet de loi') == 0){
                        texte.type = defines.TYPE_PROJET;
                    }
                    else if( texte.title.indexOf('Proposition de loi') == 0){
                        texte.type = defines.TYPE_PROPOSITION;
                    }
                    else if( texte.title.indexOf('LOI') == 0){
                        texte.type = defines.TYPE_LOI;
                    }
                    else{
                        texte.type = defines.TYPE_INCONNU;
                    }

                    // Url légifrance de la loi
                    texte.url_lf = "http://www.legifrance.gouv.fr/"+$(li).find("a").attr("href").replace(/jsessionid=[^?]+/, "");

                    // On lance la cascade d'analyse des pages liées (page détail + page communiqué)
                    parse_legifrance(texte, year)
                    .then(parse_gouvernement)
                    .then(function(texte){
                        // vérification de l'existence du texte dans la BDD
                        db.query("SELECT * FROM bills WHERE url_an = ? OR url_sn = ? OR url_lf = ?", [texte.url_an, texte.url_sn, texte.url_lf], function(err, textes, fields) {
                            if (err) throw err;

                            // Texte déjà existant dans la BDD ?
                            if (textes.length != 0){
                                console.log("LF_LOIS" + mode + " " + year + " " + (done+1) + "/" + total + " | PRESENT : " + texte.title);
                                if (++done == total){
                                    deferred.resolve();
                                }

                                return;
                            }

                            // Texte inexistant : insertion dans la BDD
                            texte.starts_at = texte.starts_at ? texte.starts_at.format('YYYY-MM-DD 00:00:00') : false;
                            texte.ends_at = texte.ends_at ? texte.ends_at.format('YYYY-MM-DD 23:59:59') : false;
                            delete texte.url_communique;
                            db.query("INSERT INTO bills SET ?", texte, function(err, result) {
                                if (err) throw err;
                                if (texte.starts_at && texte.ends_at){
                                    console.log("LF_LOIS" + mode + " " + year + " " + (done+1) + "/" + total + " | ADDED " + texte.title + " du "+texte.starts_at+" au "+texte.ends_at);
                                }
                                else{
                                    console.log("LF_LOIS" + mode + " " + year + " " + (done+1) + "/" + total + " | ADDED " + texte.title + " (dates inconnues)");
                                }
                                
                                // Tout a été analysé ? On le signale
                                if (++done == total){
                                    deferred.resolve();
                                }
                            });
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

function parse_legifrance(texte, year){
    var deferred = q.defer();

    // Analyse du détail de la page légifrance de la loi
    c.queue([{
        uri: texte.url_lf,
        callback: function (error,result, $){
            //console.log("parse_legifrance "+texte.url_lf);
            // Le titre du communiqué
            texte.communique_title = $.trim($("a:contains('Communiqué de presse')").text()) || false;

            // Le lien vers le communiqué
            texte.url_communique = $("a:contains('Communiqué de presse')").attr("href") || false;

            // Le lien vers le dossier de l'assemblée nationale ?
            texte.url_an = ($('a:contains("Dossier législatif de l\'Assemblée nationale")').attr("href") || '').replace(/#.*/,'');

            // Le lien vers le dossier du sénat ?
            texte.url_sn = ($('a:contains("Dossier législatif du Sénat")').attr("href") || '').replace(/#.*/,'');

            // Les dates de début et de fin du débat, pour matcher 
            // Débats parlementaires (Procédure accélérée)
            //     Assemblée nationale (1ère lecture)
            //         .titre2 : Compte rendu intégral des séances du XXXX 2013
            //         .titre2 Compte rendu intégral des séances du XXXX 2013
            //         etc
            // puis nettoyage pour n'avoir que la date

            $(".titre0:contains('Débats parlementaires')")
            .next().find(".titre1:contains('Assemblée nationale')")
            .next().find("> li").find(".titre2").each(function(i, titre){

                // Nettoyage et parsage de la date
                var date = $.trim(
                    $(titre).text()
                    .replace(/Compte[- ]*rendu.* du /, '')
                    .replace("1er", "1")
                    .replace(/ *: */, '')
                    .replace(/\s+/g, ' ')
                );

                if (date.split(' ').length > 3){
                    console.log("LF_DETAIL | ERR : '"+date+"' INVALIDE (d'après '"+$(titre).text()+"') on URL "+texte.url_lf);
                    return;
                }
                if (!moment(date, "D MMM YYYY").isValid()){
                    date+= " "+year;
                    if (!moment(date, "D MMM YYYY").isValid()){
                        console.log("LF_DETAIL | ERR : '"+date+"' INVALIDE (d'après '"+$(titre).text()+"') on URL "+texte.url_lf);
                        return;
                    }
                    else{
                        var m = moment(date, "D MMM YYYY");
                    }
                }
                else{
                    var m = moment(date, "D MMM YYYY");
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
                deferred.resolve(texte);
            }
        }]);
    }

    return deferred.promise;
}


/**
 * Analyse de la liste des scrutins de l'assemblée
 */
function parse_liste_scrutins(){
    console.log("Analyse des scrutins sur l'assemblée nationale");
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
 * Parse une liste de lois sur le site de l'assemblée nationale
 */
function parse_an_lois(url, type){
    console.log("(AN_LOIS"+type+") Analyse d'une liste de lois sur l'assemblée nationale ("+type+")");
    var deferred = q.defer();
    c.queue([{
        uri: url,
        callback: function(error,result, $) {
            var $lignes = $("tr td:nth-child(2)");

            var total = $lignes.length;
            var done = 0;
            $lignes.each(function(i, ligne){
                // pas de lien ? on passe au suivant
                if (!$(ligne).find("a").length){ 
                    if (++done == total){
                        deferred.resolve();
                    }
                    return
                }
                var texte = {
                    title : $.trim($(ligne).text())
                        .replace(/ - .*/, '')
                        .replace(/, (adopté|modifié),? par [^,]+,/ig, "")
                        .replace(/ +Voir le dossier/ig, "")
                        .replace(/ +et qui a.*/ig, "")
                    ,url_an : "http://www.assemblee-nationale.fr" + $(ligne).find("a").attr("href").replace(/#.*/, "")
                    ,type : type
                }

                db.query("SELECT * FROM bills WHERE url_an = ?", texte.url_an, function(err, textes, fields) {
                    // texte déjà présent ? On fait rien
                    if (textes.length != 0){
                        console.log("AN_LOIS"+type+" "+ (done+1) + "/" + total + " | PRESENT : " + texte.url_an);
                        if (++done == total){
                            deferred.resolve();
                        }
                    }

                    // Si texte pas trouvé, on l'ajoute
                    else{
                        parse_an_detail(texte).then(function(texte){
                            texte.starts_at = texte.starts_at ? texte.starts_at.format('YYYY-MM-DD 00:00:00') : false;
                            texte.ends_at = texte.ends_at ? texte.ends_at.format('YYYY-MM-DD 23:59:59') : false;
                            db.query("INSERT INTO bills SET ?", texte, function(err, result) {
                                if (err) throw err;
                                if (texte.starts_at && texte.ends_at){
                                    console.log("AN_LOIS"+type+" "+ (done+1) + "/" + total + " | ADDING " + texte.url_an + " => " +texte.starts_at+" au "+texte.ends_at);
                                }
                                else{
                                    console.log("AN_LOIS"+type+" "+ (done+1) + "/" + total + " | ADDING " + texte.url_an + " (dates inconnues)");
                                }

                                if (++done == total){
                                    deferred.resolve();
                                }
                            });
                        });
                    }
                });
            });
        }
    }]);
    return deferred.promise;
}

// Analyse d'une page de l'assemblée nationale
function parse_an_detail(texte){

    var deferred = q.defer();
    c.queue([{
        uri: texte.url_an,
        callback: function(error,result, $) {

            // Boucle sur les cadres à la con
            var $coms = $("commentaire");
            $coms.each(function(i, commentaire){
                var $ps = $(commentaire).find("td p");

                if ($ps.length != 2){
                    return;
                }
                // Le communiqué ?
                var bloc_title = $.trim($ps.eq(0).text());
                if (bloc_title.indexOf("Extrait") === 0){
                    texte.communique_title = bloc_title;
                    var txt = $.trim($ps.eq(1).html()).replace(/<br ?\/>/g, "\n");
                    texte.communique = $(txt).text();
                }

                // Les dates ?
                var $dates = $("[align=left] :contains('Discussion en séance publique')")
                    .parentsUntil("[align=left]")
                    .nextAll("table")
                    .find("td");

                texte.starts_at = moment(
                    $.trim($dates.first().text())
                        .replace(/^\S+\s+\S+\s+\S+\s+\S+\s+/g, "")
                    ,"D MMMM YYYY"
                );
                texte.ends_at = moment(
                    $.trim($dates.last().text())
                        .replace(/^\S+\s+\S+\s+\S+\s+\S+\s+/g, "")
                    ,"D MMMM YYYY"
                );
                    
                deferred.resolve(texte);

            });
        }
    }]);

    return deferred.promise;
}

/**
 * Analyse de l'agenda de l'assemblée nationale pour tenter d'y comprendre qq chose
 */
function parse_agenda(){
    console.log("Analyse de l'agenda sur l'assemblée nationale");
    var deferred = q.defer();

    c.queue([{
        uri: "http://www.assemblee-nationale.fr/agendas/conference-blanc.asp",
        callback: function(error,result, $) {
            var $dossiers = $('a:contains("voir le dossier")');

            var dossiers = {};

            // On cherche tous les liens vers les dossiers, et on trouve les dates à partir de ça
            // en naviguant dans le DOM
            $dossiers.each(function(i, link){
                var url = "http://www.assemblee-nationale.fr" + $(link).attr("href").replace(/#.*/, "");
                var current_day = "";
                // Alors, ici : 
                // - on remonte les parents jusqu'à --avant-- la racine => une ligne
                // - on cherche tous les titres avant cette ligne
                // - on laisse que ceux qui comportent un mois et on ne prend que le 1er (et sa 1ère case de tableau)
                var date_relative = $(link).parentsUntil("#cblanc").prevAll(".MsoNormalTable").filter(function(){
                    return $(this).text().match(/[mit]/i) // Si 'm' ou 'i' 't' sont présent, c'est qu'il y a un mois
                }).eq(0).find("td").eq(0).text();
                date_relative = $.trim(date_relative).replace(/\s+/g, " ");
                date_relative = moment(date_relative, "dddd DD MMMM").year(moment().year());
                dossiers[url] = dossiers[url] || [];
                dossiers[url].push(date_relative);
            });

            // On cherche la loi à partir du dossier
            // et on détermine la date de début et de fin pour chaque dossier
            var total = Object.keys(dossiers).length
            var done = 0;
            $.each(dossiers, function(url_an, dates){
                db.query("SELECT * FROM bills WHERE url_an = ?", url_an, function(err, textes, fields) {
                    if (err) throw err;
                    if (textes.length != 1){
                        console.log((done+1)+"/"+total+" ERR : "+url_an+" not found in DB");

                        // La loi n'est pas dans la BDD ? On on la réintègre
                        if (++done == total){
                            deferred.resolve();
                        }
                    }
                    else{
                        var data = {
                            starts_at: dates[0].format('YYYY-MM-DD 00:00:00'),
                            ends_at: dates[dates.length-1].format('YYYY-MM-DD 23:59:59'),
                        }

                        db.query("UPDATE bills SET ?  WHERE id = "+textes[0].id, data, function(err, rows, fields) {
                            if (err) throw err;
                            console.log((done+1)+"/"+total+" "+textes[0].title+" => "+data.starts_at+" TO "+data.ends_at);
                            if (++done == total){
                                deferred.resolve();
                            }
                        });
                    }

                });
            });
        }
    }]);

    return deferred.promise;
}
