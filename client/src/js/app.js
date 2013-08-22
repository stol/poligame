// moiElu module with moiElu.controllers dependency containing all controllers
// and ngMockE2E dependency containing $httpBackend service

var moiElu = angular.module('moiElu', ['ngCookies', 'ui.bootstrap']);

  // routes declaration
moiElu.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: '/views/pages/home.html'
    });
    $routeProvider.when('/textes/:texte_id', {
        templateUrl: '/views/pages/texte.html'
    });

    $routeProvider.when('/a-propos', {
        templateUrl: '/views/pages/a-propos.html'
    });

    $routeProvider.otherwise({ redirectTo: '/' });
}]);

moiElu.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
}]);

// application initialization : declare $httpBackend.when*() behaviors
moiElu.run(['$rootScope', '$window', '$http', '$cookieStore', function($rootScope, $window, $http, $cookieStore) {

    $rootScope.afterLogin = [];

    $rootScope.user = {
        infos: null,
        accessToken: null,
        votes: {},
        status: 'unknown'
    };

    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/fr_FR/all.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    function afterLoginAction(){
        console.log("after login actions !");
        for( var i=0; i < $rootScope.afterLogin.length; i++){
            $rootScope.afterLogin[i]();
        }
        $rootScope.afterLogin = [];
    }

    $window.fbAsyncInit = function() {
        console.log("APP fbAsyncInit");
        // Executed when the SDK is loaded
        FB.init({ 
            appId: '609395745747955', 
            channelUrl : '//' + window.location.hostname + '/channel_fb.html', // Channel file for x-domain comms
            status: true, 
            cookie: true, 
            xfbml: true
        });


        FB.Event.subscribe('auth.statusChange', function(response) {
            console.log("auth.statusChange! response : ", response);
            console.log("$window.fbAsyncInit = ", $window.fbAsyncInit);
            if (response.status === 'connected') {
                var token_new = response.authResponse.accessToken;
                var token_local = $cookieStore.get("tok");
                console.log("token_local = ", token_local)
                console.log("token_new = ", token_new)

                //if( !token_local || token_local != token_new){
                if( !token_local){

                    FB.api('/me', function(response) {
                        console.log('infos FB reçues... Enregistrement en BDD...', response)

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
                            console.log("USER LOGIN is GREAT SUCCESS : ", $rootScope.user);
                            $rootScope.user.infos = data.infos;
                            $rootScope.user.votes = data.votes;
                            $cookieStore.put("tok", token_new);
                            console.log("PUT TOK | ", token_new);
                            afterLoginAction();
                        })
                        .error(function(data, status, headers, config) {
                            console.log("Erreur !");
                        });
                    });
                }
                else{
                    $http({method: 'POST', url: '/users/login', data: {
                        provider_user_id: response.authResponse.userID
                    }})
                    .success(function(data, status, headers, config) {
                        console.log("AUTOLOGIN is GREAT SUCCESS : ", $rootScope.user);
                        $rootScope.user.infos = data.infos;
                        $rootScope.user.votes = data.votes;
                        $cookieStore.put("tok", token_new);
                        console.log("PUT TOK | ", token_new);
                        afterLoginAction();
                    });

                }

                $rootScope.user.status = "connected";
                $rootScope.user.accessToken = response.authResponse.accessToken;
                //var uid = response.authResponse.userID;

            } else if (response.status === 'not_authorized') {
                $rootScope.user.status = "not_authorized";
                console.log("UNSET TOK 1.0 ("+$cookieStore.get("tok")+")");
                $cookieStore.remove("tok");
                console.log("UNSET TOK 1.1 ("+$cookieStore.get("tok")+")");
            } else {
                $rootScope.user.status = "unknown";
                console.log("UNSET TOK 2.0 ("+$cookieStore.get("tok")+")");
                $cookieStore.remove("tok");
                console.log("UNSET TOK 2.1 ("+$cookieStore.get("tok")+")");
                // the user isn't logged in to Facebook.
            }
        });
    };
}]);

moment.lang('fr', {
    months : "janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre".split("_"),
    monthsShort : "janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.".split("_"),
    weekdays : "dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi".split("_"),
    weekdaysShort : "dim._lun._mar._mer._jeu._ven._sam.".split("_"),
    weekdaysMin : "Di_Lu_Ma_Me_Je_Ve_Sa".split("_"),
    longDateFormat : {
        LT : "HH:mm",
        L : "DD/MM/YYYY",
        LL : "D MMMM YYYY",
        LLL : "D MMMM YYYY LT",
        LLLL : "dddd D MMMM YYYY LT"
    },
    calendar : {
        sameDay: "[Aujourd'hui à] LT",
        nextDay: '[Demain à] LT',
        nextWeek: 'dddd [à] LT',
        lastDay: '[Hier à] LT',
        lastWeek: 'dddd [dernier à] LT',
        sameElse: 'L'
    },
    relativeTime : {
        future : "dans %s",
        past : "il y a %s",
        s : "quelques secondes",
        m : "une minute",
        mm : "%d minutes",
        h : "une heure",
        hh : "%d heures",
        d : "un jour",
        dd : "%d jours",
        M : "un mois",
        MM : "%d mois",
        y : "une année",
        yy : "%d années"
    },
    ordinal : function (number) {
        return number + (number === 1 ? 'er' : 'ème');
    },
    week : {
        dow : 1, // Monday is the first day of the week.
        doy : 4  // The week that contains Jan 4th is the first week of the year.
    }
});