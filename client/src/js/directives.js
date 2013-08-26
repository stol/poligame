
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

        else {

            var toDisplay = attrs.results;
            var node = element[0];
            $(node).addClass("row");

            for (var i=0; i<$scope.texte.stats[toDisplay].length; i++){
                var votes = $scope.texte.stats[toDisplay][i];

                var data = _.sortBy([votes.pour, votes.contre, votes.abstention], function(vote){ return -vote.nb });
                var nb = votes.pour.nb + votes.contre.nb + votes.abstention.nb;
                var r_label = votes.label + "\n("+nb+" votes)";

                var graph = $('<div class="span3"></div>').appendTo(node)[0];
                var r = Raphael(graph);
                r.setSize(200,120);

                r.text(0, 20, r_label).attr({ font: "14px sans-serif", 'text-anchor': 'start' });

                r.piechart(40, 80, 40, [data[0].nb, data[1].nb, data[2].nb],{
                    init: false,
                    legendpos: "east",
                    colors: [data[0].color, data[1].color, data[2].color],
                    legend: ["%%.% "+data[0].label, "%%.% "+data[1].label, "%%.% "+data[2].label]
                });


            }
            var r_label = "Catégories socio-professionnelles";
            //var votes = $scope.texte.stats.;
            return;
        }


        var data = _.sortBy([votes.pour, votes.contre, votes.abstention], function(vote){ return -vote.nb });

        var node = element[0];
        var r = Raphael(node);
        r.setSize(200,120);

        r.text(0, 20, r_label).attr({ font: "20px sans-serif", 'text-anchor': 'start' });

        r.piechart(40, 80, 40, [data[0].nb, data[1].nb, data[2].nb],{
            init: false,
            legendpos: "east",
            colors: [data[0].color, data[1].color, data[2].color],
            legend: ["%%.% "+data[0].label, "%%.% "+data[1].label, "%%.% "+data[2].label]
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
