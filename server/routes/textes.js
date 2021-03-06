var   moment  = require('moment')
	, _       = require('underscore')
	,  q      = require('q')
    , User    = require('../models/user.js')
  	, Texte   = require('../models/texte.js')
    , defines = require('../defines.js')
    , request = require('request')
;





function textes(req, res){
  	if (!req.xhr){
		res.render('index.twig', {
			title: 'Moi, citoyen'
			,og_url: req.protocol + "://" + req.get('host') + req.url
		});
		return;
	}

	Texte.fetch(req, res).then(function(textes){
		res.json(textes);
	});
}


function show(req, res){


	Texte.fetch(req, res, {ids: [req.params.texte_id]}).then(function(texte){
		return req.xhr
			? res.json(texte)
			: res.render('index.twig', {
				og_url: req.protocol + "://" + req.get('host') + req.url
				,texte: texte
		});
	});
};


function articles(req, res){
  	if (!req.xhr){
		res.render('index.twig', {
			title: 'Moi, citoyen'
			,og_url: req.protocol + "://" + req.get('host') + req.url
		});
		return;
	}

	db.query('SELECT * from articles WHERE texte_id = ?', [req.params.texte_id], function(err, rows, fields) {
		res.json(rows);
	});
}

function vote(req, res){

	var choice = parseInt(req.body.user_vote,10);

	Texte.fetch(req, res, {ids: [req.body.texte_id]}).then(function(texte){
		return q.all([
			User.getFacebookInfos(req.body.access_token),
			User.get(req.body.user_id)
		])
		 // x2 login
		.then(function(){
			return q.all([set_user_vote(), set_anon_vote(), update_stats()])          // 3x inserts
		})
		.then(function(){
            if (req.body.do_share == 1){
                return publishVote(texte);
            }
		})
	})
	.then(function(){ // Success :)
		res.json({success: true});
	})
	.catch(function(msg){ // Error :(
		res.json(401, {
			success: false,
			message: msg
		});
	});

	function publishVote(texte){
        console.log("PUBLISHING VOTE");
		var deferred = q.defer();

    	if      (choice == defines.VOTE_POUR){
    		var story = 'vote_for';
    	}
    	else if (choice == defines.VOTE_CONTRE){
    		var story = 'vote_against';
    	}	
    	else if (choice == defines.VOTE_CONTRE){
    		var story = 'refrain_from_voting';
    	} 
    	else{
    		deferred.reject("Vote incompris");
    	}

    	var url = 'https://graph.facebook.com/me/mecitizen:'+story;
		request.post({
  			url:     url,
  			form:    { 
				access_token: req.body.access_token,
        		bill: 'http://www.moi-citoyen.com/textes/'+texte.id
  			}
		}, function(error, response, body){
			deferred.resolve();
		});

    	return deferred.promise;
	}

	function set_user_vote(){
		var deferred = q.defer();

		// Set texte voted for user
		db.query("INSERT IGNORE INTO votes SET ?", {
			user_id: req.body.user_id,
			obj_id: req.body.article_id || req.params.texte_id,
			obj_type: req.body.article_id ? TYPE_ARTICLE : TYPE_TEXTE
		}, function(err, rows, fields) {
	  		if (err) {
	  			deferred.reject(err.message);
	  		}
	  		else{
	  			deferred.resolve();
	  		}
		});
		return deferred.promise;
	}

	function set_anon_vote(){
		var deferred = q.defer();

		var data = {
			obj_id: req.body.article_id || req.params.texte_id,
			obj_type: req.body.article_id ? TYPE_ARTICLE : TYPE_TEXTE,
			choice : choice,
			gender: req.body.gender,
			bord: req.body.bord,
			csp: req.body.csp,
			age: req.body.age
		}

		db.query("INSERT IGNORE INTO votes_anon SET ?", data, function(err, rows, fields) {
	  		if (err) {
	  			deferred.reject(err.message);
	  			return;
	  		}
	  		else{
	  			deferred.resolve();
	  		}
		});
		return deferred.promise;
	}

	function update_stats(){
		var deferred = q.defer();

  		if (req.body.article_id){
  			deferred.resolve();
  		}
  		else{
			// Update texte statistics
			var user_vote = parseInt(req.body.user_vote,10);
			if      (user_vote == 1) var choice = "pour";
			else if (user_vote == 2) var choice = "contre";
			else if (user_vote == 0) var choice = "abstention";

			db.query("UPDATE bills SET "+choice+" = "+choice+" + 1 WHERE id = ?", [req.params.texte_id], function(err, rows, fields) {
		  		if (err) {
		  			deferred.reject(err.message);
		  		}
		  		else{
		  			deferred.resolve();
		  		}
			});
  		}

		return deferred.promise;
	}

};


exports.textes   = textes;
exports.show     = show;
exports.articles = articles;
exports.vote     = vote;
