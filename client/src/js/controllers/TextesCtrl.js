moiElu.controller('TextesCtrl', ['$scope', '$location','$http', '$dialog', '$routeParams', '$window', 'Textes', 'User',
function($scope, $location, $http, $dialog, $routeParams, $window, Textes, User) {
    

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
        if (User.isLogged() && User.infos.votes_nb && User.infos.votes_nb % 2 == 0){
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
        User.login().then(function(){
            // Optimistic vote
            User.infos.votes_nb++;
            User.votes[texte.id] = user_vote;

            // Sends the vote to the server
            $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
                user_id: User.infos.id,
                texte_id: texte.id,
                user_vote: user_vote
            }})
            // cancel vote if error
            .success(function(data, status, headers, config) {
                if (data.success){
                    User.publishVote(user_vote, texte);
                }
                else {
                    delete User.votes[texte.id];
                    User.infos.votes_nb--;
                }
            })
            .error(function(data, status, headers, config) {
                delete User.votes[texte.id];
                User.infos.votes_nb--;
                console.log("VOTE texte : Erreur !");
            });


        });
    }

    // API exposition
    $scope.openPopinAndVote = openPopinAndVote;
}]); 