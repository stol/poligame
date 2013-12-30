var Texte = require('../models/texte.js');

/*
 * GET home page.
 */

exports.index = function(req, res){
	Texte.fetch(req, res).then(function(textes){
	    res.render('index.twig', {
	        title: 'Vous, président'
	        ,textes: textes
	        ,og_url: req.protocol + "://" + req.get('host') + req.url
	    });
	});
};

exports.about = function(req, res){
    res.render('index.twig', {
        title: 'Vous, président',
        og_url: req.protocol + "://" + req.get('host') + req.url
    });
};