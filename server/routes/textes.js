var util = require('util');
var moment = require('moment');

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
		csps: [
			{label: "Inconnue", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Agriculteurs exploitants", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Artisans, commerçants et chefs d’entreprises", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Cadres et professions intellectuelles supérieures", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Professions intermédiaires", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Employés", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Ouvriers", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Retraités", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{label: "Autres personnes sans activités professionnelles", pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}}
		],
		genders: [
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}}
		],
		bords: [
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			{pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}}
		],
		ages: {
			'18-25': {pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			'26-35': {pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			'36-50': {pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			'51-75': {pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}},
			'76-99': {pour: {nb:0, label: "pour"}, contre: {nb:0, label: "contre"}, abstention: {nb:0, label: "abstention"}}
		}
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

		numbers[choice].nb++;
		if (vote.gender){
			numbers[choice].genders[vote.gender]++;
			numbers.genders[vote.gender][choice].nb++;
		}
		if (vote.bord){
		    numbers[choice].bords[vote.bord]++;
			numbers.bords[vote.bord][choice].nb++;
		}
		if (vote.csp){
			numbers[choice].csps[vote.csp]++;
			numbers.csps[vote.csp][choice].nb++;
		}
		if (vote.age){
			numbers[choice].ages.push(vote.age);
			if (vote.age >= 18 && vote.age >= 25){
				numbers.ages['18-25'][choice].nb++;
			}
			else if (vote.age >= 26 && vote.age <= 35){
				numbers.ages['26-35'][choice].nb++;
			}
			else if (vote.age >= 36 && vote.age <= 50){
				numbers.ages['36-50'][choice].nb++;
			}
			else if (vote.age >= 51 && vote.age <= 75){
				numbers.ages['51-75'][choice].nb++;
			}
			else if (vote.age >= 76 && vote.age <= 99){
				numbers.ages['76-99'][choice].nb++;
			}
		}
	}

	this.getNumbers = function(){
		return numbers;
	}
}

/*
 * GET users listing.
 */

function alter_texte(mode, texte){
	texte.votes = {
		total: texte.pour + texte.contre + texte.abstention,
		actives: texte.pour + texte.contre,
		pour: {
			label: "pour",
        	nb: texte.pour,
        	perc: Math.round(100 * texte.pour / (texte.pour + texte.contre)),
        	color: '#006DCC'
    	},
    	contre: {
			label: "contre",
        	nb: texte.contre,
        	perc: Math.round(100 * texte.contre / (texte.pour + texte.contre)),
        	color: '#DA4F49'
    	},
		abstention: {
			label: "abstention",
        	nb: texte.abstention,
        	perc: Math.round(100 * texte.abstention / texte.total),
        	color: '#FAA732'
    	}
	};

	texte.votes_assemblee = {
		total: texte.pour_assemblee + texte.contre_assemblee + texte.abstention_assemblee,
		actives: texte.pour_assemblee + texte.contre_assemblee,
		pour: {
			label: "pour",
        	nb: texte.pour_assemblee,
        	perc: Math.round(100 * texte.pour_assemblee / (texte.pour_assemblee + texte.contre_assemblee)),
        	color: '#006DCC'
    	},
    	contre: {
			label: "contre",
        	nb: texte.contre_assemblee,
        	perc: Math.round(100 * texte.contre_assemblee / (texte.pour_assemblee + texte.contre_assemblee)),
        	color: '#DA4F49'
    	},
		abstention: {
			label: "abstention",
        	nb: texte.abstention_assemblee,
        	perc: Math.round(100 * texte.abstention_assemblee / texte.total),
        	color: '#FAA732'
    	}
	};

	texte.mode = mode;
	
	// Pas besoin de ça
	delete texte.pour;
	delete texte.contre;
	delete texte.abstention;
	delete texte.pour_assemblee;
	delete texte.contre_assemblee;
	delete texte.abstention_assemblee;
}

exports.textes = function(req, res){
	
	var sql = 'SELECT * from textes';
	var mode = req.query.mode || false;

	if      (mode == "past")    sql+= ' WHERE ends_at < NOW()';
	else if (mode == "current") sql+= ' WHERE starts_at < NOW() AND ends_at > NOW()';
	else if (mode == "future")  sql+= ' WHERE starts_at > NOW()';

	console.log(sql);
	db.query(sql, function(err, textes, fields) {
  		if (err) throw err;

        for( var i=0, l = textes.length; i<l;i++){
			alter_texte(mode, textes[i]);
        }

  		res.json(textes);
	});
};


exports.show = function(req, res){
	db.query('SELECT * from textes WHERE id = ?', [req.params.texte_id], function(err, rows, fields) {
  		if (err) throw err;
  		if (req.xhr){
  			alter_texte("past", rows[0]);
  			var current   = moment(),
  				starts_at = moment(rows[0].starts_at),
  				ends_at   = moment(rows[0].ends_at);

  			if (ends_at < current)
  				rows[0].mode = "past";
  			else if (starts_at < current && ends_at > current)
  				rows[0].mode = "current";
  			else
  				rows[0].mode = "future";

  			get_stats(rows[0]);
  		}
  		else
  			res.render('index', { title: 'Express' });
	});

	function get_stats(texte){

		var stats = new StatsClass();

		db.query('SELECT * from votes_anon WHERE texte_id = ?', [req.params.texte_id], function(err, rows, fields) {
			for( var i=0; i<rows.length; i++){
				stats.addVote(rows[i]);
			}
			texte.stats = stats.getNumbers();
			res.json(texte);
		});
	}

};

exports.vote = function(req, res){

	set_user_vote();
	
	function set_user_vote(){
		// Set texte voted for user
		db.query("INSERT INTO votes SET ?", {
			user_id: req.body.user_id,
			texte_id: req.params.texte_id
		}, function(err, rows, fields) {
	  		if (err) {
				res.json({
					success: false,
					msg: err.message
				});
	  		}
	  		get_user_data();
		});
	}

	function get_user_data(){
		db.query("SELECT * FROM users WHERE id = ?", req.body.user_id, function(err, rows, fields) {
	  		if (err) {
				res.json({
					success: false,
					msg: err.message
				});
	  		}

	  		set_anon_vote(rows[0]);
		});
	}

	function set_anon_vote(infos){
		var data = {
			texte_id: req.params.texte_id,
			gender: infos.gender,
			bord: infos.bord,
			csp: infos.csp,
			age: infos.age
		}

		db.query("INSERT INTO votes_anon SET ?", data, function(err, rows, fields) {
	  		if (err) {
				res.json({
					success: false,
					msg: err.message
				});
	  		}
	  		update_stats();
		});
	}

	function update_stats(){
		// Update texte statistics
		var user_vote = parseInt(req.body.user_vote,10);
		if      (user_vote == 1) var choice = "pour";
		else if (user_vote == 2) var choice = "contre";
		else if (user_vote == 0) var choice = "abstention";

		db.query("UPDATE textes SET "+choice+" = "+choice+" + 1 WHERE id = ?", [req.params.texte_id]
		, function(err, rows, fields) {
	  		if (err) throw err;
			res.json({success: true});
		});
	}

};