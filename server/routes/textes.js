var util = require('util');
var moment = require('moment');
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
  			res.json(rows[0]);
  		}
  		else
  			res.render('index', { title: 'Express' });
	});
};

exports.vote = function(req, res){

	set_vote();
	
	function set_vote(){
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