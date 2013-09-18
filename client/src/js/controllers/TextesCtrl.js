moiElu.controller('TextesCtrl', ['$scope', '$location','$http', '$modal', '$routeParams', '$window', 'Textes', 'User', 'Cookies',
function($scope, $location, $http, $modal, $routeParams, $window, Textes, User, Cookies) {
    

    $scope.moreInfo = false;

    var Article = {
        isVoted: function(){
            return !!(User.votes[TYPE_ARTICLE] && User.votes[TYPE_ARTICLE][this.id]);
        }
    }


    $scope.init_textes = function(mode){
        mode = mode || 'default';

        $scope.textes = Textes.get({mode: mode});

    }

    $scope.init_texte = function (){
        if (!$routeParams.texte_id){
            return;
        }
        
        $scope.texte = Textes.get({id: $routeParams.texte_id});


        
        $http({
            method: 'GET',
            url: '/textes/'+$routeParams.texte_id+'/articles',
            cache: true
        }).success(function(articles, status, headers, config) {
            for(var i=0; i<articles.length; i++){
                angular.extend(articles[i], Article);
            }

            $scope.articles = articles;
            $window.FB && FB.XFBML.parse(jQuery(".fb-comments").parent()[0]);
        });

    }

    // Open the right popin depending the user status
    function openPopinAndVoteArticle(user_vote, texte, article){
        info_needed() && openUserInfosPopin(user_vote, texte, article) || openReminderPopin(user_vote, texte, article);
    }

    // Open the right popin depending the user status
    function openPopinAndVote(user_vote, texte) {
        info_needed() && openUserInfosPopin(user_vote, texte) || openReminderPopin(user_vote, texte);
    };

    // Opens the "Reminder about your infos" popin
    function openReminderPopin(user_vote, texte, article){
        $modal.open({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal-vote.html',
            controller: 'ReminderPopinCtrl',
            resolve: {
            }
        }).result.then(function (result) {
            result = !!result; // Casts result to boolean
            result && doVote(user_vote, texte, article);
        });
    }

    function info_needed(){

        // On veut un user loggé
        if (!User.isLogged() || !User.infos.votes_nb || User.infos.votes_nb % 2 != 0){
            return false;
        }

        // On veut qu'il ait encore des infos à renseigner
        if (Cookies.getItem('csp') && Cookies.getItem('bord') && Cookies.getItem('gender') && Cookies.getItem('age')){
            return false;
        }

        return true;
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
            result && openReminderPopin(user_vote, texte, article);
        });

        return  true;
    }

    // Starts the vote process
    function doVote(user_vote, texte, article){
        User.login().then(function(){
            // Optimistic vote
            User.infos.votes_nb++;
            if (article){
                User.votes[TYPE_ARTICLE][article.id] = true;
            }
            else {
                User.votes[TYPE_TEXTE][texte.id] = true;
            }

            // Sends the vote to the server
            $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
                user_id: User.infos.id,
                texte_id: texte.id,
                article_id: article && article.id,
                user_vote: user_vote,
                csp: Cookies.getItem('csp'),
                bord: Cookies.getItem('bord'),
                gender: Cookies.getItem('gender'),
                age: Cookies.getItem('age')
            }})
            // cancel vote if error
            .success(function(data, status, headers, config) {
                if (data.success){
                    !article && User.publishVote(user_vote, texte);
                }
                else {
                    if (!article)
                        delete User.votes[TYPE_TEXTE][texte.id];
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

    function doToggle(){


    }

    // API exposition
    $scope.openPopinAndVote = openPopinAndVote;
    $scope.openPopinAndVoteArticle = openPopinAndVoteArticle;
}]); 