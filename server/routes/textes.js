var moment = require('moment')
	, _ = require('underscore')
	, q = require('q')
    , User = require('../models/user.js');

function voteObj(label){
	this.pour = {
		nb   : 0,
		label: "pour",
		color: "#006DCC"		
	}
	this.contre = {
		nb   : 0,
		label: "contre",
		color: "#DA4F49"		
	}
	this.abstention = {
		nb   : 0,
		label: "abstention",
		color: "#FAA732"
	}
	this.label = label;

}

function voteObjs(labels){
	var ret = [];
	for (var i=0; i<labels.length; i++){
		ret.push(new voteObj(labels[i]));
	}
	return ret;
}

function StatsClass(){
	var numbers = {
		pour : {
			nb:   0,
			genders: [0,0,0],
			csps:    [0,0,0,0,0,0,0,0,0],
			bords:   [0,0,0,0,0,0,0,0],
			ages:    []
		},
		contre : {
			nb:   0,
			genders: [0,0,0],
			csps:     [0,0,0,0,0,0,0,0,0],
			bords:   [0,0,0,0,0,0,0,0],
			ages:    []
		},
		abstention : {
			nb:   0,
			genders: [0,0,0],
			csps:    [0,0,0,0,0,0,0,0,0],
			bords:   [0,0,0,0,0,0,0,0],
			ages:    []
		},
		csps: voteObjs([
				"N/A" , "Agriculteurs exploitants" , "Artisans, commerçants et chefs d’entreprises",
				"Cadres et professions intellectuelles supérieures" , "Professions intermédiaires" ,
				"Employés", "Ouvriers", "Retraités", "Autres personnes sans activités professionnelles"]),
		genders: voteObjs(["N/A", "Homme", "Femme"]),
		bords: voteObjs(["N/A", "Extrême gauche", "Gauche", "Centre-gauche", "Centre", "Centre-droit", "Droite", "Extrême droite"]),
		ages: voteObjs(['N/A', '18-25 ans', '26-35 ans', '36-50 ans', '51-75 ans', '76-99 ans'])
	}

	this.addVote = function (vote){

		if (vote.choice == 1)
			var choice = "pour";
		else if (vote.choice == 2)
			var choice = "contre";
		else if (vote.choice == 3)
			var choice = "abstention";
		else
			return;

		vote.gender = vote.gender || 0;
		vote.bord   = vote.bord || 0;
		vote.csp    = vote.csp || 0;
		vote.age    = vote.age || 0;

		// Inc du pour/contre/abst global
		numbers[choice].nb++;

		// Inc du pour/contre/abst pour le genre
		numbers[choice].genders[vote.gender]++;
		numbers.genders[vote.gender][choice].nb++;

		// Inc du pour/contre/abst pour le bord
	    numbers[choice].bords[vote.bord]++;
		numbers.bords[vote.bord][choice].nb++;

		// Inc du pour/contre/abst pour la csp
		numbers[choice].csps[vote.csp]++;
		numbers.csps[vote.csp][choice].nb++;

		// Inc du pour/contre/abst pour l'age
		numbers[choice].ages.push(vote.age);
		if (vote.age >= 18 && vote.age <= 25){
			numbers.ages[1][choice].nb++;
		}
		else if (vote.age >= 26 && vote.age <= 35){
			numbers.ages[2][choice].nb++;
		}
		else if (vote.age >= 36 && vote.age <= 50){
			numbers.ages[3][choice].nb++;
		}
		else if (vote.age >= 51 && vote.age <= 75){
			numbers.ages[4][choice].nb++;
		}
		else if (vote.age >= 76 && vote.age <= 99){
			numbers.ages[5][choice].nb++;
		}
		else{
			numbers.ages[0][choice].nb++;
		}
	}

	this.getNumbers = function(){
		return numbers;
	}
}

// Rajoute des données calculées à la volée dans l'object passé en paramètre
function alter_texte(texte){
	
	var total = texte.pour + texte.contre + texte.abstention;

	texte.votes = {
		total: total,
		actives: texte.pour + texte.contre,
		pour: {
			label: "pour",
        	nb: texte.pour,
        	perc: Math.round(100 * texte.pour / total * 10)/10,
        	color: '#006DCC'
    	},
    	contre: {
			label: "contre",
        	nb: texte.contre,
        	perc: Math.round(100 * texte.contre / total * 10)/10,
        	color: '#DA4F49'
    	},
		abstention: {
			label: "abstention",
        	nb: texte.abstention,
        	perc: Math.round(100 * texte.abstention / total * 10)/10,
        	color: '#FAA732'
    	}
	};

	total = texte.pour_assemblee + texte.contre_assemblee + texte.abstention_assemblee
	texte.votes_assemblee = {
		total: total,
		actives: texte.pour_assemblee + texte.contre_assemblee,
		pour: {
			label: "pour",
        	nb: texte.pour_assemblee,
        	perc: Math.round(100 * texte.pour_assemblee / total * 10)/10,
        	color: '#006DCC'
    	},
    	contre: {
			label: "contre",
        	nb: texte.contre_assemblee,
        	perc: Math.round(100 * texte.contre_assemblee / total * 10)/10,
        	color: '#DA4F49'
    	},
		abstention: {
			label: "abstention",
        	nb: texte.abstention_assemblee,
        	perc: Math.round(100 * texte.abstention_assemblee / total * 10)/10,
        	color: '#FAA732'
    	}
	};

	// On détermine le résultat du vote en fonction du vote des députés, s'il y en a
	if (texte.votes_assemblee.total > 0){
		if (texte.votes_assemblee.pour.nb > texte.votes_assemblee.contre.nb && texte.votes_assemblee.pour.nb > texte.votes_assemblee.abstention.nb){
			texte.status = 1;
		}
		else if (texte.votes_assemblee.contre.nb > texte.votes_assemblee.pour.nb && texte.votes_assemblee.contre.nb > texte.votes_assemblee.abstention.nb){
			texte.status = 2;
		}
		else if (texte.votes_assemblee.contre.nb > texte.votes_assemblee.pour.nb && texte.votes_assemblee.contre.nb > texte.votes_assemblee.abstention.nb){
			texte.status = 3;
		}
		else{
			texte.status = 0;
		}
	}

	if (texte.status == 1)
		texte.status_txt = "adopté";
	else if (texte.status == 2)
		texte.status_txt = "rejeté";
	else if (texte.status == 3)
		texte.status_txt = "égalité";
	else
		texte.status_txt = "inconnu";

	// Pas besoin de ça
	delete texte.pour;
	delete texte.contre;
	delete texte.abstention;
	delete texte.pour_assemblee;
	delete texte.contre_assemblee;
	delete texte.abstention_assemblee;
}

