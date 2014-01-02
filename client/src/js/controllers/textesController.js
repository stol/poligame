moiElu.controller('TextesController', ['$scope', '$location','$http', '$modal', '$routeParams', '$window', 'Textes', 'User', 'Cookies',
function($scope, $location, $http, $modal, $routeParams, $window, Textes, User, Cookies) {
    

    $scope.moreInfo = false;

    var Article = {
        isVoted: function(){
            if (!User.votes[TYPE_ARTICLE]){
                return null;
            }
            return !!User.votes[TYPE_ARTICLE][this.id];
        }
    }


    $scope.init_order = function(){
        mode = $routeParams.mode || 'default';
        if (mode == 'future')       $scope.order = 'starts_at';
        else if (mode == 'present') $scope.order = 'ends_at';
        else                        $scope.order = '-ends_at';
    }

    Textes.get().then(function(textes){
        $scope.textes = textes;

    });

    $scope.init_texte = function (){
        if (!$routeParams.texte_id){
            return;
        }
        
        Textes.get({id: $routeParams.texte_id}).then(function(texte){
            $scope.texte = texte;
        });


        /*
        $http({
            method: 'GET',
            url: '/textes/'+$routeParams.texte_id+'/articles',
            cache: true
        }).success(function(articles, status, headers, config) {
            for(var i=0; i<articles.length; i++){
                angular.extend(articles[i], Article);
            }

            $scope.articles = articles;
        });
        */

    }

    // Open the right popin depending the user status
    function openPopinAndVoteArticle(user_vote, texte, article){
        info_needed() && openUserInfosPopin(user_vote, texte, article) || openB4VoteReminderPopin(user_vote, texte, article);
    }

    // Open the right popin depending the user status
    function openPopinAndVote(user_vote, texte) {
        info_needed() && openUserInfosPopin(user_vote, texte) || openB4VoteReminderPopin(user_vote, texte);
    };

    // Opens the "Reminder about your infos" popin
    function openB4VoteReminderPopin(user_vote, texte, article){
        $modal.open({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal-vote.html',
            controller: 'b4VoteReminderCtrl',
            resolve: {
                texte: function(){ return texte},
                user_vote: function(){ return user_vote }
            }
        });
    }

    function info_needed(){
        // On veut un user loggé
        if (!User.isLogged() || !User.infos.votes_nb || User.infos.votes_nb % 2 != 0){
            return false;
        }

        var infos = User.getLocalInfos();
        // On veut qu'il ait encore des infos à renseigner
        if (!infos.csp || !infos.bord || !infos.gender || !infos.age){
            return true;
        }

        return false;
    }

    // Opens the "Share your infos" popin
    function openUserInfosPopin(user_vote, texte, article){
        $modal.open({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal-userinfo.html',
            controller: 'UserInfosPopinCtrl'
        }).result.then(function (result) {
            result = !!result; // Casts result to boolean
            result && openB4VoteReminderPopin(user_vote, texte, article);
        });

        return  true;
    }

    // Starts the vote process
    function doVote(user_vote, texte){
        User.login().then(function(){
            // Optimistic vote
            User.infos.votes_nb++;

            User.votes[TYPE_TEXTE][texte.id] = true;
            // Sends the vote to the server
            $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
                user_id: User.infos.id,
                texte_id: texte.id,
                user_vote: user_vote,
                access_token: User.getAccessToken(),
                csp: User.getLocalInfos().csp,
                bord: User.getLocalInfos().bord,
                gender: User.getLocalInfos().gender,
                age: User.getLocalInfos().age
            }})
            // cancel vote if error
            .success(function(data, status, headers, config) {
                if (!data.success){
                    console.log("VOTE texte 1 : Erreur !");
                    delete User.votes[TYPE_TEXTE][texte.id];
                    User.infos.votes_nb--;
                }
            })
            .error(function(data, status, headers, config) {
                console.log("VOTE texte 2 : Erreur !");
                delete User.votes[texte.id];
                User.infos.votes_nb--;
            });


        });
    }

    $scope.NbParPage = 10;

    $scope.showMoreItems = function(){
        $scope.NbParPage+=10;
    };

    function doToggle(){


    }

    // API exposition
    $scope.openPopinAndVote = openPopinAndVote;
    $scope.openPopinAndVoteArticle = openPopinAndVoteArticle;
}]); 