// myApp module with myApp.controllers dependency containing all controllers
// and ngMockE2E dependency containing $httpBackend service

var myApp = angular.module('myApp', []);

  // routes declaration
myApp.config(['$routeProvider', function($routeProvider) {
    $routeProvider.when('/edit', {
        templateUrl: 'partial_edit.html',
        controller: 'FriendEditCtrl'
    });

    $routeProvider.when('/', {
        templateUrl: 'views/list.html',
        controller: 'ListCtrl'
    });
    $routeProvider.otherwise({ redirectTo: '/' });
}]);

myApp.config(['$locationProvider', function($locationProvider) {
    $locationProvider.html5Mode(true);
}]);

myApp.controller('ListCtrl', ['$scope', '$location','$http', function($scope, $location, $http) {


    $http({method: 'GET', url: '/questions'})
    .success(function(data, status, headers, config) {
        console.log("succès !");
        $scope.questions = data
    })
    .error(function(data, status, headers, config) {
        console.log("Erreur !");
    });

    $scope.vote = function() {
        console.log(this);
        /*
        $http({method: 'GET', url: '/questions'})

        $scope.todos.push({text:$scope.todoText, done:false});
        $scope.todoText = '';
        */
    };
}]); 


// application initialization : declare $httpBackend.when*() behaviors
myApp.run();

// controllers module, with ngResource module dependency to use $resource
