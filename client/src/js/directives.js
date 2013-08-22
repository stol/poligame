
moiElu.directive('results', function() {
    return function($scope, element, attrs) {

        if (attrs.results == "net"){
            var votes = $scope.texte.votes;
        }
        else if (attrs.results == "assemblee"){
            var votes = $scope.texte.votes_assemblee;
        }

        var r = Raphael(element[0]);

        var temp1 = [votes.pour, votes.contre, votes.abstention];
        temp = _.sortBy(temp1, function(vote){ return -vote.nb });

        r.piechart(40, 40, 40, [temp[0].nb, temp[1].nb, temp[2].nb],{
            init: false,
            legendpos: "east",
            colors: [temp[0].color, temp[1].color, temp[2].color],
            legend: ["%%.% "+temp[0].label, "%%.% "+temp[1].label, "%%.% "+temp[2].label]
        });
    };
});

moiElu.directive('myCurrentTime', function($timeout, dateFilter) {
    // return the directive link function. (compile function not needed)
    return function($scope, element, attrs) {
        var timeoutId; // timeoutId, so that we can cancel the time updates
 
        // used to update the UI
        function updateTime() {
            var hop = moment($scope.texte.ends_at).fromNow();
            var txt = dateFilter(new Date(), "YYYY");
            element.text(hop);
        }

        // schedule update in one second
        function updateLater() {
            // save the timeoutId for canceling
            timeoutId = $timeout(function() {
                updateTime(); // update DOM
                updateLater(); // schedule another update
            }, 1000);
        }
 
        // listen on DOM destroy (removal) event, and cancel the next UI update
        // to prevent updating time after the DOM element was removed.
        element.on('$destroy', function() {
            $timeout.cancel(timeoutId);
        });
 
        updateLater(); // kick off the UI update process.
    }
});
