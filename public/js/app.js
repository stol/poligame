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
    
    function isVoted(vote){
        return $rootScope.user.votes[this.id] && $rootScope.user.votes[this.id] === vote || false;
    }


    $http({method: 'GET', url: '/questions'})
    .success(function(data, status, headers, config) {
        for( var i=0, l = data.length; i<l;i++){
            data[i].isVoted = isVoted;
        }
        $scope.questions = data;
    })
    .error(function(data, status, headers, config) {
        console.log("GET QUESTIONS : Erreur !");
    });

    // Sends the vote
    $scope.vote = function(vote, question) {
        console.log("voting...")
        /*
        // Create a new instance of ladda for the specified button
        var l = Ladda.create( document.querySelector( '.my-button' ) );
        // Start loading
        l.start();
        // Will display a progress bar for 50% of the button width
        l.setProgress( 0.5 );
        // Stop loading
        l.stop();
        // Toggle between loading/not loading states
        l.toggle();
        // Check the current state
        l.isLoading();
        */
        if (!$rootScope.user.accessToken){
            console.log("user pas loggé. Trying to logg in facebook...")
            FB.login(function(response) {
                console.log('FB login DONE. reponse = ', response);
                if (response.authResponse) {
                    $rootScope.user.accessToken = response.authResponse.accessToken;
                    $scope.vote(vote, question);
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, {scope: 'publish_actions'});
            return;
        }

        console.log("user loggé")
        $rootScope.user.votes[question.id] = vote;
        sendVote(vote, question);


        /*
        $http({method: 'GET', url: '/questions'})

        $scope.todos.push({text:$scope.todoText, done:false});
        $scope.todoText = '';
        */
    };

    function sendVote(vote, question){
        console.log("sending action...");
        FB.api('https://graph.facebook.com/me/moipresident:vote_for', 'post', {
            access_token: $rootScope.user.accessToken,
            bill_project: 'http://samples.ogp.me/609805575706972'
        }, function(response) {
            console.log(response);
        });
    }
}]); 


// application initialization : declare $httpBackend.when*() behaviors
myApp.run(['$rootScope', '$window', '$http', function($rootScope, $window, $http) {

    $rootScope.user = {
        infos: null,
        accessToken: null,
        votes: [[],[],[]]
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
            channelUrl : '//' + window.location.hostname + '/channel.html', // Channel file for x-domain comms
            status: true, 
            cookie: true, 
            xfbml: true
        });


        FB.Event.subscribe('auth.authResponseChange', function(response) {
            console.log("auth.authResponseChange ! response = ", response);
            if (response.status === 'connected') {
                $rootScope.user.accessToken = response.authResponse.accessToken;

                !$rootScope.user.infos && FB.api('/me', function(response) {
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
                        $rootScope.user.infos = data;
                        console.log("login/save is GREAT SUCCESS : ", $rootScope.user);
                    })
                    .error(function(data, status, headers, config) {
                        console.log("Erreur !");
                    });
                });
            }
            /*
            else {
            }
            */

        });


    };



}]);
