
moiElu.directive('results', function() {
    return function($scope, element, attrs) {

        if (attrs.results == "net"){
            var votes = $scope.texte.votes;
            var r_label = "Votes des internautes";
        }
        else if (attrs.results == "assemblee"){
            if ($scope.texte.votes_assemblee.total == 0){
                $(element[0]).text("Les votes de vos députés n'ont pas encore été enregistrés dans la base de donnée. Revenez un peu plus tard !");
                return;
            }

            var votes = $scope.texte.votes_assemblee;
            var r_label = "Votes des députés";
        }

        else if (attrs.results == "csp"){
            for (var i=0; i<$scope.texte.stats.csps.length; i++){
                var votes = $scope.texte.stats.csps[i];
                var r_label = votes.label;

                var temp1 = [votes.pour, votes.contre, votes.abstention];
                temp = _.sortBy(temp1, function(vote){ return -vote.nb });

                var graph = element[0].parentNode.appendChild(document.createElement("DIV"))
                var r = Raphael(graph);
                r.setSize(200,120);

                r.text(0, 20, r_label).attr({ font: "20px sans-serif", 'text-anchor': 'start' });

                r.piechart(40, 80, 40, [temp[0].nb, temp[1].nb, temp[2].nb],{
                    init: false,
                    legendpos: "east",
                    colors: [temp[0].color, temp[1].color, temp[2].color],
                    legend: ["%%.% "+temp[0].label, "%%.% "+temp[1].label, "%%.% "+temp[2].label]
                });


            }
            var r_label = "Catégories socio-professionnelles";
            //var votes = $scope.texte.stats.;
            return;
        }


        var temp1 = [votes.pour, votes.contre, votes.abstention];
        temp = _.sortBy(temp1, function(vote){ return -vote.nb });

        var r = Raphael(element[0]);
        r.setSize(200,120);

        r.text(0, 20, r_label).attr({ font: "20px sans-serif", 'text-anchor': 'start' });

        r.piechart(40, 80, 40, [temp[0].nb, temp[1].nb, temp[2].nb],{
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
