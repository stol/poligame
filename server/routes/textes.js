var util = require('util');
var moment = require('moment');

function pourObj(){
	this.nb = 0;
	this.label = "pour";
	this.color = "#006DCC"
}

function contreObj(){
	this.nb = 0;
	this.label = "contre";
	this.color = "#DA4F49"
}

function abstentionObj(){
	this.nb = 0;
	this.label = "abstention";
	this.color = "#FAA732"
	
}

function globalVoteObj(){
	this.pour = new pourObj();
	this.contre = new contreObj();
	this.abstention = new abstentionObj();
}

function voteObj(vote){
	var pour       = {nb:0, label: "pour", color: "#006DCC"};
	var contre     = {nb:0, label: "contre", color: "#DA4F49"};
	var abstention = {nb:0, label: "abstention", color: "#FAA732"};
	var vote       = {
		pour : pour,
		contre: contre,
		abstention: abstention
	};

	if (vote == "pour")
		return pour;
	else if (vote == "contre")
		return vote.contre;
	else if (vote == "abstention")
		return vote.abstention;
	else
		return vote;
}

function voteObj2(vote){
	if (vote == "pour")
		return new pourObj();
	else if (vote == "contre")
		return new contreObj();
	else if (vote == "abstention")
		return new abstentionObj();
	else
		return new globalVoteObj();
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
		csps: [
			{label: "N/A", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Agriculteurs exploitants", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Artisans, commerçants et chefs d’entreprises", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Cadres et professions intellectuelles supérieures", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Professions intermédiaires", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Employés", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Ouvriers", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Retraités", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Autres personnes sans activités professionnelles", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")}
		],
		genders: [
			{ label :"N/A", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{ label :"Homme", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{ label :"Femme", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")}
		],
		bords: [
			{label: "N/A", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Extrême gauche", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Gauche", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Centre-gauche", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Centre", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Centre-droit", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Droite", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")},
			{label: "Extrême droite", pour: voteObj2("pour"), contre: voteObj2("contre"), abstention: voteObj2("abstention")}
		],
		ages: {
			'18-25': voteObj2(),
			'26-35': voteObj2(),
			'36-50': voteObj2(),
			'51-75': voteObj2(),
			'76-99': voteObj2()
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

		vote.gender = vote.gender || 0;
		vote.bord   = vote.bord || 0;
		vote.csp    = vote.csp || 0;

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