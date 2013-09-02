moiElu.service('User', ['$window', '$http', '$cookieStore', '$q', function($window, $http, $cookieStore, $q) {

    var accessToken = null,
        is_logged = false,
        status = null,
        fb_is_loaded = false,    // La lib FB est-elle chargée ?
        user_is_logged_deferred, // Promesse du login du user
        fb_is_loaded_deferred = $q.defer();

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

                // Maj des infos sur le serveur
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
                        user.infos = data.infos;
                        user.votes = data.votes;
                        is_logged = true;
                        user_is_logged_deferred && user_is_logged_deferred.resolve(response);
                        fb_is_loaded_deferred.resolve();
                    })
                    .error(function(data, status, headers, config) {
                        user_is_logged_deferred && user_is_logged_deferred.reject(response);
                        fb_is_loaded_deferred.reject();
                    });
                });

            // User connecté MAIS PAS inscrit
            } else if (response.status === 'not_authorized') {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                fb_is_loaded_deferred.reject();
                status = "not_authorized";

            // User pas connecté
            } else {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                fb_is_loaded_deferred.reject();
                status = "unknown";
                
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


        if (false){
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

    function waitIfNotLogged(){
        if (is_logged){
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        }
        else{
            return fb_is_loaded_deferred.promise;
        }
        
    }

    // Exposition de l'api
    user.login           = login;
    user.publishVote     = publishVote;
    user.isLogged        = isLogged;
    user.changed         = changed;
    user.waitIfNotLogged = waitIfNotLogged;


    
    return user;
}]);

















     