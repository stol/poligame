var Texte = require('../models/texte.js');

/*
 * GET home page.
 */

exports.index = function(req, res){
	Texte.fetch(req, res).then(function(textes){
	    res.render('index.twig', {
	        title: 'Moi, citoyen'
	        ,textes: textes
	        ,og_url: req.protocol + "://" + req.get('host') + req.url
	    });
	});
};

exports.about = function(req, res){
    res.render('index.twig', {
        title: 'Moi, citoyen',
        apropos: true,
        og_url: req.protocol + "://" + req.get('host') + req.url
    });
};