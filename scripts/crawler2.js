// FIXME : vérifier http://www.assemblee-nationale.fr/14/dossiers/contrat_de_generation.asp


"use strict";

var Crawler = require("crawler").Crawler
    , defines = require('../server/defines.js')
	, moment  = require("moment")
    , mysql = require('mysql')
    , _ = require('underscore')
    , q = require('q')
;

console.log(moment().format("YYYY-MM-DD"));
process.exit(0);

if (process.env.NODE_ENV && "production" == process.env.NODE_ENV){
	var db = mysql.createConnection({
        host     : process.env.DB_HOST,
        user     : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database : process.env.DB_NAME
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
/*
parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPreparation.do", 1)
.then(function(){
    return parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPubliee.do", 2);
})
.then(function(){
    return parse_an_lois("http://www.assemblee-nationale.fr/14/documents/index-projets.asp", defines.TYPE_PROJET);
})
.then(function(){
    return parse_an_lois("http://www.assemblee-nationale.fr/14/documents/index-proposition.asp", defines.TYPE_PROPOSITION)
})
.then(parse_agenda)             // Parsing de l'agenda
.then(parse_liste_scrutins)     // Parsing des scrutins
.then(function(){
    console.log("Analyse terminée");
    process.exit(0)
});
*/
//parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPreparation.do?legislature=14&typeLoi=proj", defines.TYPE_PROJET);
//parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPreparation.do?legislature=14&typeLoi=prop", defines.TYPE_PROPOSITION);
parse_lf_lois("http://www.legifrance.gouv.fr/affichLoiPubliee.do?legislature=14", defines.TYPE_LOI);

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

            var textes = {};

            // On boucle sur chaque année et on cherche les lois en préparation
            $year_titles.each(function(i, year_tit){
                var year = $.trim($(year_tit).text())
                // On boucle sur chaque texte
                $(year_tit).next().find("li").each(function(i, li){
                    var texte = {};

                    texte.year = year;

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
                    texte.url_lf = clean_lf_url("http://www.legifrance.gouv.fr/"+$(li).find("a").attr("href"));

                    textes[texte.url_lf] = textes[texte.url_lf] || texte;
                });
            });

            var total = Object.keys(textes).length
            var done  = 0;

            $.each(textes, function(i, texte){

                select_texte(texte).then(function(texte){
                    console.log("LF_LOIS" + mode + " " + (done+1) + "/" + total);
                    if (++done == total){
                        console.log("LF_LOIS"+mode+" DONE");
                        deferred.resolve();
                    }
                }, function(texte){
                    return parse_legifrance(texte);
                })
                .then(parse_gouvernement)
                .then(insert_texte)
                .then(function(texte){
                    console.log( texte.starts_at && texte.ends_at
                        ? "LF_LOIS" + mode + " " + (done+1) + "/" + total + " | ADDED " + texte.url_lf + " du "+texte.starts_at.format('DD/MM/YYYY')+" au "+texte.ends_at.format('DD/MM/YYYY')
                        : "LF_LOIS" + mode + " " + (done+1) + "/" + total + " | ADDED " + texte.url_lf + " (dates inconnues)"
                    );

                    if (++done == total){
                        console.log("LF_LOIS"+mode+" DONE");
                        deferred.resolve();
                    }
                });
            })
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

    var year = texte.year;

    delete texte.year;

    texte.seances = [];
    
    // Analyse du détail de la page légifrance de la loi
    c.queue([{
        uri: texte.url_lf,
        callback: function (error,result, $){

            // Le titre du communiqué
            texte.communique_title = $.trim($("a:contains('Communiqué de presse')").text()) || false;

            // Le lien vers le communiqué
            texte.url_communique = $("a:contains('Communiqué de presse')").attr("href") || false;

            // Le lien vers le dossier de l'assemblée nationale ?
            texte.url_an = ($("a").filter(function(){
                return $(this).text().match(/dossier légis[lt]atif de l'assemblée nationale/gi)
            }).attr("href") || '').replace(/#.*/,'');

            // Le lien vers le dossier du sénat ?
            texte.url_sn = ($('a:contains("Dossier légis[lt]atif du Sénat")').attr("href") || '').replace(/#.*/,'');

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
                    console.log("\nparse_legifrance | ERR : '"+date+"' INVALIDE (d'après '"+$(titre).text()+"') on URL "+texte.url_lf);
                    return;
                }
                if (!moment(date, "D MMM YYYY").isValid()){
                    date+= " "+year;
                    if (!moment(date, "D MMM YYYY").isValid()){
                        console.log("\nparse_legifrance | ERR : '"+date+"' INVALIDE (d'après '"+$(titre).text()+"') on URL "+texte.url_lf);
                        return;
                    }
                    else{
                        var m = moment(date, "D MMM YYYY");
                    }
                }
                else{
                    var m = moment(date, "D MMM YYYY");
                }
                
                texte.seances.push(m);

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
    console.log("\nAnalyse des scrutins sur l'assemblée nationale");
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
                return;
            }

            $scrutins.each(function(i, scrutin){

                var scrutin_url = "http://www.assemblee-nationale.fr" + $(scrutin).find("td").eq(0).find('a').attr("href");
                var url_an = "http://www.assemblee-nationale.fr" + $(scrutin).find("td").eq(1).find('a').attr("href")
                    .replace(/#.*/,'');

                select_texte({url_an: url_an}).then(function(texte){
                    var temp_url = scrutin_url;
                    parse_scrutin(texte, scrutin_url).then(function(texte){
                        console.log("SCRUTIN "+(done+1)+"/"+total + " | "
                            + "pour: "+texte.pour_assemblee + ", contre: " + texte.contre_assemblee + " abstention: " + texte.abstention_assemblee
                            + " ON " + temp_url
                        );
                        if (++done == total){
                            deferred.resolve();
                        }
                    });
                },function(){
                    console.log("Scrutin "+(done+1)+"/"+total + ": not found in DB : "+url_an);
                    if (++done == total){
                        deferred.resolve();
                    }
                })
            });
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
                pour_assemblee       : pour,
                contre_assemblee     : contre,
                abstention_assemblee : abstention,
                analysed             : 1
            };
            update_texte(texte, data).then(function(texte){
                deferred.resolve(texte);
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

            var textes = {};

            $lignes.each(function(i, ligne){


                if (!$(ligne).find("a").length){ 
                    return;
                }

                var texte = {
                    title : $.trim($(ligne).text())
                        .replace(/ - .*/, '')
                        .replace(/,\s+(adoptée?|modifiée?)(\s+avec\s+modifications?)?,?\s+par\s+[^,]+,/ig, "")
                        .replace(/ +Voir le dossier/ig, "")
                        .replace(/ +et qui a.*/ig, "")
                        .replace(/ - mise en ligne.*/g, "")
                        .replace(/de M.* (visant|tendant|relative|renforçant|instituant|portant|rendant)/g, "$1")
                        .replace(/de M.* (instaurant|concernant|permettant|supprimant|rétablissant|interdisant)/g, "$1")
                        .replace(/de M.* (prescrivant|modifiant|encadrant|décidant|prévoyant|fixant|garantissant|obligeant)/g, "$1")
                        .replace(/de M.* (autorisant|en faveur|facilitant|établissant|créant|pour|sur)/g, "$1")
                    ,url_an : "http://www.assemblee-nationale.fr" + $(ligne).find("a").attr("href").replace(/#.*/, "")
                    ,type : type
                };

                textes[texte.url_an] = textes[texte.url_an] || texte;
            });

            var total = Object.keys(textes).length
            var done = 0;
            $.each(textes, function(i, texte){
                select_texte(texte).then(function(){
                    console.log("AN_LOIS" + type + " " + (done+1) + "/" + total);

                    if (++done == total){
                        console.log("AN_LOIS"+type+" DONE");
                        deferred.resolve();
                    }

                }, parse_an_detail)
                .then(insert_texte)
                .then(function(texte){
                    console.log( texte.starts_at && texte.ends_at
                        ? "AN_LOIS"+type+" "+ (done+1) + "/" + total + " | ADDED " + texte.url_an + " => " +texte.starts_at.format('DD/MM/YYYY')+" au "+texte.ends_at.format('DD/MM/YYYY')
                        : "AN_LOIS"+type+" "+ (done+1) + "/" + total + " | ADDED " + texte.url_an + " (dates inconnues)"
                    );

                    if (++done == total){
                        console.log("AN_LOIS"+type+" DONE");
                        deferred.resolve();
                    }
                });

            });

        }
    }]);
    return deferred.promise;
}

// Analyse d'une page de l'assemblée nationale
// TODO : révupérer le status "voté" ou "adopté"
// DOIT passer :
//     http://www.assemblee-nationale.fr/14/dossiers/loi_programmation_militaire_2014-2019.asp
//     http://www.assemblee-nationale.fr/14/dossiers/avenir_justice_systeme_retraites.asp
//     http://www.assemblee-nationale.fr/14/dossiers/accord_transport_aerien_Canada.asp
//     http://www.assemblee-nationale.fr/14/dossiers/couts_de_la_filiere_nucleaire.asp
function parse_an_detail(texte){

    var deferred = q.defer();

    c.queue([{
        uri: texte.url_an,
        callback: function(error,result, $) {
            /*
            // On choppe le titre si on a pas déjà un
            if (!texte.title){
                texte.title = $.trim($("p font").eq(0).text()).replace(/\s+/g, " ");
            }

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
            });
            */

            // Nettoyage, pour au final avoir un tableau de textes

            $("[border=1], header, script").remove();

            $("body").find("br").replaceWith("[NL]");
            $("body").find("tr").before("\n");

            var content = $("body").text()
                .replace(/\n+/g, "[NL]")
                .replace(/\t+/g, "\t")
                .replace(/ +/g, " ")
                .replace(/\[NL\]/g, "\n")
                .replace(/\n *\n/g, "\n")
            ;

            var lignes1 = content.split("\n");
            var lignes = [];
            for(var i=0, l=lignes1.length; i<l; i++){
                lignes1[i] = $.trim(lignes1[i]);
                if (lignes1[i].length > 0 ){
                    lignes.push(lignes1[i]);
                }
            }

            //console.log(lignes);

            var dates = [];
            var found = -1;
            for(var i=0, l=lignes.length; i<l; i++){
                var ligne = lignes[i];

                if (found == -1){
                

                    if (ligne.match(/Discussion en séance publique/)){
                        //console.log("TROUVE : "+ligne);
                    
                        for( var j=i-1; j>=0; j--){
                            var res = lignes[j].match(/^(Assemblée nationale|Sénat)/ig);
                            if (res && res[0] == "Assemblée nationale"){
                                //console.log("RATTACHE a "+lignes[j]);
                                found = j;
                                break;
                            }
                        }
                        if (found == -1){
                            continue;
                        }
                    }
                }
                else{
                    var res = ligne.match(/^\d+\S+ séance du (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) \d+ \S+ \d+$/gi);
                    if (res){
                        var dt = ligne.replace(/^\d+\S+ séance du (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche) (\d+ \S+ \d+)$/gi, "$2");
                        dates.push(dt);
                    }
                    else{
                        found = -1;
                    }
                }
            }

            //console.log("dates =", dates);


            // on a trouvé des dates ?
            if (dates.length){
                texte.starts_at = moment(dates[0],"D MMMM YYYY");
                texte.ends_at = moment(dates[dates.length-1],"D MMMM YYYY");
            }

            texte.seances = [];

            for( var i=0; i<dates.length; i++){
                texte.seances.push(moment(dates[i],"D MMMM YYYY"));
            }

            /*
            if ($dates.length){

                var hip = $.trim($dates.first().text())
                        .replace(/^\S+\s+\S+\s+\S+\s+\S+\s+/g, "");
                texte.starts_at = moment(hip,"D MMMM YYYY");

                var hop = $.trim($dates.last().text())
                        .replace(/^\S+\s+\S+\s+\S+\s+\S+\s+/g, "");
                texte.ends_at = moment(hop,"D MMMM YYYY");

                console.log("start : " + hip + " => " + texte.starts_at);
                console.log("end : " + hop + " => " + texte.ends_at);
            }
            // Sinon, la version " au cours de la séance du mercredi 17 avril 2013"
            else{
                console.log("PAS DE DATES.Length");
                var str = $("td :contains('Discussion en séance publique'), [align=left] :contains('Discussion en séance publique')")
                    .parentsUntil("[align=left], td")
                    .nextAll("a[href*=seances]").eq(0).text();
                str = $.trim(str.replace(/\s+/g, ' '));
                
                var res = str.match(/\d{1,2}\s+\S+\s+\d+/g);

                if (res){
                    texte.starts_at = moment(res[0] ,"D MMMM YYYY");
                    texte.ends_at = moment(res[0] ,"D MMMM YYYY");
                }
            }
            */
            deferred.resolve(texte);
        }
    }]);

    return deferred.promise;
}

/**
 * Analyse de l'agenda de l'assemblée nationale pour tenter d'y comprendre qq chose
 */
function parse_agenda(){
    console.log("\nAnalyse de l'agenda sur l'assemblée nationale");
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
                // On cherche le texte dans la BDD
                select_texte({url_an: url_an}).then(
                // Présent ? On l'update avec les dates trouvées
                function(texte_db){
                    // le texte enregistré commençait plus tard ?
                    var data = {}
                    if (!texte_db.starts_at || (texte_db.starts_at && texte_db.starts_at.unix() > dates[0].unix())){
                        data.starts_at = dates[0];
                    }
                    if (!texte_db.ends_at || (texte_db.ends_at && texte_db.ends_at.unix() < dates[dates.length-1].unix())){
                        data.ends_at = dates[dates.length-1];
                    }

                    update_texte(texte_db, data).then(function(texte){
                        console.log("AGENDA " + (done+1)+"/"+total+" | UPDATED "+texte.url_an + " du " + texte.starts_at.format('DD/MM/YYYY')+" au "+texte.ends_at.format('DD/MM/YYYY'));
                        if (++done == total){
                            deferred.resolve();
                        }
                    })

                },
                // Absent ? On récup les infos qu'on peu trouver et le créé
                function(){
                    parse_an_detail({url_an: url_an})
                    .then(function(texte){
                        var deferred = q.defer();
                        if (!texte.starts_at || (texte.starts_at && texte.starts_at.unix() > dates[0].unix())){
                            texte.starts_at = dates[0];
                        }
                        if (!texte.ends_at || (texte.ends_at && texte.ends_at.unix() < dates[dates.length-1].unix())){
                            texte.ends_at = dates[dates.length-1];
                        }
                        deferred.resolve(texte);
                        return deferred.promise;
                    })
                    .then(insert_texte)
                    .then(function(texte){
                        console.log("AGENDA " + (done+1)+"/"+total + " | ADDED " + url_an +  " du " + texte.starts_at.format('DD/MM/YYYY')+" au "+texte.ends_at.format('DD/MM/YYYY'));

                        // La loi n'est pas dans la BDD ? On on la réintègre
                        if (++done == total){
                            deferred.resolve();
                        }
                    })
                });
            });
        }
    }]);

    return deferred.promise;
}


