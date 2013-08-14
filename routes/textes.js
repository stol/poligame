var util = require('util');
/*
 * GET users listing.
 */

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
        	textes[i].votes = {
        		total: textes[i].pour + textes[i].contre + textes[i].abstention,
        		actives: textes[i].pour + textes[i].contre,
				pour: {
                	nb: textes[i].pour,
                	perc: Math.round(100 * textes[i].pour / (textes[i].pour + textes[i].contre))
            	},
            	contre: {
                	nb: textes[i].contre,
                	perc: Math.round(100 * textes[i].contre / (textes[i].pour + textes[i].contre))
            	},
				abstention: {
                	nb: textes[i].abstention,
                	perc: Math.round(100 * textes[i].abstention / textes[i].total)
            	}
        	};
        	textes[i].mode = mode;
        	
        	// Pas besoin de ça
        	delete textes[i].pour;
        	delete textes[i].contre;
        	delete textes[i].abstention;
        }

  		res.json(textes);
	});
};


exports.show = function(req, res){
	db.query('SELECT * from textes WHERE id = ?', [req.params.texte_id], function(err, rows, fields) {
  		if (err) throw err;
  		if (req.xhr)
  			res.json(rows[0]);
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