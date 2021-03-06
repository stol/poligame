// poligame module with poligame.controllers dependency containing all controllers
// and ngMockE2E dependency containing $httpBackend service

var poligame = angular.module('poligame', ['ui.bootstrap', 'ngResource', 'ngRoute', 'ngSanitize', 'cookiesModule', 'ngAnimate']);

  // routes declaration
poligame.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: '/views/pages/home.html',
        controller: 'TextesController'
    });
    $routeProvider.when('/textes', {
        templateUrl: '/views/pages/textes.html',
        controller: 'TextesController'
    });
    $routeProvider.when('/textes/:texte_id', {
        templateUrl: '/views/partials/texte.html',
        controller: 'TextesController'
    });

    $routeProvider.when('/a-propos', {
        templateUrl: '/views/pages/a-propos.html'
    });

    $routeProvider.when('/user', {
        templateUrl: '/views/pages/user.html',
        controller: 'UsersController'
    });

    $routeProvider.otherwise({ redirectTo: '/' });
}]);

poligame.config(['$locationProvider', '$httpProvider', function($locationProvider, $httpProvider) {
    $locationProvider.html5Mode(true);
    $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

    // register the interceptor via an anonymous factory
    $httpProvider.interceptors.push(function() {
        return {
            request: function(config) {
                if (config.method == "POST"){
                    config.data._csrf = window.csrftoken;
                }
                return config;
            }
        }
    });

}]);

TYPE_TEXTE = 1;
TYPE_ARTICLE = 2;
TYPE_AMENDEMENT = 3;

// application initialization
poligame.run(['$rootScope', '$location', function($rootScope, $location){
    $rootScope.location = $location;
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
        future : "%s",
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

