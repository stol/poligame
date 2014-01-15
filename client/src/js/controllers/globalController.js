String.prototype.hashCode = function(){
    var hash = 0;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}


/**
 * Gestion de la navigation
 */
poligame.controller('NavigationCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'is-active' : '';
    };

}]);


/**
 * Gestion de la popin de vote
 */
poligame.controller('b4VoteReminderCtrl', ['$scope', '$modalInstance', 'User', '$http', 'texte', 'user_vote', function($scope, $modalInstance, User, $http, texte, user_vote) {
    var do_share = 1;
    $scope.step = 1;

    $scope.close = function(result){
        $modalInstance.close(result);
    };

    $scope.truc = function(){
        do_share *= -1;
    }

    $scope.next = function(){
        $scope.step = 2;

        // Starts the vote process
        User.login().then(function(){
            // Optimistic vote
            User.infos.votes_nb++;

            User.votes[TYPE_TEXTE][texte.id] = true;
            // Sends the vote to the server
            $http({method: 'POST', url: '/textes/'+texte.id+'/vote', data: {
                user_id: User.infos.id,
                do_share: do_share,
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
                    //console.log("VOTE texte 1 : Erreur !");
                    delete User.votes[TYPE_TEXTE][texte.id];
                    User.infos.votes_nb--;
                }
            })
            .error(function(data, status, headers, config) {
                //console.log("VOTE texte 2 : Erreur !");
                delete User.votes[texte.id];
                User.infos.votes_nb--;
            });


        });
    }

}]);

/**
 * Gestion de la popin de soumission de lien
 */

poligame.controller('LinkProposalCtrl', ['$scope', '$modalInstance', 'User', '$http', 'texte', function($scope, $modalInstance, User, $http, texte) {
    $scope.step = 1;
    $scope.links = [];
    $scope.linkPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/  ;
    $scope.addLink = function(linkUrl){
        // Url valide ?
        if (!linkUrl || !linkUrl.match($scope.linkPattern)){
            return;
        }

        // Déjà présente ?
        if ($scope.links.indexOf(linkUrl) >= 0){
            return;
        }
        $scope.links.push(linkUrl);
        $scope.linkUrl = '';
    }

    $scope.close = function(result){
        $modalInstance.close(result);
    };
    $scope.removeLink = function(index){
        $scope.links.splice(index, 1);
    }

    $scope.send = function(){
        $http({method: 'POST', url: '/textes/'+texte.id+'/links', data: {
            links: $scope.links
        }})
        .success(function(data, status, headers, config) {
            $scope.step = 2;
        })
        .error(function(data, status, headers, config) {
            $scope.step = 3;
        });
    };

}]);

/**
 * Gestion de la popin de demande d'infos perso au visiteur
 */
poligame.controller('UserInfosPopinCtrl', ['$scope', '$modalInstance', 'User', 'Cookies', function($scope, $modalInstance, User, Cookies) {
	$scope.infos = User.getLocalInfos();

	$scope.csps = [
        {id: 1, label: 'Agriculteur exploitant' },
        {id: 2, label: 'Artisan, commerçant et chef d’entreprise' },
        {id: 3, label: 'Cadre et profession intellectuelle supérieure' },
        {id: 4, label: 'Profession intermédiaire' },
        {id: 5, label: 'Employé' },
        {id: 6, label: 'Ouvrier' },
        {id: 7, label: 'Retraité' },
        {id: 8, label: 'Autre personne sans activité professionnelle' }
    ];

	$scope.genders = [
		{id: 1, label: "Homme"},
		{id: 2, label: "Femme"}
	];

	$scope.bords = [
		{id: 1, label: "Extrême gauche"},
		{id: 2, label: "Gauche"},
		{id: 3, label: "Centre-gauche"},
		{id: 4, label: "Centre"},
		{id: 5, label: "Centre-droit"},
		{id: 6, label: "Droite"},
		{id: 7, label: "Extrême droite"}
	];

	$scope.ages = [];
	for( var i=18; i<=100; i++){
		$scope.ages.push(i);
	}

    $scope.close = function(result){
        User.setLocalInfos({
            csp   : $scope.infos.csp,
            bord  : $scope.infos.bord,
            gender: $scope.infos.gender,
            age   : $scope.infos.age
        });

		User.changed();
        $modalInstance.close(result);
    };
    
}]);


