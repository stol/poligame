// myApp module with myApp.controllers dependency containing all controllers
// and ngMockE2E dependency containing $httpBackend service

var myApp = angular.module('myApp', []);

  // routes declaration
myApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/edit', {
        templateUrl: 'partial_edit.html',
        controller: 'FriendEditCtrl'
    });

    $routeProvider.when('/', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl'
    });
    $routeProvider.otherwise({ redirectTo: '/' });
}]);

myApp.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
}]);

myApp.controller('ListCtrl', ['$scope', '$location','$http', function($scope, $location, $http) {

    var tempVote;

    $http({method: 'GET', url: '/questions'})
    .success(function(data, status, headers, config) {
        console.log("succès !");
        $scope.questions = data
    })
    .error(function(data, status, headers, config) {
        console.log("Erreur !");
    });

    // Sends the vote
    $scope.vote = function() {
        console.log("submit : ", myVote);
        /*
        $http({method: 'GET', url: '/questions'})

        $scope.todos.push({text:$scope.todoText, done:false});
        $scope.todoText = '';
        */
    };

    // Sets the vote after clicking
    $scope.setVote = function(vote){
        myVote = vote;
    }
}]); 


// application initialization : declare $httpBackend.when*() behaviors
myApp.run(['$rootScope', '$window', 'srvAuth', 
    function($rootScope, $window, sAuth) {

    $rootScope.user = {};

    $window.fbAsyncInit = function() {
        // Executed when the SDK is loaded
        FB.init({ 

            /* 
             The app id of the web app;
             To register a new app visit Facebook App Dashboard
             ( https://developers.facebook.com/apps/ ) 
            */

            appId: '609395745747955', 

            /* 
             Adding a Channel File improves the performance 
             of the javascript SDK, by addressing issues 
             with cross-domain communication in certain browsers. 
            */

            channelUrl: 'app/channel.html', 

            /* 
             Set if you want to check the authentication status
             at the start up of the app 
            */

            status: true, 

            /* 
             Enable cookies to allow the server to access 
             the session 
            */

            cookie: true, 

            /* Parse XFBML */

            xfbml: true 
        });

        sAuth.watchAuthenticationStatusChange();

    };

    // Are you familiar to IIFE ( http://bit.ly/iifewdb ) ?

    (function(d){
        // load the Facebook javascript SDK

        var js, 
        id = 'facebook-jssdk', 
        ref = d.getElementsByTagName('script')[0];

        if (d.getElementById(id)) {
            return;
        }

        js = d.createElement('script'); 
        js.id = id; 
        js.async = true;
        js.src = "//connect.facebook.net/en_US/all.js";

        ref.parentNode.insertBefore(js, ref);

    }(document));

}]);

// controllers module, with ngResource module dependency to use $resource
            // Load de la lib facebook
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/fr_FR/all.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
