//factory style, more involved but more sophisticated
moiElu.factory('Textes', ['$http', '$q', 'User', function($http, $q, User) {
    var textes = {};
    var cache = {};
    
    var Texte = {
        isVoted: function(){
            return !!(User.votes[TYPE_TEXTE] && User.votes[TYPE_TEXTE][this.id]);
        },

        date_start: function(){
            return moment(this.starts_at).format("ll")
        },
        date_end: function(){
            return moment(this.ends_at).format("ll")
        }
    }

    function present(){

    }

    function past(){


    }

    function future(){

    }


    function get(params, callback){
        params = params || {};
        var ret;

        // Un seul texte demandé ? On le resort s'il est dans le cache objet
        if (params.id && textes[params.id]){
            callback && callback(textes[params.id]);
            return textes[params.id];
        }

        // Plusieurs textes spécifiques demandés ?
        if (params.ids && _.isArray(params.ids)) {
            ret = [];
            var to_get = [];
            for(var i=0; i<params.ids.length; i++) {
                if (textes[params.ids[i]]){
                    ret.push(textes[params.ids[i]])
                }
                else{
                    to_get.push(parseInt(params.ids[i],10));
                }
                    
            }
            // On avait déjà tout en cache ?
            if (ret.length == params.ids.length){
                return ret;
            }
            else{
                params.ids = to_get;
            }
        }

        // MaJ de l'ur en fonction d'un élément demandé ou pas
        var url = '/textes';
        if (params.id){
            url += '/'+params.id;
            delete params.id;
        }

        var nb = 0;
        angular.forEach(params, function(value, key){
            nb++;
        });
        var self = this;

        // On passe l'id sous forme de json
        if (params.ids){
            params.ids = JSON.stringify(params.ids);
        }

        var deferred = $q.defer();
        $http({
            method: 'GET',
            url: url,
            cache: true,
            params: nb && params
        }).success(function(data, status, headers, config){
            if (!angular.isArray(data)){
                if (!textes[data.id]){
                    textes[data.id] = data;
                    angular.extend(textes[data.id], Texte);
                }

                ret = textes[data.id];
            }
            else{
                ret = ret || [] ;
                for(var i=0; i<data.length; i++){
                    if (!textes[data[i].id]){
                        textes[data[i].id] = data[i];
                        angular.extend(textes[data[i].id], Texte);
                    }
                    
                    ret.push(textes[data[i].id]);
                }
            }

            callback && callback.apply(self, arguments);
            if (params.ids){
                ret = [ret];
            }
            deferred.resolve(ret);
        });

        return deferred.promise;

    }

    return {
        get : get
    };
    
}]);