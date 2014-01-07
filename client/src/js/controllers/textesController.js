poligame.controller('TextesController', ['$scope', '$location','$http', '$modal', '$routeParams', '$window', 'Textes', 'User', 'Cookies', 'Social',
function($scope, $location, $http, $modal, $routeParams, $window, Textes, User, Cookies, Social) {
    

    $scope.moreInfo = false;
    $scope.NbParPage = 15;

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
        return false;
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

    function openLinkProposalPopin(texte){
        $modal.open({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal-link.html',
            controller: 'VoteProposalCtrl',
            resolve: {
                texte: function(){ return texte}
            }
        }).result.then(function (result) {
            result = !!result; // Casts result to boolean
            console.log("RESULT !");
        });

        return true;
    }


    $scope.showMoreItems = function(){
        $scope.NbParPage+=15;
    };

    // API exposition
    $scope.openPopinAndVote = openPopinAndVote;
    $scope.openPopinAndVoteArticle = openPopinAndVoteArticle;
    $scope.openLinkProposalPopin = openLinkProposalPopin;
}]); 