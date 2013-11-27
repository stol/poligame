var moment = require('moment')
	, _ = require('underscore')
	, q = require('q')
    , User = require('../models/user.js')
;

exports.fetch = function fetch(req, res, params){
	var deferred = q.defer();

	var sql = 'SELECT * from bills';
	var mode = req.query.mode || (params && params.mode) || false;


	if      (mode == "past")    sql+= ' WHERE ends_at < NOW()';
	else if (mode == "present") sql+= ' WHERE starts_at < NOW() AND ends_at > NOW()';
	else if (mode == "future")  sql+= ' WHERE starts_at > NOW()';

	var ids = (req.query.ids && _.isString(req.query.ids) && JSON.parse(req.query.ids)) || (params && params.ids) || false;
	if (ids){
		sql+= ' WHERE id IN('+ids.join(',')+')';
	}

	if      (mode == "past")    sql+= ' ORDER BY ends_at DESC';
	else if (mode == "present") sql+= ' ORDER BY ends_at ASC';
	else if (mode == "future")  sql+= ' ORDER BY starts_at ASC';

	var limit = (req.query.limit && parseInt(req.query.limit,10)) || (params && params.limit) || false;
	if (limit){
		sql+= ' LIMIT '+limit;
	}

	db.query(sql, function(err, textes, fields) {
  		if (err) throw err;

  		var stats_done = 0;

  		if (textes.length == 0){
  			deferred.resolve([]);
  			return;
  		}

        for( var i=0; i<textes.length; i++){
			textes[i].mode = mode;

			var present   = moment(),
				starts_at = moment(textes[i].starts_at),
				ends_at   = moment(textes[i].ends_at);

			if (ends_at < present){
				textes[i].mode = "past";
			}
			else if (starts_at < present && ends_at > present){
				textes[i].mode = "present";
			}
			else{
				textes[i].mode = "future";
			}

			alter_texte(textes[i]);

			get_stats(textes[i], function(){
				if (++stats_done == textes.length){
					if(ids && ids.length == 1){
						deferred.resolve(textes[0]);
						return;
					}
					else{
						deferred.resolve(textes);
						return;
					}
					
				}
			})
        }
	});

	return deferred.promise;
}
