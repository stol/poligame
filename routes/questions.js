
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