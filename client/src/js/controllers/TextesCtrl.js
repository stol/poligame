moiElu.controller('TextesCtrl', ['$rootScope', '$scope', '$location','$http', '$dialog', '$routeParams', '$window', 'Textes', 'User',
function($rootScope, $scope, $location, $http, $dialog, $routeParams, $window, Textes, User) {
    

    $scope.moreInfo = false;


    $scope.init_textes = function(mode){
        mode = mode || 'default';

        $scope.textes = Textes.get({mode: mode});

    }

    $scope.init_texte = function (){
        var texte_id = $routeParams.texte_id;

        if (!texte_id){
            return;
        }

        
        $scope.texte = Textes.get({id: $routeParams.texte_id});

        $window.FB && FB.XFBML.parse(jQuery(".fb-comments").parent()[0]);

    }

    // Open the right popin depending the user status
    function openPopinAndVote(user_vote, texte) {
        if ($rootScope.user.isLogged && $rootScope.user.infos.votes_nb && $rootScope.user.infos.votes_nb % 2 == 0){
            openUserInfosPopin(user_vote, texte);
        }
        else{
            openReminderPopin(user_vote, texte);
        }
    };

    // Opens the "Reminder about your infos" popin
    function openReminderPopin(user_vote, texte){
        $dialog.dialog({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal-vote.html',
            controller: 'ReminderPopinCtrl'
        }).open().then(function(result){
            result = !!result; // Casts result to boolean
            console.log('dialog closed with result: ' + result);
            result && doVote(user_vote, texte);
        });
    }

    // Opens the "Share your infos" popin
    function openUserInfosPopin(user_vote, texte){
        $dialog.dialog({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal-userinfo.html',
            controller: 'UserInfosPopinCtrl'
        }).open().then(function(result){
            result = !!result; // Casts result to boolean
            result && openReminderPopin(user_vote, texte);
        });        
    }

    // Starts the vote process
    function doVote(user_vote, texte){
        console.log("doVote START");
        User.login().then(function(){
            console.log("doVote => login.then START");
            // Optimistic vote
            $rootScope.user.infos.votes_nb++;
            $rootScope.user.votes[texte.id] = user_vote;

            console.log("saving vote ("+user_vote+") for texte "+texte.id+"...")

            // Sends the vote to the server
            $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
                user_id: $rootScope.user.infos.id,
                texte_id: texte.id,
                user_vote: user_vote
            }})
            // cancel vote if error
            .success(function(data, status, headers, config) {
                if (data.success){
                    publishVote(user_vote, texte);
                }
                else {
                    delete $rootScope.user.votes[texte.id];
                    $rootScope.user.infos.votes_nb--;
                }
            })
            .error(function(data, status, headers, config) {
                delete $rootScope.user.votes[texte.id];
                $rootScope.user.infos.votes_nb--;
                console.log("VOTE texte : Erreur !");
            });


        });
    }

    // Sends the vote to facebook
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
    $scope.openPopinAndVote = openPopinAndVote;
}]); 