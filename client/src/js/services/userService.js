moiElu.service('User', ['$window', '$http', '$q', '$rootScope', 'Cookies', function($window, $http, $q, $rootScope, Cookies) {

    var accessToken = null,
        is_logged = false,
        status = null,
        fb_is_loaded = false,    // La lib FB est-elle chargée ?
        user_is_logged_deferred; // Promesse du login du user
        // TODO : tester les events

    var localInfos = null;

    var user = {
        infos: null,
        votes: {}
    };


    // Chargement de la lib facebook
    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/fr_FR/all.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
    
    // Executé au chargement de la lib facebook
    $window.fbAsyncInit = function(){
        var statusAlreadyChecked = false;

        // Initialisation
        $window.FB.init({ 
            appId: '609395745747955', 
            channelUrl : '//' + window.location.hostname + '/channel_fb.html', // Channel file for x-domain comms
            status: false, 
            cookie: true, 
            xfbml: true
        });

        $rootScope.$broadcast('fbLoaded');

        // Quoi faire si changement de statut
        $window.FB.Event.subscribe('auth.statusChange', statusHandler);
        $window.FB.getLoginStatus(loginStatusHandler);

        function loginStatusHandler(response){
            statusAlreadyChecked || statusHandler(response);
        }

        // Le gestionnaire de changement de statut
        function statusHandler(response){
            statusAlreadyChecked = true;
            console.log("auth.statusChange : ", response.status);

            // User connecté ET inscrit
            if (response.status === 'connected') {
                status = "connected";
                accessToken = response.authResponse.accessToken;

                $http({method: 'POST', url: '/users/login', data: {
                    accessToken: accessToken
                }})
                .success(function(data, status, headers, config) {
                    user.infos = data.infos;
                    user.votes = data.votes;
                    is_logged = true;
                    user_is_logged_deferred && user_is_logged_deferred.resolve(response);
                    $rootScope.$broadcast('userConnected');
                })
                .error(function(data, status, headers, config) {
                    status = "error";
                    user_is_logged_deferred && user_is_logged_deferred.reject(response);
                    $rootScope.$broadcast('userError');
                });

            // User connecté MAIS PAS inscrit
            } else if (response.status === 'not_authorized') {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                status = "not_authorized";
                $rootScope.$broadcast('userNotAuthorized');


            // User pas connecté
            } else {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                status = "unknown";
                $rootScope.$broadcast('userUnknown');
            }
        }

        // On marque la lib comme chargée
        fb_is_loaded = true;
    }

    // Déclenche la procédure de login de l'utilisateur. Renvoie une promesse utilisable ainsi :
    // User.login().then(
    //     function(reason){ console.log("Identification réussie") },
    //     function(reason){ console.log("Identification échouée") }
    // );
    function login(){
        user_is_logged_deferred = $q.defer();
        
        // User déjà connecté ? On ne déclenche pas le popup de login
        if (status === "connected"){
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

    function changed(){
        $http({method: 'POST', url: '/users/'+user.infos.id+'/qualified'});
        return;

        $http({method: 'POST', url: '/users/'+user.infos.id, data: user.infos})
        .success(function(data, status, headers, config) {
            console.log("USER UPDATE is great success ! ");
        })
        .error(function(data, status, headers, config) {
            console.log("Erreur update user !");
        });
    }

    // Envoie le vote à facebook
    function publishVote(user_vote, texte){

        var deferred = $q.defer();

        // Lib pas chargée, on fait rien
        if (!fb_is_loaded){
            deferred.reject(response);
            return deferred.promise;
        }


        if (true){
            console.log("publishVote() => sending action");
            $window.FB.api('https://graph.facebook.com/me/moipresident:vote_for', 'post', {
                access_token: accessToken,
                bill_project: 'http://samples.ogp.me/609805575706972'
            }, function(response) {
                console.log(response);
                deferred.resolve(response);
            });

        }
        else{
            console.log("publishVote canceled (debug)");
            deferred.resolve();
        }

        return deferred.promise;
    }

    // Renvoie true/false selon le statut de connextion du user
    function isLogged(){
        return is_logged;
    }

    // Usage :  
    // User.onConnected(function(e){
    //     console.log("User is/just connected !");
    // }, function(){
    //     console.log("User was/is not connected !");
    // }).onNotAuthorized(function(){
    //     console.log("User is/just not authorized!");
    // });
    user.onConnected = function(success, error){
        if (status === 'connected') success && success();
        else if (status !== null)   error && error();
        else{
            $rootScope.$on('userConnected', success);
            $rootScope.$on('userError', error);
            $rootScope.$on('userNotAuthorized', error);
            $rootScope.$on('userUnknown', error);
        }
        return user;
    };
    user.onError = function(success, error){
        if (status === 'error') success && success();
        else if (status !== null)   error && error();
        else{
            $rootScope.$on('userConnected', error);
            $rootScope.$on('userError', success);
            $rootScope.$on('userNotAuthorized', error);
            $rootScope.$on('userUnknown', error);
        }
        return user;
    };
    user.onNotAuthorized = function(success, error){
        if (status === 'not_authorized') success && success();
        else if (status !== null)   error && error();
        else{
            $rootScope.$on('userConnected', error);
            $rootScope.$on('userError', error);
            $rootScope.$on('userNotAuthorized', success);
            $rootScope.$on('userUnknown', error);
        }
        return user;
    };
    user.onUnknown = function(success, error){
        if (status === 'unknown') success && success();
        else if (status !== null)   error && error();
        else{
            $rootScope.$on('userConnected', error);
            $rootScope.$on('userError', error);
            $rootScope.$on('userNotAuthorized', error);
            $rootScope.$on('userUnknown', success);
        }
        return user;
    };

    user.getLocalInfos = function(){
        if (localInfos === null){
            localInfos = JSON.parse(Cookies.getItem("infos")) || {};
        }
        
        return localInfos;
    }

    user.setLocalInfos = function (infos){
        localInfos = infos;
        Cookies.setItem("infos", JSON.stringify(infos), Infinity, '/');
    }

    function getStatus(){
        return status;
    }

    // Exposition de l'api
    user.login       = login;
    user.publishVote = publishVote;
    user.isLogged    = isLogged;
    user.changed     = changed;
    user.getStatus   = getStatus;

    return user;
}]);

















     