poligame.controller('UsersController', ['$scope', 'Textes', 'User', '$location', function($scope, Textes, User, $location) {
    User.onConnected(function(e){
        var ids = _.keys(User.votes[TYPE_TEXTE]);
        Textes.get({ids: ids}).then(function(textes){
            $scope.textes = textes;
        });
    }, function(){
        $scope.$apply(function() { $location.path("/"); });
    });
}]);


poligame.controller('AppCtrl', ['$scope', 'User', '$routeParams', 'Social', '$window','$location', function($scope, User, $routeParams, Social, $window, $location) {
    $scope.user = User;
    console.log($scope.user);
    $scope.routeParams = $routeParams;
    $scope.location = $location

    var IS_TOUCH = !!('ontouchstart' in $window) || !!('onmsgesturechange' in $window);

    $scope.showBigHeader = function(){
        return ($location.path().substring(1) || 'home') == 'home';
    }


    Social.init("facebook", function(FB){
        FB.init({ 
            appId: '720373954658968', 
            channelUrl : '//' + window.location.hostname + '/channel_fb.html', // Channel file for x-domain comms
            status: false, 
            cookie: true, 
            xfbml: false
        });
    });


    // Perf: chargement des boutons de partage en fonction du device
    $window.enquire.register("screen and (min-width:1024px)", {
        is_loaded: false,
        match: function (){
            if (this.is_loaded){
                return;
            }
            Social.init("twitter");
            Social.register("facebook", function(FB){
                FB.XFBML.parse(document.getElementById("fb-header-like").parentNode);
            });
            this.is_loaded = true;
        }
    });
    $(document).on("click", function(){
        if ($("#main-nav__checkbox").is(":checked")){
            $("#main-nav__checkbox").attr('checked', false);
        }
    }).on("click", "#main-nav__checkbox, .main-nav__icon", function(e){
        e.stopPropagation();
    });

    // On cache/affiche le header selon le scroll
    // TODO : utiliser les animations angular plutôt que du code custom
    $window.enquire.register("screen and (max-width:1023px)", {
        match : function() {
            var lastScrollTop = $(window).scrollTop();
            $(window).on("scroll.menu", function(){
                if ($(window).scrollTop() < lastScrollTop && !$(".header__top").is(".is-fixed")){
                    $(".header__top").toggleClass("anim-start").removeClass("anim-end");
                    setTimeout(function(){
                        $(".header__top").addClass("is-fixed").removeClass("anim-start");
                    },0)
                }
                else if ($(window).scrollTop() > lastScrollTop && $(".header__top").is(".is-fixed")) {
                    $(".header__top").toggleClass("is-fixed anim-end");
                }
                
                lastScrollTop = $(window).scrollTop();
            });
        },
        unmatch : function() {
            $(window).off("scroll.menu");
        }
    });


    /*
    social.facebookReady(function(){
        // Le bouton j'aime du header
        IS_NOT_TOUCH && $(document).ready(function() {
            FB.XFBML.parse($(".tools-inner")[0]);
        });

        // Les bouton dans les zones de classe js-fb-unparsed
        (IS_NOT_TOUCH && $(document).on("mouseenter", ".js-fb-unparsed", function(e){
            if (window.isScrolling)
                return;
            $(this).removeClass("js-fb-unparsed");
            FB.XFBML.parse(this);
        })) || FB.XFBML.parse($(".js-fb-unparsed")[0]);

        FB.Event.subscribe('edge.create', function(targetUrl, obj) {
            customEvents.pushStat({
                category: 'social',
                action: obj.getAttribute('ref'),
                label: 'facebook'
            });
        });

        // Les commentaires 
        $(".nr-comments").each(function(i,comment){
            FB.XFBML.parse(comment);
        })

        $(document).on("contentchange", function(){
            if ($(".mvc-facepile.js-unloaded").length){
                var $container = $(".mvc-facepile.js-unloaded");
                $container.removeClass("js-unloaded");
                FB.getLoginStatus(function (response) {
                    // User connecté et a déjà autorisé OU user connecté mais a pas encore autorisé
                    if (response.status === 'connected' || response.status === 'not_authorized') {
                        FB.XFBML.parse($container[0]);
                    }
                });
            }
        });
    })


    social.twitterReady(function(){
        // Le bouton "suivre" du header
        var $followBtn = $(".head-follow-tt");

        IS_NOT_TOUCH && $followBtn.length && twttr.widgets.createFollowButton(
            $followBtn.attr("data-twttr-screen-name"),
            $followBtn[0],
            function (el) { }, // loaded callback
            { // Options
                lang: $followBtn.attr("data-twttr-lang"),
                showScreenName: $followBtn.attr("data-twttr-show-screen-name"), // ATTN, il faut un string
                showCount: false
            }
        );

        // les zones de classe js-tw-unparsed
        (IS_NOT_TOUCH && $(document).on("mouseenter", ".js-tw-unparsed", function(e){
            if (window.isScrolling)
                return;
            $(this).removeClass("js-tw-unparsed");

            var $tweetBtn = $(this).find(".sb-btn_tw.is-fake");

            twttr.widgets.createShareButton(
                $tweetBtn.attr("data-twttr-url"),
                $tweetBtn[0],
                function(el){
                    $tweetBtn.removeClass("is-fake");
                },  // loaded callback
                { // Options
                    lang: $tweetBtn.attr("data-twttr-lang"),
                    text: $tweetBtn.attr("data-twttr-text"),
                    via: $tweetBtn.attr("data-twttr-via"),
                }
            );
        })) || (IS_TOUCH && is_permalink && function(){
            $(".js-tw-unparsed").removeClass("js-tw-unparsed").find(".sb-btn_tw.is-fake").each(function(){
                var $tweetBtn = $(this);
                twttr.widgets.createShareButton(
                    $tweetBtn.attr("data-twttr-url"),
                    $tweetBtn[0],
                    function(el){
                        $tweetBtn.removeClass("is-fake");
                    },  // loaded callback
                    { // Options
                        lang: $tweetBtn.attr("data-twttr-lang"),
                        text: $tweetBtn.attr("data-twttr-text"),
                        via: $tweetBtn.attr("data-twttr-via"),
                    }
                );
            });

        })();


        twttr.events.bind('follow', function(e){
            customEvents.pushStat({
                category: 'social',
                action: 'top_menu',
                label: 'twitter'
            });
        });
        twttr.events.bind('tweet', function(e){
            customEvents.pushStat({
                category: 'social',
                action: 'zone inconnue',
                label: 'twitter'
            });
        });

    })


    social.googleReady(function(){
        (IS_NOT_TOUCH && $(document).on("mouseenter", ".js-gg-unparsed", function(e){
            if (window.isScrolling)
                return;
            $(this).removeClass("js-gg-unparsed");

            var $poBtn = $(this).find(".sb-btn_gg.is-fake");

            gapi.plusone.render(
                $poBtn[0],
                {
                    size: $poBtn.attr("data-gg-size"),
                    annotation: $poBtn.attr("data-gg-annotation"),
                    href: $poBtn.attr("data-gg-href"),
                    recommendations: $poBtn.attr("data-gg-recommendations"),
                    callback: function(data){
                        customEvents.pushStat({
                            category: 'social',
                            action: $poBtn.attr("data-gg-region"),
                            label: 'google'
                        });
                    }
                }
            ) 
        })) || (IS_TOUCH && is_permalink && function(){
            $(".js-gg-unparsed").removeClass("js-gg-unparsed").find(".sb-btn_gg.is-fake").each(function(){
                var $poBtn = $(this);
                gapi.plusone.render(
                    $poBtn[0],
                    {
                        size: $poBtn.attr("data-gg-size"),
                        annotation: $poBtn.attr("data-gg-annotation"),
                        href: $poBtn.attr("data-gg-href"),
                        recommendations: $poBtn.attr("data-gg-recommendations"),
                        callback: function(data){
                            customEvents.pushStat({
                                category: 'social',
                                action: $poBtn.attr("data-gg-region"),
                                label: 'google'
                            });
                        }
                    }
                )
            });
        })();

    })
*/

}]);














