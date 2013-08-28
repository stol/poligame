String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Gestion de la navigation
 */
moiElu.controller('NavigationCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'active' : '';
    };        
}]);


/**
 * Gestion des popins
 */
moiElu.controller('ReminderPopinCtrl', ['$rootScope', '$scope', 'dialog', function($rootScope, $scope, dialog) {
    $scope.close = function(result){
        dialog.close(result);
    };

    $scope.socialShare = true;
}]);

moiElu.controller('UserInfosPopinCtrl', ['$rootScope', '$scope', 'dialog', function($rootScope, $scope, dialog) {

	$scope.csp    = angular.copy($rootScope.user.infos.csp);
	$scope.gender = angular.copy($rootScope.user.infos.gender);
	$scope.bord   = angular.copy($rootScope.user.infos.bord);

	$scope.csps = [
        {id: 1, label: 'Agriculteur exploitant' },
        {id: 2, label: 'Artisan, commerçant et chef d’entreprise' },
        {id: 3, label: 'Cadre et profession intellectuelle supérieure' },
        {id: 4, label: 'Profession intermédiaire' },
        {id: 5, label: 'Employé' },
        {id: 6, label: 'Ouvrier' },
        {id: 7, label: 'Retraité' },
        {id: 8, label: 'Autre personne sans activité professionnelle' }
    ];

	$scope.genders = [
		{id: 1, label: "Homme"},
		{id: 2, label: "Femme"}
	];

	$scope.bords = [
		{id: 1, label: "Extrême gauche"},
		{id: 2, label: "Gauche"},
		{id: 3, label: "Centre-gauche"},
		{id: 4, label: "Centre"},
		{id: 5, label: "Centre-droit"},
		{id: 6, label: "Droite"},
		{id: 7, label: "Extrême droite"}
	];

	$scope.ages = [];
	for( var i=12; i<=100; i++){
		$scope.ages.push(i);
	}

    $scope.close = function(result){
		$rootScope.user.infos.csp = $scope.csp;
		$rootScope.user.infos.bord = $scope.bord;
		$rootScope.user.infos.gender = $scope.gender;
		$rootScope.$broadcast('userChanged');
        dialog.close(result);
    };
    
}]);


//factory style, more involved but more sophisticated
moiElu.factory('Textes', function($rootScope, $http, $q) {
    var textes = {};
    var cache = {};
    
    var Texte = {
        isVoted: function(user_vote){
            if (user_vote != undefined)
                return $rootScope.user.votes[this.id] && $rootScope.user.votes[this.id] === user_vote || false;
            else
                return !!$rootScope.user.votes[this.id];
        },

        date_start: function(){
            return moment(this.starts_at).format("ll")
        },
        date_end: function(){
            return moment(this.ends_at).format("ll")
        }
    }


    function get(params, callback){

        if (params.id && textes[params.id]){
            callback && callback(textes[params.id]);
            return textes[params.id];
        }

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

        var deferred = $q.defer();

        var config = {
            method: 'GET',
            url: url,
            cache: true,
            params: nb && params
        };
        
        $http(config).success(function(data, status, headers, config){
            var ret;

            if (!angular.isArray(data)){
                if (!textes[data.id]){
                    textes[data.id] = data;
                    angular.extend(textes[data.id], Texte);
                }

                ret = textes[data.id];
            }
            else{
                ret = {};
                for(var i=0; i<data.length; i++){
                    if (!textes[data[i].id]){
                        textes[data[i].id] = data[i];
                        angular.extend(textes[data[i].id], Texte);
                    }
                    
                    ret[data[i].id] = textes[data[i].id];
                }
            }

            callback && callback.apply(self, arguments);

            deferred.resolve(ret);
        });

        return deferred.promise;

    }

    return {
        get : get
    };
    
});