function get_stats(texte, callback){
	var stats = new StatsClass();

	db.query('SELECT * from votes_anon WHERE obj_id = ? AND obj_type = ?', [texte.id, texte.type], function(err, rows, fields) {
		for( var i=0; i<rows.length; i++){
			stats.addVote(rows[i]);
		}
		texte.stats = stats.getNumbers();
		callback && callback(texte);
	});
}

function fetch(req, res, params){
	var deferred = q.defer();

	var sql = 'SELECT * from textes';
	var mode = req.query.mode || (params && params.mode) || false;


	if      (mode == "past")    sql+= ' WHERE ends_at < NOW()';
	else if (mode == "present") sql+= ' WHERE starts_at < NOW() AND ends_at > NOW()';
	else if (mode == "future")  sql+= ' WHERE starts_at > NOW()';

	var ids = (req.query.ids && _.isString(req.query.ids) && JSON.parse(req.query.ids)) || (params && params.ids) || false;
	if (ids){
		sql+= ' WHERE id IN('+ids.join(',')+')';
	}

	if      (mode == "past")    sql+= ' ORDER BY ends_at DESC';
	else if (mode == "present") sql+= ' ORDER BY ends_at ASC';
	else if (mode == "future")  sql+= ' ORDER BY starts_at ASC';

	var limit = (req.query.limit && parseInt(req.query.limit,10)) || (params && params.limit) || false;
	if (limit){
		sql+= ' LIMIT '+limit;
	}

	db.query(sql, function(err, textes, fields) {
  		if (err) throw err;

  		var stats_done = 0;

  		if (textes.length == 0){
  			deferred.resolve([]);
  			return;
  		}

        for( var i=0; i<textes.length; i++){
			textes[i].mode = mode;

			var present   = moment(),
				starts_at = moment(textes[i].starts_at),
				ends_at   = moment(textes[i].ends_at);

			if (ends_at < present){
				textes[i].mode = "past";
			}
			else if (starts_at < present && ends_at > present){
				textes[i].mode = "present";
			}
			else{
				textes[i].mode = "future";
			}

			alter_texte(textes[i]);

			get_stats(textes[i], function(){
				if (++stats_done == textes.length){
					if(ids && ids.length == 1){
						deferred.resolve(textes[0]);
						return;
					}
					else{
						deferred.resolve(textes);
						return;
					}
					
				}
			})
        }
	});

	return deferred.promise;
};

function textes(req, res){
  	if (!req.xhr){
		res.render('index.twig', {
			title: 'Moi, président'
			,og_url: req.protocol + "://" + req.get('host') + req.url
		});
		return;
	}

	fetch(req, res).then(function(textes){
		res.json(textes);
	});
}


function show(req, res){


	fetch(req, res, {ids: [req.params.texte_id]}).then(function(texte){
		return req.xhr
			? res.json(texte)
			: res.render('index.twig', {
				title: 'Express'
				,og_url: req.protocol + "://" + req.get('host') + req.url
				,texte: texte
		});
	});
};


function articles(req, res){
  	if (!req.xhr){
		res.render('index.twig', {
			title: 'Moi, président'
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
	if (choice !== 0 && choice !== 1 && choice !== 2){
		res.json(401, {
			success: false,
			message: "Wrong choice"
		});
		return;
	}


	q.all([User.getFacebookInfos(req.body.access_token), User.get(req.body.user_id)]) // x2 login
		.then(function(){
			return q.all([set_user_vote(), set_anon_vote(), update_stats()])          // 3x inserts
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

	function set_user_vote(){
		var deferred = q.defer();

		// Set texte voted for user
		db.query("INSERT INTO votes SET ?", {
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

		db.query("INSERT INTO votes_anon SET ?", data, function(err, rows, fields) {
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

			db.query("UPDATE textes SET "+choice+" = "+choice+" + 1 WHERE id = ?", [req.params.texte_id], function(err, rows, fields) {
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
