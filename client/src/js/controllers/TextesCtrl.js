moiElu.controller('TextesCtrl', ['$rootScope', '$scope', '$location','$http', '$dialog', '$routeParams', '$window',
function($rootScope, $scope, $location, $http, $dialog, $routeParams, $window) {
    

    var Texte = {
        isVoted: function(user_vote){
            if (user_vote != undefined)
                return $rootScope.user.votes[this.id] && $rootScope.user.votes[this.id] === user_vote || false;
            else
                return !!$rootScope.user.votes[this.id];
        },

        date_start: function(){
            return moment(this.starts_at).format("ll")
        },
        date_end: function(){
            return moment(this.ends_at).format("ll")
        }
    }


    $scope.init = function(mode){
        mode = mode || 'default';
        // Loading des textes, ajoutées au scope global pour pas les recharger qd on change de page
        if (!$rootScope['mode_'+mode+'_done']){
            
            $http({method: 'GET', url: '/textes', params:{
                'mode' : mode
            }})
            .success(function(textes, status, headers, config) {
                $rootScope['mode_'+mode+'_done'] = true;
                $rootScope.textes2 = $rootScope.textes2 || {};
                $scope.textes = $scope.textes || {};
                for( var i=0, l = textes.length; i<l;i++){
                    angular.extend(textes[i], Texte);
                    $rootScope.textes2[textes[i].id] = textes[i];
                    $scope.textes[textes[i].id] = textes[i];
                }

                
            })
            .error(function(data, status, headers, config) {
                console.log("GET texteS : Erreur !");
            });
        }
        else{
            $scope.textes = $scope.textes || {};
            angular.forEach($rootScope.textes2, function(texte, id){
                if (texte.mode == mode)
                    $scope.textes[id] = texte;
            });
        }

    }

    if ($routeParams.texte_id){
        if (!$rootScope.textes2 || !$rootScope.textes2[$routeParams.texte_id]){
            $http({method: 'GET', url: '/textes/'+$routeParams.texte_id})
            .success(function(texte, status, headers, config) {
                angular.extend(texte, Texte);
                $rootScope.textes2 = $rootScope.textes2 || {};
                $rootScope.textes2[texte.id] = texte;
                $scope.texte = $rootScope.textes2[texte.id];

                $window.FB && FB.XFBML.parse(jQuery(".fb-comments").parent()[0]);


            })
            .error(function(data, status, headers, config) {
                console.log("GET texte : Erreur !");
            });
        }
        else{
            $scope.texte = $rootScope.textes2[$routeParams.texte_id];
            $window.FB && FB.XFBML.parse(jQuery(".fb-comments").parent()[0]);
        }
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
        if ($rootScope.user.status != "connected"){
            console.log("doVote: user pas loggé. Trying to logg in facebook...")
            FB.login(function(response) {
                console.log('doVote: FB login DONE. reponse = ', response);
                if (response.authResponse) {
                    console.log('doVote: registering after login action ');
                    $rootScope.afterLogin.push(function(){
                        console.log("doVote : anonymous call before savevote");
                        saveVote(user_vote, texte);
                    });
                } else {
                    console.log('User cancelled login or did not fully authorize.');
                }
            }, {scope: 'publish_actions'});

            return;
        }
        saveVote(user_vote, texte);
    }

    // Saves the vote to server
    function saveVote(user_vote, texte){
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