/**
 * Renvoie un texte s'il est trouvé dans la BDD
 */
function select_texte(texte){
    var deferred = q.defer();

    // J'ai pas de quoi insert/update le texte ?
    if (!texte.id && !texte.url_an && !texte.url_sn && !texte.url_lf){
        deferred.reject();
        return deferred.promise;
    }

    var sql_select = "SELECT * FROM bills WHERE ";
    var where = []
    var clauses = [];
    if (texte.id){
        where.push("id = ?");
        clauses.push(texte.id);
    }
    if (texte.url_an){
        where.push("url_an = ?");
        clauses.push(texte.url_an);
    }
    if (texte.url_sn){
        where.push("url_sn = ?");
        clauses.push(texte.url_sn);
    }
    if (texte.url_lf){
        where.push("url_lf = ?");
        clauses.push(texte.url_lf);
    }

    sql_select+= where.join(' OR ');

    db.query(sql_select, clauses, function(err, textes, fields) {
        if (textes.length > 0){

            textes[0].starts_at = textes[0].starts_at ? moment(textes[0].starts_at) : false;
            textes[0].ends_at   = textes[0].ends_at   ? moment(textes[0].ends_at) : false;


            deferred.resolve(textes[0]);
        }
        else{
            deferred.reject(texte);
        }
    });
    return deferred.promise;
}

