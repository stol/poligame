var q = require('q')
  , request = require('request');

/**
 * Récupération des infos facebook
 */
exports.getFacebookInfos = function(access_token){
    var deferred = q.defer();

    // Req facebook pour voir si le user existe
    request.get({url: 'https://graph.facebook.com/me', qs: {
        access_token: access_token
    }}, function(err, resp, body) {
        
        // Err de request
        if (err){
            deferred.reject(err);
            return;
        }

        body = JSON.parse(body);

        // Erreur facebook
        if (body.error){
            deferred.reject(body.error.message);
            return;
        }

        deferred.resolve(body);
    });

    return deferred.promise;
}

exports.insertOrUpdate = function (user){
    var deferred = q.defer();
    
    db.query("INSERT INTO users (id, firstname, lastname, name, link) VALUES (?,?,?,?,?)"
           +" ON DUPLICATE KEY UPDATE firstname = ?, lastname = ?, name = ?, link = ?, updated_at = CURRENT_TIMESTAMP()",
    [user.id, user.first_name, user.last_name, user.name, user.link,
     user.first_name, user.last_name, user.name, user.link
    ], function(err, result, fields) {
        if (err) {
            deferred.reject(err.message);
            return;
        }

        deferred.resolve(user);
    });

    return deferred.promise;
}

exports.getVotes = function(infos){
    var deferred = q.defer();
    var votes = [{},{},{},{}];
    db.query("SELECT * from votes WHERE user_id = ?", [infos.id], function(err, rows, fields) {

        if (err) {
            deferred.reject("SQL Error");
            return;
        }

        for(var i=0; i<rows.length; i++){
            votes[rows[i].obj_type][rows[i].obj_id] = true;
        }
        var ret = {
            votes_nb: rows.length,
            infos   : infos,
            votes   : votes
        };
        deferred.resolve(ret);
    });

    return deferred.promise;
}

exports.get = function(id){
    var deferred = q.defer();

    db.query("SELECT * from users WHERE id = ?", [id], function(err, rows, fields) {
        if (err) {
            deferred.reject("SQL Error");
            return;
        }

        if (rows.length != 1){
            deferred.reject("Not few/many results");
            return;
        }
        deferred.resolve(rows[0]);
    });

    return deferred.promise;
}












