
/**
 * Gestion de la navigation
 */
moiElu.controller('NavigationCtrl', ['$scope', '$location', function($scope, $location) {
    $scope.navClass = function (page) {
        var currentRoute = $location.path().substring(1) || 'home';
        return page === currentRoute ? 'active' : '';
    };        
}]);


moiElu.controller('ModalCtrl', ['$scope', 'dialog', function($scope, dialog) {
    $scope.close = function(result){
        dialog.close(result);
    };
    $scope.socialShare = true;
}]);



