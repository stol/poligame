// myApp module with myApp.controllers dependency containing all controllers
// and ngMockE2E dependency containing $httpBackend service

var myApp = angular.module('myApp', ['ngCookies', 'ui.bootstrap']);

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

myApp.controller('ModalCtrl', ['$scope', 'dialog', function($scope, dialog) {
    $scope.close = function(result){
        dialog.close(result);
    };
}]);

myApp.controller('ListCtrl', ['$rootScope', '$scope', '$location','$http', '$dialog', function($rootScope, $scope, $location, $http, $dialog) {
    
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
        $dialog.dialog({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/modal.html',
            controller: 'ModalCtrl'
        }).open().then(function(result){
            if(result) {
                alert('dialog closed with result: ' + result);
            }
        });
        return;

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
        if ($rootScope.user.status != "connected"){
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


        $('#myModal').modal();
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
myApp.run(['$rootScope', '$window', '$http', '$cookieStore', function($rootScope, $window, $http, $cookieStore) {

    $rootScope.user = {
        infos: null,
        accessToken: null,
        votes: [[],[],[]],
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
                            $rootScope.user.infos = data;
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
                        $rootScope.user.infos = data;
                        $cookieStore.put("tok", token_new);
                        console.log("PUT TOK | ", token_new);
                    });

                }

                $rootScope.user.status = "connected";
                $rootScope.user.accessToken = response.authResponse.accessToken;
                //var uid = response.authResponse.userID;

            } else if (response.status === 'not_authorized') {
                $rootScope.user.status = "not_authorized";
                $cookieStore.remove("tok");
                console.log("UNSET TOK");
            } else {
                $rootScope.user.status = "unknown";
                $cookieStore.remove("tok");
                console.log("UNSET TOK");
                // the user isn't logged in to Facebook.
            }
        });

    };



}]);
