moiElu.service('User', ['$window', '$http', '$cookieStore', '$q', function($window, $http, $cookieStore, $q) {

    var accessToken = null,
        isLogged = false,
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

        fb_is_loaded_deferred.resolve();

        $window.FB.Event.subscribe('auth.statusChange', function(response) {
            console.log("auth.statusChange : ", response.status);
            if (response.status === 'connected') {
                status = "connected";
                accessToken = response.authResponse.accessToken;

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
                        isLogged = true;
                        user_is_logged_deferred && user_is_logged_deferred.resolve(response);
                    })
                    .error(function(data, status, headers, config) {
                        user_is_logged_deferred && user_is_logged_deferred.reject(response);
                    });
                });

            } else if (response.status === 'not_authorized') {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                status = "not_authorized";
            } else {
                user_is_logged_deferred && user_is_logged_deferred.reject(response);
                status = "unknown";
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
        return isLogged;
    }

    // Exposition de l'api
    user.login       = login;
    user.publishVote = publishVote;
    user.isLogged    = isLogged;
    user.changed     = changed;

    user.waitForAuth = function(){
        console.log("waitForAuth() START");
        var deferred = $q.defer();
        fb_is_loaded_deferred.promise.then(function(){
            console.log("waitForAuth() => fb_is_loaded_deferred.promise.then START");
            deferred.resolve();
        })
        return deferred.promise;
    }

    
    return user;
}]);

















     