
/*
 * GET users listing.
 */

exports.login = function(req, res){

	db.query("SELECT * FROM users WHERE provider_user_id = ?", [req.body.provider_user_id], function(err, rows, fields) {
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
		var votes = [{},{},{},{}];
		db.query("SELECT * from votes WHERE user_id = ?", [user.id], function(err, rows, fields) {
			for(var i=0; i<rows.length; i++){
				votes[rows[i].obj_type][rows[i].obj_id] = true;
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

exports.qualified = function(req, res){
	var user_id = parseInt(req.params.user_id,10);
	db.query("UPDATE users SET is_qualified = 1 WHERE id = ?", [user_id], function(err, rows, fields) {
  		if (err) throw err;
		res.json({ success: true});
	});
}

exports.update = function(req, res){
	var user_id = parseInt(req.params.user_id,10);
	
	delete req.body.votes_nb;
	
	db.query("UPDATE users SET ?  WHERE id = "+user_id, req.body, function(err, rows, fields) {
  		if (err) throw err;
		
		res.json({ success: true});

	});


}



exports.show = function(req, res){
	
	if (req.xhr){
		db.query("SELECT * FROM users WHERE id = ?", [req.params.user_id], function(err, rows, fields) {
	  		if (err) throw err;

			res.json(rows[0]);

		});

	}
	else{
		res.render('index', { title: 'Express' });
	}
}


