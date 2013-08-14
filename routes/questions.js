var util = require('util');
/*
 * GET users listing.
 */

exports.list = function(req, res){
	db.query('SELECT * from questions', function(err, questions, fields) {
  		if (err) throw err;

        for( var i=0, l = questions.length; i<l;i++){
        	questions[i].votes = {
        		total: questions[i].pour + questions[i].contre + questions[i].abstention,
        		actives: questions[i].pour + questions[i].contre,
				pour: {
                	nb: questions[i].pour,
                	perc: Math.round(100 * questions[i].pour / (questions[i].pour + questions[i].contre))
            	},
            	contre: {
                	nb: questions[i].contre,
                	perc: Math.round(100 * questions[i].contre / (questions[i].pour + questions[i].contre))
            	},
				abstention: {
                	nb: questions[i].abstention,
                	perc: Math.round(100 * questions[i].abstention / questions[i].total)
            	}
        	};
        	delete questions[i].pour;
        	delete questions[i].contre;
        	delete questions[i].abstention;
        }

  		res.json(questions);
	});
};


exports.show = function(req, res){
	db.query('SELECT * from questions WHERE id = ?', [req.params.question_id], function(err, rows, fields) {
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