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

        var ret;

        // 1 texte demandé ? On le resort s'il est dans le cache objet
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

        var deferred = $q.defer();

        $http(config = {
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

            deferred.resolve(ret);
        });

        return deferred.promise;

    }

    return {
        get : get
    };
    
});



moiElu.controller('UsersCtrl', ['$rootScope', '$scope', 'Textes', 'User', function($rootScope, $scope, Textes, User) {
    var ids = _.keys($rootScope.user.votes);
    $scope.textes = Textes.get({ids: ids});
}]);

moiElu.service('User', ['$rootScope', '$window', '$http', '$cookieStore', '$q', function($rootScope, $window, $http, $cookieStore, $q) {

    $rootScope.user = {
        infos: null,
        accessToken: null,
        isLogged: false,
        votes: {},
        status: null
    };

    var fb_is_loaded = false;    // La lib FB est-elle chargée ?
    var user_is_logged_deferred; // Promesse du login du user

    // Chargement de la lib facebook
    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/fr_FR/all.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    
    // Initialisation de la lib facebook
    $window.fbAsyncInit = function(){
        // Executed when the SDK is loaded
        $window.FB.init({ 
            appId: '609395745747955', 
            channelUrl : '//' + window.location.hostname + '/channel_fb.html', // Channel file for x-domain comms
            status: true, 
            cookie: true, 
            xfbml: true
        });

        $window.FB.Event.subscribe('auth.statusChange', function(response) {
            if (response.status === 'connected') {
                $rootScope.user.status = "connected";
                $rootScope.user.accessToken = response.authResponse.accessToken;

                $window.FB.api('/me', function(response) {
                    $http({method: 'POST', url: '/users/login', data: {
                        firstname: response.first_name,
                        lastname : response.last_name,
                        fullname : response.name,
                        nickname : response.username,
                        provider_user_id: response.id,
                        gender   : response.gender == "male" ? 1 : response.gender == "female" ? 2 : 0,
                        bio      : response.bio,
                        link     : response.link
                    }})
                    .success(function(data, status, headers, config) {
                        $rootScope.user.infos = data.infos;
                        $rootScope.user.votes = data.votes;
                        $rootScope.user.isLogged = true;
                        user_is_logged_deferred && user_is_logged_deferred.resolve(response);
                    })
                    .error(function(data, status, headers, config) {
                        user_is_logged_deferred && user_is_logged_deferred.reject(response);
                    });
                });

            } else if (response.status === 'not_authorized') {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                $rootScope.user.status = "not_authorized";
            } else {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                $rootScope.user.status = "unknown";
                // the user isn't logged in to Facebook.
            }
        });

        fb_is_loaded = true;
    }

    // Déclenche la procédure de login de l'utilisateur. Renvoie une promesse utilisable ainsi :
    // User.login().then(
    //     function(reason){ console.log("Identification réussie") },
    //     function(reason){ console.log("Identification échouée") }
    // );
    function login(){
        console.log("User.login() START");
        user_is_logged_deferred = $q.defer();
        
        // User déjà connecté ? On ne déclenche pas le popup de login
        if ($rootScope.user.status === "connected"){
            user_is_logged_deferred.resolve();
        }
        // user pas connecté mais lib facebook loadée ? On ouvre la popup
        else if (fb_is_loaded){
            $window.FB.login(null, {scope: 'publish_actions'});
        }
        // Lib facebook pas chargée, statut du user pas connu, donc on fait rien
        else{
            alert("Authentification en cours... Merci de réessayer dans quelques secondes");
            user_is_logged_deferred.reject();
        }
        
        return user_is_logged_deferred.promise;
    }

    $rootScope.$on('userChanged', function(e) {
        
        $http({method: 'POST', url: '/users/'+$rootScope.user.infos.id, data: $rootScope.user.infos})
        .success(function(data, status, headers, config) {
            console.log("USER UPDATE is great success ! ");
        })
        .error(function(data, status, headers, config) {
            console.log("Erreur update user !");
        });
    });

    return {
        login: login
    }
}]);

















