var moment = require('moment')
  , User = require('../models/user.js')
  , q = require('q')
  , request = require('request');
/*
 * GET users listing.
 */

exports.login = function(req, res){
	User.getFacebookUser(req.body.accessToken) // Récupération des infos facebook
		.then(User.checkOrInsertUser)          // Récup des infos en local, ou insertion
		.then(User.getUserVotes)			   // Récup des votes
		.then(function(data, code){				   // Finally !
			console.log("INSIDE LAST THEN");
			res.json(data);
		})
		.catch(function(msg){				   // Error handling
			console.log("INSIDE CATCH");
			res.json(401, {
				success: false,
				message: msg 
			});
		})
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


