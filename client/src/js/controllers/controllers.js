
/**
 * Gestion de la navigation
 */
moiElu.controller('NavigationCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'active' : '';
    };        
}]);


moiElu.controller('ModalCtrl', ['$rootScope', '$scope', 'dialog', function($rootScope, $scope, dialog) {

	if ($rootScope.user.infos){
		$scope.csp    = angular.copy($rootScope.user.infos.csp);
		$scope.gender = angular.copy($rootScope.user.infos.gender);
		$scope.bord   = angular.copy($rootScope.user.infos.bord);
	}

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
	for( var i=12; i<=100; i++){
		$scope.ages.push(i);
	}

    $scope.close = function(result){
    	console.log("CLOSE !");
    	if ($rootScope.user.infos){
    		$rootScope.user.infos.csp = $scope.csp;
    		$rootScope.user.infos.bord = $scope.bord;
    		$rootScope.user.infos.gender = $scope.gender;
			$rootScope.$broadcast('userChanged');
		}
        dialog.close(result);
    };
    $scope.socialShare = true;
}]);



