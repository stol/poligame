
/*
 * GET users listing.
 */

exports.login = function(req, res){
	console.log("LOGIN : ", req.body);
	var query =  "SELECT * from users WHERE provider_user_id = '"+req.body.provider_user_id+"'";
	
	console.log(query);
	db.query(query, function(err, rows, fields) {
  		if (err) throw err;

		console.log("RES : ", rows);

  		if (!rows.length){
  			console.log("INSERTING DATA...")
  			db.query('INSERT INTO users SET ? ', req.body);
  			req.body.votes = [[],[],[]];
			res.json(req.body);
  		}
  		else{
  			rows.votes = [[],[],[]];
  			res.json(rows[0]);
  		}

  		
	});
};