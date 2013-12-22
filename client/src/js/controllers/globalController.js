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
moiElu.controller('NavigationCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'active' : '';
    };

    $scope.showBigHeader = function(){
        //return true;
        return ($location.path().substring(1) || 'home') == 'home';
    }
}]);


/**
 * Gestion des popins
 */
moiElu.controller('ReminderPopinCtrl', ['$scope', '$modalInstance', function($scope, $modalInstance) {
    $scope.close = function(result){
        $modalInstance.close(result);
    };

    $scope.socialShare = true;
}]);

moiElu.controller('UserInfosPopinCtrl', ['$scope', '$modalInstance', 'User', 'Cookies', function($scope, $modalInstance, User, Cookies) {
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


moiElu.controller('UsersController', ['$scope', 'Textes', 'User', '$location', function($scope, Textes, User, $location) {
    User.onConnected(function(e){
        var ids = _.keys(User.votes[TYPE_TEXTE]);
        Textes.get({ids: ids}).then(function(textes){
            $scope.textes = textes;
        });
    }, function(){
        $scope.$apply(function() { $location.path("/"); });
    });
}]);


moiElu.controller('AppCtrl', ['$scope', 'User', '$routeParams', 'Social', '$window', function($scope, User, $routeParams, Social, $window) {
    $scope.user = User;
    $scope.routeParams = $routeParams;

    var IS_TOUCH = !!('ontouchstart' in $window) || !!('onmsgesturechange' in $window);

    Social.init("facebook", function(FB){
        FB.init({ 
            appId: '720373954658968', 
            channelUrl : '//' + window.location.hostname + '/channel_fb.html', // Channel file for x-domain comms
            status: false, 
            cookie: true, 
            xfbml: false
        });
    });

    Social.register("facebook", function(FB){
        IS_TOUCH || FB.XFBML.parse(document.getElementById("fb-header-like").parentNode);
    });

    Social.register("twitter", function(twttr){
        if (IS_TOUCH){
            return;
        }
        twttr.widgets.createFollowButton(
            "stolalex",
            document.getElementById("tw-header-like"),
            function (el) { }, // loaded callback
            { // Options
                lang: "fr",
                showScreenName: "true", // ATTN, il faut un string
                showCount: false
            }
        );
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














