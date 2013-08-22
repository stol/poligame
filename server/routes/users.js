
/*
 * GET users listing.
 */

exports.login = function(req, res){

	db.query("SELECT * from users WHERE provider_user_id = ?", [req.body.provider_user_id], function(err, rows, fields) {
  		if (err) throw err;

  		if (!rows.length){
  			db.query('INSERT INTO users SET ? ', req.body, function(err, result){
  				req.body.id = result.insertId;
  				get_votes(req.body);
  			});
  		}
  		else{
  			get_votes(rows[0]);
  		}
	});

	function get_votes(user){
		var votes = {};
		db.query("SELECT * from votes WHERE user_id = ?", [user.id], function(err, rows, fields) {
			for(var i=0; i<rows.length; i++){
				votes[rows[i].texte_id] = true;
			}
			console.log("VOTES = ", votes);
			user.votes_nb = rows.length;
			res.json({
				infos: user,
				votes: votes
			});
		});

	}

};