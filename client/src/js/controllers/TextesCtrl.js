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
                //$window.FB.XFBML.parse();
            })
            .error(function(data, status, headers, config) {
                console.log("GET texte : Erreur !");
            });
        }
        else{
            $scope.texte = $rootScope.textes2[$routeParams.texte_id];
        }



    }

    // Sends the vote
    function setChoice(user_vote, texte) {
        $dialog.dialog({
            backdrop: true,
            keyboard: true,
            backdropClick: true,
            templateUrl:  '/views/partials/modal.html',
            controller: 'ModalCtrl'
        }).open().then(function(result){
            result = !!result; // Casts result to boolean
            console.log('dialog closed with result: ' + result);
            result && doVote(user_vote, texte);
        });
    };

    function saveVote(user_vote, texte){
        console.log("saving vote ("+user_vote+") for texte "+texte.id+"...")
        $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
            user_id: $rootScope.user.infos.id,
            texte_id: texte.id,
            user_vote: user_vote
        }})
        .success(function(data, status, headers, config) {
        
        })
        .error(function(data, status, headers, config) {
            console.log("VOTE texte : Erreur !");
        });

        $rootScope.user.votes[texte.id] = user_vote;
        publishVote(user_vote, texte);
    }

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
    $scope.setChoice = setChoice;
}]); 