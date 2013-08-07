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

myApp.controller('ListCtrl', ['$rootScope', '$scope', '$location','$http', function($rootScope, $scope, $location, $http) {

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
        console.log("COUCOU ", $rootScope.user);
        if (!$rootScope.user){
            console.log("user pas loggé")
            FB.login(function(response) {
                if (response.authResponse) {
                    console.log('Welcome!  Fetching your information.... ');
                    FB.api('/me', function(response) {
                        console.log(response);

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
                            console.log("GREAT SUCCESS : ", data);
                        })
                        .error(function(data, status, headers, config) {
                            console.log("Erreur !");
                        });
                    });
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            });
        }
        else{
            console.log("user loggé")
        }


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
myApp.run(['$rootScope', '$window', function($rootScope, $window) {

    $rootScope.user = null;

    (function(d, s, id){
        var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;}
        js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/fr_FR/all.js";
        fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    $window.fbAsyncInit = function() {
        // Executed when the SDK is loaded
        FB.init({ 
            appId: '609395745747955', 
            channelUrl : '//' + window.location.hostname + '/channel.html', // Channel file for x-domain comms
            status: true, 
            cookie: true, 
            xfbml: true
        });


        FB.Event.subscribe('auth.authResponseChange', function(response) {
            console.log(response);
            /*
            if (response.status === 'connected') {            
                _self.getUserInfo();
            }
            else {
            }
            */

        });


    };



}]);
