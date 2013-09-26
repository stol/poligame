var q = require('q')
  , request = require('request');

/**
 * Récupération des infos facebook
 */
exports.getFacebookUser = function(access_token){
    var deferred = q.defer();

    // Req facebook pour voir si le user existe
    request.get({url: 'https://graph.facebook.com/me', qs: {
        access_token: access_token
    }}, function(err, resp, body) {
      
        // Handle any errors that occur
        if (err){
            deferred.reject(err);
        }
        else{
            body = JSON.parse(body);
            deferred.resolve(body);
        }
    });

    return deferred.promise;
}

exports.checkOrInsertUser = function (data){
    var deferred = q.defer();
    
    // User est bien dans la BDD ?
    db.query("SELECT * FROM users WHERE provider_user_id = ?", [data.id], function(err, rows, fields) {
        if (err) {
            deferred.reject("SQL Error");
            return;
        }

        if (rows.length){
            deferred.resolve(rows[0]);
        }
        else{
            var user = {
                firstname: data.first_name,
                lastname : data.last_name,
                fullname : data.name,
                provider_user_id: data.id,
                link     : data.link,
            }

            db.query('INSERT INTO users SET ? ', user, function(err, result){
                user.id = result.insertId;
                deferred.resolve(user);
            });
        }
    });

    return deferred.promise;
}

exports.getUserVotes = function(infos){
    var deferred = q.defer();
    var votes = [{},{},{},{}];
    db.query("SELECT * from votes WHERE user_id = ?", [infos.id], function(err, rows, fields) {
        for(var i=0; i<rows.length; i++){
            votes[rows[i].obj_type][rows[i].obj_id] = true;
        }
        deferred.resolve({
            votes_nb: rows.length,
            infos   : infos,
            votes   : votes
        });
    });

    return deferred.promise;
}
