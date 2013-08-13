var util = require('util');
/*
 * GET users listing.
 */

exports.list = function(req, res){
	db.query('SELECT * from questions', function(err, rows, fields) {
  		if (err) throw err;
  		res.json(rows);
	});
};

exports.vote = function(req, res){

	set_vote();
	
	function set_vote(){
		// Set question voted for user
		db.query("INSERT INTO votes SET ?", {
			user_id: req.body.user_id,
			question_id: req.params.question_id
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
		// Update question statistics
		var user_vote = parseInt(req.body.user_vote,10);
		if      (user_vote == 1) var choice = "pour";
		else if (user_vote == 2) var choice = "contre";
		else if (user_vote == 0) var choice = "abstention";

		db.query("UPDATE questions SET "+choice+" = "+choice+" + 1 WHERE id = ?", [req.params.question_id]
		, function(err, rows, fields) {
	  		if (err) throw err;
			res.json({success: true});
		});
	}

};