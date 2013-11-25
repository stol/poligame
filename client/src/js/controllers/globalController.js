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
        return true;
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


moiElu.controller('AppCtrl', ['$scope', 'User', '$routeParams', function($scope, User, $routeParams) {
    $scope.user = User;
    $scope.routeParams = $routeParams;
}]);














