
/*
 * GET users listing.
 */

exports.list = function(req, res){
	db.query('SELECT * from questions', function(err, rows, fields) {
  		if (err) throw err;

  		console.log('sql result = ', rows);
  		res.json(rows);
	});
};

exports.vote = function(req, res){

	var sql = "INSERT IGNORE INTO votes (user_id, question_id) VALUES (?,?)";

	db.query(sql, function(err, rows, fields) {
  		if (err) throw err;

  		res.json({success: true});
	});
};