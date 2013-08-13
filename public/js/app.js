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
    
    function isVoted(user_vote){
        if (user_vote != undefined)
            return $rootScope.user.votes[this.id] && $rootScope.user.votes[this.id] === user_vote || false;
        else
            return !!$rootScope.user.votes[this.id];
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
    function setChoice(user_vote, question) {
        $dialog.dialog({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/modal.html',
            controller: 'ModalCtrl'
        }).open().then(function(result){
            result = !!result; // Casts result to boolean
            console.log('dialog closed with result: ' + result);
            result && doVote(user_vote, question);
        });
    };

    function doVote(user_vote, question){
        if ($rootScope.user.status != "connected"){
            console.log("user pas loggé. Trying to logg in facebook...")
            FB.login(function(response) {
                console.log('FB login DONE. reponse = ', response);
                if (response.authResponse) {
                    $rootScope.user.accessToken = response.authResponse.accessToken;
                    doVote(user_vote, question);
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, {scope: 'publish_actions'});
            return;
        }
        console.log("user loggé. voting...")
        $http({method: 'POST', url: '/questions/'+question.id+'/vote', data: {
            user_id: $rootScope.user.infos.id,
            question_id: question.id,
            user_vote: user_vote
        }})
        .success(function(data, status, headers, config) {
        
        })
        .error(function(data, status, headers, config) {
            console.log("VOTE QUESTION : Erreur !");
        });

        $rootScope.user.votes[question.id] = user_vote;
        //publishVote(user_vote, question);
    }

    function publishVote(user_vote, question){
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
            xfbml: true
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