/**
 * Insère ou met à jour le texte. C'est selon :)
 */
function insert_or_update_texte(texte){
    var deferred = q.defer();
    
    delete texte.url_communique;

    select_texte(texte).then(
    // Texte trouvé ?
    function(texte_db){
        update_texte(texte_db, texte).then(function(texte){
            deferred.resolve({texte: texte, code: 1});
        });
    },
    // Texte pas trouvé ?
    function(){
        insert_texte(texte).then(function(texte){
            deferred.resolve({texte: texte, code: 2});
        });
    });

    return deferred.promise;
}

function insert_texte(texte){
    var deferred = q.defer();
    
    var seances = texte.seances || [];
    var starts_at = texte.starts_at || false;
    var ends_at   = texte.ends_at || false;
    texte.starts_at = texte.starts_at ? texte.starts_at.format('YYYY-MM-DD 00:00:00') : false;
    texte.ends_at = texte.ends_at ? texte.ends_at.format('YYYY-MM-DD 23:59:59') : false;
    
    
    delete texte.seances;
    delete texte.url_communique;

    // Requete d'insert

    db.query("INSERT INTO bills SET ?", texte, function(err, result) {

        if (err) throw err;

        texte.id = result.insertId;
        texte.starts_at = starts_at;
        texte.ends_at   = ends_at;
        
        if (seances && seances.length){
            var data = [];
            for( var i=0; i<seances.length; i++){
                data.push([texte.id, seances[i].format("YYYY-MM-DD 00:00:00")]);
            }
            db.query("INSERT IGNORE INTO seances (bill_id, date) VALUES ?", [data]);
        }
        texte.seances = seances;

        deferred.resolve(texte);

    });

    return deferred.promise;
}

