// FIXME : vérifier
// DOUBLES LOIS : 
// - http://www.assemblee-nationale.fr/14/dossiers/contrat_de_generation.asp
// - http://www.assemblee-nationale.fr/14/dossiers/actualisation_dispositions_Nouvelle-Caledonie.asp
// - http://www.assemblee-nationale.fr/14/dossiers/non-cumul_executif_local_depute_senateur.asp
// - http://www.assemblee-nationale.fr/14/dossiers/transparence_vie_publique_pjl.asp
// - http://www.assemblee-nationale.fr/14/dossiers/reduction_activite_moniteurs_ski.asp
// - http://www.assemblee-nationale.fr/14/dossiers/art11_Constitution_pl.asp


// http://www.assemblee-nationale.fr/14/dossiers/acces_logement_urbanisme_renove.asp


"use strict";

var Crawler = require("crawler").Crawler
    , defines = require('../server/defines.js')
    , moment  = require("moment")
    , mysql = require('mysql')
    , _ = require('underscore')
    , q = require('q')
;

var c = new Crawler({
    maxConnections: 2,
    forceUTF8: true
});


// On part de la liste des lois en préparation de legifrance
c.queue([{
    uri: 'http://www.assemblee-nationale.fr/14/documents/index-proposition.asp',
    callback: function(error,result, $) {

        // enlever ce qu'il y a avant le mot, + le mot
        var cut_after = [
            'visant à',
            'tendant à',
            'permettant',
            'visant au',
            'portant'
        ]

        // enlever ce qu'il y a avant le mot
        var cut_before = [
            'obligeant',
            'renforçant',
            'instituant',
            'instaurant',
            'interdisant',
            "l'obligation",
            "l'interdiction",
            'organisant',
            'rendant obligatoire',
            'relative à',
            'relative au',
            'relative aux',
            'supprimant'
        ]
        var themes = {
            divers:{
                pattern: '457654',
                lois : []
            },
            relative:{
                pattern: 'relative',
                lois : []
            },
            supprimer: {
                pattern: 'supprim',
                lois : []
            },
            remplacer: {
                pattern: 'rempla',
                lois : []
            },
            compléter: {
                pattern: 'complét',
                lois : []
            },
            interdire: {
                pattern: 'interdi',
                lois : []
            },
            autoriser: {
                pattern: 'autoris',
                lois : []
            },
            renforcer: {
                pattern: 'renfor',
                lois : []
            },
            garantir : {
                pattern: 'garanti',
                lois : []
            },
            permettre: {
                pattern: 'permett',
                lois : []
            },
            encadrer : {
                pattern: 'encadr',
                lois : []
            },
            limiter  : {
                pattern: 'limit',
                lois : []
            },
            établir  : {
                pattern: 'établi',
                lois : []
            },
            rétablir : {
                pattern: 'rétabli',
                lois : []
            },
            lutter   : {
                pattern: '(faire de la |déclarer la )?lutt',
                lois : []
            },
            faciliter: {
                pattern: 'facilit',
                lois : []
            },
            protéger:{
                pattern: 'protég',
                lois : []
            },
            élargir:{
                pattern: 'élargi',
                lois : []
            },
            restreind:{
                pattern: 'restrei',
                lois : []
            },
            accorder:{
                pattern: 'accord',
                lois : []
            },
            sanctionner:{
                pattern: 'sanction',
                lois : []
            },
            partager:{
                pattern: 'partag',
                lois : []
            },
            développer:{
                pattern: 'dévelop',
                lois : []
            },
            financer:{
                pattern: 'finan',
                lois : []
            },
            inciter:{
                pattern: 'incit',
                lois : []
            },
            obliger:{
                pattern: '(oblig|rend(re|ant) obligatoire)',
                lois : []
            },
            préciser:{
                pattern: 'précis',
                lois : []
            },
            améliorer:{
                pattern: 'amélior',
                lois : []
            },
            exonérer:{
                pattern: 'exonér',
                lois : []
            },
            baisser:{
                pattern: 'baiss',
                lois : []
            },
            favoriser:{
                pattern: 'favoris',
                lois : []
            },
            assurer:{
                pattern: 'assur',
                lois : []
            },
            répartir:{
                pattern: '(réparti|prendre des mesures de réparation)',
                lois : []
            },
            réformer:{
                pattern: 'réform',
                lois : []
            },
            adapter:{
                pattern: 'adapt',
                lois : []
            },
            organiser:{
                pattern: 'organis',
                lois : []
            },
            moderniser:{
                pattern: 'modernis',
                lois : []
            },
            préserver:{
                pattern: 'préserv',
                lois : []
            },
            prévenir:{
                pattern: 'préven',
                lois : []
            },
            réglementer:{
                pattern: 'réglement',
                lois : []
            },
            contraindre:{
                pattern: 'contrai(nd|gn)',
                lois : []
            },
            créer:{
                pattern: '(créer|création)',
                lois : []
            },
            informer:{
                pattern: 'inform',
                lois : []
            },
            étendre:{
                pattern: 'étend',
                lois : []
            },
            sécuriser:{
                pattern: 'sécuri',
                lois : []
            },
            instaurer:{
                pattern: '(instaur|institu)',
                lois : []
            },
            abroger:{
                pattern: 'abrog',
                lois : []
            },
            réduire:{
                pattern: '(rédui|diminu)',
                lois : []
            },
            allonger:{
                pattern: '(allong|prolong)',
                lois : []
            },
            fixer:{
                pattern: 'fix',
                lois : []
            },
            assujettir:{
                pattern: 'assujetti',
                lois : []
            },
            simplifier:{
                pattern: 'simplif',
                lois : []
            },
            ratifier:{
                pattern: 'ratifi',
                lois : []
            },
            modifier:{
                pattern: 'modifi',
                lois : []
            },
            accélérer:{
                pattern: 'accélér',
                lois : []
            },
            consacrer:{
                pattern: 'consacr',
                lois : []
            },
            reculer:{
                pattern: 'recul',
                lois : []
            },
            abolir:{
                pattern: 'abolir',
                lois : []
            },
            encourager:{
                pattern: 'encourag',
                lois : []
            },
            majorer:{
                pattern: 'major',
                lois : []
            },
            introduire:{
                pattern: '(ré)?introduire',
                lois : []
            },
            attribuer:{
                pattern: 'attribu',
                lois : []
            },
            renommer:{
                pattern: 'renomm',
                lois : []
            },
            déduire:{
                pattern: 'dédui',
                lois : []
            },
            promouvoir:{
                pattern: 'promouvoir',
                lois : []
            },
            aggraver:{
                pattern: 'aggrav',
                lois : []
            },
            mesurer:{
                pattern: 'mesur',
                lois : []
            },
            démocratiser:{
                pattern: 'démocratis',
                lois : []
            },
            punir:{
                pattern: 'punir',
                lois : []
            },
            identifier:{
                pattern: 'identifi',
                lois : []
            },
            reconnaître:{
                pattern: 'reconna',
                lois : []
            },
            généraliser:{
                pattern: 'généralis',
                lois : []
            },
            intégrer:{
                pattern: 'intégr',
                lois : []
            },
            assouplir:{
                pattern: 'assoupli',
                lois : []
            },
            pérénniser:{
                pattern: 'pérénnis',
                lois : []
            },
            affirmer:{
                pattern: '(ré)?affirm',
                lois : []
            },
            systématiser:{
                pattern: 'systématis',
                lois : []
            },
            réserver:{
                pattern: 'réserv',
                lois : []
            },
            prévoir:{
                pattern: 'prévoir',
                lois : []
            },
            maintenir:{
                pattern: 'mainten',
                lois : []
            },
            alourdir:{
                pattern: 'alourdi',
                lois : []
            },
            inscrire:{
                pattern: 'inscri',
                lois : []
            },
            harmoniser:{
                pattern: 'harmonis',
                lois : []
            },
            actualiser:{
                pattern: 'actuali',
                lois : []
            },
            clarifier:{
                pattern: 'clarifi',
                lois : []
            },
            
        };
        $("tr").each(function(i, tr){
            var txt = $.trim($(tr).text());
            
            var txt_ori = txt;
            //console.log(txt);
            txt = txt
                .replace(/\n|\r/gi, " ")
                .replace(/\s+/gi, " ")
                .replace(/n° *\d+ /gi, "")
                .replace(/(proposition|projet) de loi( organique)?,?/gi, "")
                .replace(/(adopté|modifié)e?,?( avec modifications?)? par l[ae] Sénat/gi, "")
                .replace(/après engagement la procédure accélérée,?/gi, "")
                .replace(/mise? en ligne.*/gi, "")
            
            var cut1 = new RegExp('.*('+cut_after.join('|')+') (.*)', 'gi');
            var cut2 = new RegExp('.*(('+cut_before.join('|')+').*)', 'gi');
            
            txt = txt.replace(cut1, "$2")
                     .replace(cut2, "$1")
                     .replace(/^[ ,]+/gi, "")
                     .replace(/^(mieux |de |n'|d'|l')?/gi, "")

            var found = false;
            $.each(themes, function(i, theme){
                var reg2 = new RegExp('^'+theme.pattern, 'gi');
                if (txt.match(reg2)){
                    theme.lois.push(txt_ori);
                    found = true;
                }
            });
            if (!found){
                console.log(txt);
                //themes.divers.lois.push(txt_ori);
            }

        });

        $.each(themes, function(word, theme){
            theme.word = word;
        });
        themes = _.sortBy(themes, function(theme){ return -theme.lois.length });

        $.each(themes, function(word, theme){
            console.log(theme.lois.length + " visent à "+theme.word);
        });

        process.exit(0)
    }
}]);

