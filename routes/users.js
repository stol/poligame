
/*
 * GET users listing.
 */

exports.login = function(req, res){
	console.log("LOGIN : ", req.body);
	db.query('SELECT * from users WHERE provider_user_id = '+req.body.provider_user_id, function(err, rows, fields) {
  		if (err) throw err;

		console.log("RES : ", rows);

  		if (!rows.length){
  			console.log("INSERTING DATA...")
  			db.query('INSERT INTO users SET ? ', req.body);
			res.json(rows[0] || req.body);
  		}
  		else{
  			res.json(rows[0]);
  		}

  		
	});
};