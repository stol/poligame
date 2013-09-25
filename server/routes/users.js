var moment = require('moment')
  , request = require('request');

/*
 * GET users listing.
 */

function generate_token(){
	
	
}

exports.login = function(req, res){

	// On a bien le droit d'accès au user ?
	request.get({url: 'https://graph.facebook.com/me', qs: {
        access_token: req.body.accessToken
    }}, function(err, resp, body) {
      
      	// Handle any errors that occur
      	if (err) return console.error("Error occured: ", err);
      	body = JSON.parse(body);

      	if (body.error){
      		res.json({ success: false});
     	}
     	console.log(body);

		// User est bien dans la BDD ?
		db.query("SELECT * FROM users WHERE provider_user_id = ?", [body.id], function(err, rows, fields) {
	  		if (err) throw err;

	  		if (rows.length){
	  			get_votes(rows[0]);
	  		}
	  		else{
	  			var user = {
	  				firstname: body.first_name,
					lastname : body.last_name,
					fullname : body.name,
					provider_user_id: body.id,
					link     : body.link,
				}

	  			db.query('INSERT INTO users SET ? ', user, function(err, result){
	  				user.id = result.insertId;
	  				get_votes(user);
	  			});
	  		}
		});
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