/**
 * Update un texte, avec comparaison anciennes/nouvelles values
 * @param texte_db ancien objet
 * @param texte_db nouvel objet
 */
function update_texte(texte_db, texte){
    var deferred = q.defer();

    var starts_at = texte.starts_at || texte_db.starts_at || false;
    var ends_at   = texte.starts_at || texte_db.ends_at || false;

    // Mise à jour de l'obj en BDD d'après le texte passé
    _.each(texte, function(val, key){
        if (texte_db[key] != val){
            texte_db[key] = val;
        }
    });

    texte_db.starts_at = texte_db.starts_at ? texte_db.starts_at.format('YYYY-MM-DD 00:00:00') : false;
    texte_db.ends_at = texte_db.ends_at ? texte_db.ends_at.format('YYYY-MM-DD 23:59:59') : false;
    var seances = texte_db.seances || [];
    delete texte_db.seances;

    // Requete d'update
    db.query("UPDATE bills SET ? WHERE id = "+texte_db.id, texte_db, function(err) {
        if (err) throw err;

        texte_db.starts_at = starts_at;
        texte_db.ends_at   = ends_at;


        if (seances && seances.length){
            var data = [];
            for( var i=0; i<seances.length; i++){
                data.push([texte.id, seances[i].format("YYYY-MM-DD 00:00:00")]);
            }
            db.query("INSERT IGNORE INTO seances (bill_id, date) VALUES ?", [data]);
        }

        texte.seances = seances;

        deferred.resolve(texte_db);

    });

    return deferred.promise;
}


///////////////////////// UTILS /////////////////////
function clean_lf_url(url){
    url = url.replace(/jsessionid=[^?]+/, "")
    return url;
}


