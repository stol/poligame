var moment = require('moment')
	, _ = require('underscore')
	, q = require('q')
    , User = require('../models/user.js')
	, defines = require('../defines.js')
;

exports.fetch = function fetch(mode, textes_ids){
	var deferred = q.defer();

	var single_id = false;
	if (textes_ids){
		if (_.isString(textes_ids)){
			textes_ids = parseInt(textes_ids, 10);
		}

		if (_.isNumber(textes_ids) && !_.isNaN(textes_ids)){
			single_id = true;
			textes_ids = [textes_ids];
		}
		if (!_.isArray(textes_ids)){
			deferred.reject();
			return deferred.promise;
		}
		for (var i=0; i<textes_ids.length; i++){
			if (!_.isNumber(textes_ids[i]) || _.isNaN(textes_ids[i])){
				deferred.reject();
				return deferred.promise;
			}
		}
	}




	selectTextes(mode, textes_ids)
		.then(array2obj)
		.then(selectLinks)
		.then(alterTextes)
		.then(function(textes){
			textes = _.toArray(textes);
			if (single_id && textes.length){
				deferred.resolve(textes[0]);
			}
			else if (single_id && !textes.length){
				deferred.reject();
			}
			else{
				deferred.resolve(textes);
			}
		})
		.fail(function(){
			deferred.reject();
		})

	return deferred.promise;
}

function selectTextes(mode, textes_ids){
	var deferred = q.defer();

	if (_.isArray(textes_ids)){
		return selectTextesByIds(textes_ids);
	}
	else{
		return selectTextesByMode(mode);
	}
}


// Private
function selectLinks(textes){
	var deferred = q.defer();

	if (!_.keys(textes).length){
		deferred.resolve(textes);
		return deferred.promise;
	}

	var sql = "SELECT * FROM links WHERE bill_id IN("
			+ _.pluck(textes, "id").join(',')
			+ ")";

	db.query(sql, function(err, links, fields) {
  		if (err) throw err;
  		for( var i=0;i<links.length; i++){
  			textes[links[i].bill_id].links = textes[links[i].bill_id].links || [];
  			textes[links[i].bill_id].links.push(links[i]);
  		}

  		deferred.resolve(textes);
  	});

	return deferred.promise;

}

// Converti l'array en object dont chaque clé est un ID
function array2obj(textes){
	var deferred = q.defer();

	var textesObj = {};

	for(var i=0; i<textes.length; i++){
		textesObj[textes[i].id] = textes[i];
	}

	deferred.resolve(textesObj);

	return deferred.promise;
}
// Private
function selectTextesByIds(textes_ids){
	var deferred = q.defer();

	var sql = 'SELECT bills.id, MAX(lecture) as lecture, MAX(starts_at) AS starts_at, MAX(ends_at) AS ends_at, bills.*'
		+ ' FROM (SELECT bill_id, min(seances.date) AS starts_at, max(seances.date) AS ends_at, lecture FROM seances GROUP BY bill_id, lecture) AS seances'
		+ ' LEFT JOIN bills ON seances.bill_id = bills.id'
		+ ' WHERE seances.bill_id IN('+textes_ids.join(',')+')'
		+ ' GROUP BY id'
		+ ' ORDER BY ends_at DESC'
		+ ' LIMIT 100';

	db.query(sql, function(err, textes, fields) {
  		if (err) throw err;
  		deferred.resolve(textes);
  	});

	return deferred.promise;
}

//Private
function selectTextesByMode(mode){
	var deferred = q.defer();

	mode = mode || false;

	var sql = 'SELECT bills.id, MAX(lecture) as lecture, MAX(starts_at) AS starts_at, MAX(ends_at) AS ends_at, bills.*'
		+ ' FROM (SELECT bill_id, min(seances.date) AS starts_at, max(seances.date) AS ends_at, lecture FROM seances GROUP BY bill_id, lecture) AS seances'
		+ ' LEFT JOIN bills ON seances.bill_id = bills.id';

	if (mode == "past"){
		sql += " WHERE ends_at < '"+moment().format("YYYY-MM-DD")
	}
	else if (mode == "present"){
		sql += " WHERE starts_at < '"+moment().format("YYYY-MM-DD")+"' AND ends_at > '"+moment().format("YYYY-MM-DD")+"'";
	}
	else if (mode == "future"){
		sql += " AWHEREND starts_at > '"+moment().format("YYYY-MM-DD")+"'";
	}

	sql += " GROUP BY id"
		+  " ORDER BY ends_at DESC"
		+  " LIMIT 100";


	db.query(sql, function(err, textes, fields) {
  		if (err) throw err;
  		deferred.resolve(textes);
  	});

	return deferred.promise;
}


