// myApp module with myApp.controllers dependency containing all controllers
// and ngMockE2E dependency containing $httpBackend service

var myApp = angular.module('myApp', ['ngCookies', 'ui.bootstrap']);

  // routes declaration
myApp.config(['$routeProvider', function($routeProvider) {
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

myApp.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
}]);


myApp.controller('ModalCtrl', ['$scope', 'dialog', function($scope, dialog) {
    $scope.close = function(result){
        dialog.close(result);
    };
    $scope.socialShare = true;
}]);

myApp.controller('TextesCtrl', ['$rootScope', '$scope', '$location','$http', '$dialog', '$routeParams', '$window',
function($rootScope, $scope, $location, $http, $dialog, $routeParams, $window) {
    

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

    $scope.init = function(mode){
        mode = mode || 'default';
        // Loading des textes, ajoutées au scope global pour pas les recharger qd on change de page
        if (!$rootScope['mode_'+mode+'_done']){
            
            $http({method: 'GET', url: '/textes', params:{
                'mode' : mode
            }})
            .success(function(textes, status, headers, config) {
                $rootScope['mode_'+mode+'_done'] = true;
                $rootScope.textes2 = $rootScope.textes2 || {};
                $scope.textes = $scope.textes || {};
                for( var i=0, l = textes.length; i<l;i++){
                    angular.extend(textes[i], Texte);
                    $rootScope.textes2[textes[i].id] = textes[i];
                    $scope.textes[textes[i].id] = textes[i];
                }

                
            })
            .error(function(data, status, headers, config) {
                console.log("GET texteS : Erreur !");
            });
        }
        else{
            $scope.textes = $scope.textes || {};
            angular.forEach($rootScope.textes2, function(texte, id){
                if (texte.mode == mode)
                    $scope.textes[id] = texte;
            });
        }

    }

    if ($routeParams.texte_id){
        if (!$rootScope.textes2 || !$rootScope.textes2[$routeParams.texte_id]){
            $http({method: 'GET', url: '/textes/'+$routeParams.texte_id})
            .success(function(texte, status, headers, config) {
                angular.extend(texte, Texte);
                $rootScope.textes2 = $rootScope.textes2 || {};
                $rootScope.textes2[texte.id] = texte;
                $scope.texte = $rootScope.textes2[texte.id];
                //$window.FB.XFBML.parse();
            })
            .error(function(data, status, headers, config) {
                console.log("GET texte : Erreur !");
            });
        }
        else{
            $scope.texte = $rootScope.textes2[$routeParams.texte_id];
        }



    }

    // Sends the vote
    function setChoice(user_vote, texte) {
        $dialog.dialog({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal.html',
            controller: 'ModalCtrl'
        }).open().then(function(result){
            result = !!result; // Casts result to boolean
            console.log('dialog closed with result: ' + result);
            result && doVote(user_vote, texte);
        });
    };

    function doVote(user_vote, texte){
        if ($rootScope.user.status != "connected"){
            console.log("user pas loggé. Trying to logg in facebook...")
            FB.login(function(response) {
                console.log('FB login DONE. reponse = ', response);
                if (response.authResponse) {
                    $rootScope.user.accessToken = response.authResponse.accessToken;
                    doVote(user_vote, texte);
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, {scope: 'publish_actions'});
            return;
        }
        console.log("user loggé. voting...")
        $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
            user_id: $rootScope.user.infos.id,
            texte_id: texte.id,
            user_vote: user_vote
        }})
        .success(function(data, status, headers, config) {
        
        })
        .error(function(data, status, headers, config) {
            console.log("VOTE texte : Erreur !");
        });

        $rootScope.user.votes[texte.id] = user_vote;
        publishVote(user_vote, texte);
    }

    function publishVote(user_vote, texte){
        console.log("publishVote canceled (debug)");
        return;
        console.log("sending action...");
        FB.api('https://graph.facebook.com/me/moipresident:vote_for', 'post', {
            access_token: $rootScope.user.accessToken,
            bill_project: 'http://samples.ogp.me/609805575706972'
        }, function(response) {
            console.log(response);
        });
    }

    // API exposition
    $scope.setChoice = setChoice;
}]); 


// application initialization : declare $httpBackend.when*() behaviors
myApp.run(['$rootScope', '$window', '$http', '$cookieStore', function($rootScope, $window, $http, $cookieStore) {

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

    $window.fbAsyncInit = function() {
        // Executed when the SDK is loaded
        FB.init({ 
            appId: '609395745747955', 
            channelUrl : '//' + window.location.hostname + '/channel_fb.html', // Channel file for x-domain comms
            status: true, 
            cookie: true, 
            xfbml: false
        });


        FB.Event.subscribe('auth.statusChange', function(response) {
            console.log("auth.statusChange! response : ", response);
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
                            console.log("SAVE is GREAT SUCCESS : ", $rootScope.user);
                            $rootScope.user.infos = data.infos;
                            $rootScope.user.votes = data.votes;
                            $cookieStore.put("tok", token_new);
                            console.log("PUT TOK | ", token_new);
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

/**
 * Gestion de la navigation
 */
myApp.controller('NavigationCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'active' : '';
    };        
}]);

myApp.directive('myChart', function() {
    return function($scope, element, attrs) {
        var r = Raphael(element[0]);

        var temp1 = [$scope.texte.votes.pour, $scope.texte.votes.contre, $scope.texte.votes.abstention];
        temp = _.sortBy(temp1, function(vote){ return -vote.nb });
        console.log(temp1," et ",temp);

        r.piechart(40, 40, 40, [temp[0].nb, temp[1].nb, temp[2].nb],{
            init: false,
            legendpos: "east",
            colors: [temp[0].color, temp[1].color, temp[2].color],
            legend: ["%%.% "+temp[0].label, "%%.% "+temp[1].label, "%%.% "+temp[2].label]
        });

    };
});

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