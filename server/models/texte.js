var moment = require('moment')
	, _ = require('underscore')
	, q = require('q')
    , User = require('../models/user.js')
;

exports.fetch = function fetch(req, res, params){
	var deferred = q.defer();

	var sql = 'SELECT * from bills';
	var mode = req.query.mode || (params && params.mode) || false;


	if      (mode == "past")    sql+= ' WHERE ends_at < NOW() AND ends_at <> "0000-00-00 00:00:00"';
	else if (mode == "present") sql+= ' WHERE starts_at < NOW() AND ends_at > NOW()';
	else if (mode == "future")  sql+= ' WHERE starts_at > NOW()';
	else 						sql+= ' WHERE ends_at <> "0000-00-00 00:00:00"';

	var ids = (req.query.ids && _.isString(req.query.ids) && JSON.parse(req.query.ids)) || (params && params.ids) || false;
	if (ids){
		sql+= ' AND id IN('+ids.join(',')+')';
	}

	if      (mode == "past")    sql+= ' ORDER BY ends_at DESC';
	else if (mode == "present") sql+= ' ORDER BY ends_at ASC';
	else if (mode == "future")  sql+= ' ORDER BY starts_at ASC';
	else						sql+= ' ORDER BY ends_at DESC';

	var limit = (req.query.limit && parseInt(req.query.limit,10)) || (params && params.limit) || 100;
	if (limit){
		sql+= ' LIMIT '+limit;
	}

	console.log(sql);

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