function alterTextes(textes){
	var deferred = q.defer();

	textes_nb = _.keys(textes).length;
	if (textes_nb == 0){
		deferred.resolve(textes);
	}
	else{
		stats_done = 0;
		_.each(textes, function(texte){

			alter_texte(texte);

			get_stats(texte).then(function(){
				if (++stats_done == textes_nb){
					deferred.resolve(textes);
				}
			})

		});
	}

	return deferred.promise;
}



// Rajoute des données calculées à la volée dans l'object passé en paramètre
function alter_texte(texte){

	var present   = moment().unix();
	
	texte.starts_at = moment(texte.starts_at).hours(0).minutes(0).seconds(0).unix(),
	texte.ends_at   = moment(texte.ends_at).hours(23).minutes(59).seconds(59).unix();

	if (texte.ends_at < present){
		texte.mode = "past";
	}
	else if (texte.starts_at < present && texte.ends_at > present){
		texte.mode = "present";
	}
	else{
		texte.mode = "future";
	}
	
	var total = texte.pour + texte.contre + texte.abstention;

	texte.votes = {
		total: total,
		actives: texte.pour + texte.contre,
		pour: {
			label: "pour",
        	nb: texte.pour,
        	perc: total ? Math.round(100 * texte.pour / total * 10)/10 : 0,
        	color: '#006DCC'
    	},
    	contre: {
			label: "contre",
        	nb: texte.contre,
        	perc: total ? Math.round(100 * texte.contre / total * 10)/10 : 0,
        	color: '#DA4F49'
    	},
		abstention: {
			label: "abstention",
        	nb: texte.abstention,
        	perc: total ? Math.round(100 * texte.abstention / total * 10)/10 : 0,
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
        	perc: total ? Math.round(100 * texte.pour_assemblee / total * 10)/10 : 0,
        	color: '#006DCC'
    	},
    	contre: {
			label: "contre",
        	nb: texte.contre_assemblee,
        	perc: total ? Math.round(100 * texte.contre_assemblee / total * 10)/10 : 0,
        	color: '#DA4F49'
    	},
		abstention: {
			label: "abstention",
        	nb: texte.abstention_assemblee,
        	perc: total ? Math.round(100 * texte.abstention_assemblee / total * 10)/10 : 0,
        	color: '#FAA732'
    	}
	};

	// On détermine le résultat du vote en fonction du vote des députés, s'il y en a
	if (texte.votes_assemblee.total > 0){
		if (texte.votes_assemblee.pour.nb > texte.votes_assemblee.contre.nb && texte.votes_assemblee.pour.nb > texte.votes_assemblee.abstention.nb){
			texte.status = defines.STATUS_ADOPTE;
		}
		else if (texte.votes_assemblee.contre.nb > texte.votes_assemblee.pour.nb && texte.votes_assemblee.contre.nb > texte.votes_assemblee.abstention.nb){
			texte.status = defines.STATUS_REJETE;
		}
		/*
		else if (texte.votes_assemblee.contre.nb > texte.votes_assemblee.pour.nb && texte.votes_assemblee.contre.nb > texte.votes_assemblee.abstention.nb){
			texte.status = 3;
		}
		*/
		else{
			texte.status = defines.STATUS_PENDING;
		}
	}

	if (texte.status == defines.STATUS_PENDING)
		texte.status_txt = "En cours";
	else if (texte.status == defines.STATUS_REJETE)
		texte.status_txt = "rejeté";
	else if (texte.status == defines.STATUS_ADOPTE)
		texte.status_txt = "adopté";
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



function get_stats(texte){
	var deferred = q.defer();

	var stats = new StatsClass();

	db.query('SELECT * from votes_anon WHERE obj_id = ? AND obj_type = ?', [texte.id, texte.type], function(err, rows, fields) {
		for( var i=0; i<rows.length; i++){
			stats.addVote(rows[i]);
		}
		texte.stats = stats.getNumbers();
		
		deferred.resolve(texte);
	});
	return deferred.promise;
}

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
