
moiElu.directive('results', function(Textes) {
    return function($scope, element, attrs, Textes) {

        var texte = $scope.texte.then && $scope.texte.$$v || $scope.texte;

        if (attrs.results == "net"){
            var votes = texte.votes;
            var r_label = "Votes des internautes";
        }
        else if (attrs.results == "assemblee"){
            if (texte.votes_assemblee.total == 0){
                $(element[0]).text("Les votes de vos députés n'ont pas encore été enregistrés dans la base de donnée. Revenez un peu plus tard !");
                return;
            }

            var votes = texte.votes_assemblee;
            var r_label = "Votes des députés";
        }

        else {

            var toDisplay = attrs.results;
            var node = element[0];
            $(node).addClass("row");

            for (var i=0; i<texte.stats[toDisplay].length; i++){
                var votes = texte.stats[toDisplay][i];
                var nb = votes.pour.nb + votes.contre.nb + votes.abstention.nb;
                if (!nb){
                    continue;
                }

                var data = _.sortBy([votes.pour, votes.contre, votes.abstention], function(vote){ return -vote.nb });
                
                var r_label = votes.label + "\n("+nb+" votes)";

                var graph = $('<div class="span3"></div>').appendTo(node)[0];
                var r = Raphael(graph);
                r.setSize(150,200);

                r.text(0, 20, r_label).attr({ font: "300 18px Roboto Condensed", fill: '#828282', 'text-anchor': 'start' });

                r.piechart(40, 100, 40, [data[0].nb, data[1].nb, data[2].nb],{
                    init: false,
                    legendpos: "east",
                    colors: [data[0].color, data[1].color, data[2].color],
                    legend: ["%%.% "+data[0].label, "%%.% "+data[1].label, "%%.% "+data[2].label]
                });


            }
            var r_label = "Catégories socio-professionnelles";
            //var votes = texte.stats.;
            return;
        }


        var data = _.sortBy([votes.pour, votes.contre, votes.abstention], function(vote){ return -vote.nb });

        var node = element[0];
        var r = Raphael(node);
        r.setSize(200,120);

        r.text(0, 20, r_label).attr({ font: "300 26px Roboto Condensed", fill: '#828282', 'text-anchor': 'start' });

        r.piechart(40, 80, 40, [data[0].nb, data[1].nb, data[2].nb],{
            init: false,
            legendpos: "east",
            colors: [data[0].color, data[1].color, data[2].color],
            legend: ["%%.% "+data[0].label, "%%.% "+data[1].label, "%%.% "+data[2].label]
        });
    };
});

moiElu.directive('humanTime', ['$timeout', 'dateFilter', function($timeout, dateFilter) {
    // return the directive link function. (compile function not needed)
    return function($scope, element, attrs) {
        var timeoutId; // timeoutId, so that we can cancel the time updates
 
        // used to update the UI
        function updateTime() {
            var texte = $scope.texte.$$v || $scope.texte;
            var hop = moment.unix(texte[attrs.humanTime]).fromNow();
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
 
        //updateLater(); // kick off the UI update process.
        updateTime();
    }
}]);

moiElu.directive('fbComments', ['$window', function($window) {  
    return {
        restrict: 'E',      
        link: function(scope, element, attr) {
            //return;
            setTimeout(function(){
                $window.FB && FB.XFBML.parse(element[0].parentNode);
            },500);
            
        }
    };  
}]);


moiElu.directive('resultsBars', function(Textes) {
    
    function getMaxOfArray(numArray) {
        return Math.max.apply(null, numArray);
    }


    return function($scope, element, attrs, Textes) {

        var texte = $scope.texte.then && $scope.texte.$$v || $scope.texte;

        if (attrs.resultsBars == "net"){
            var votes = texte.votes;
            var r_label = "Votes des internautes";
        }
        else if (attrs.resultsBars == "assemblee"){
            var votes = texte.votes_assemblee;
            var r_label = "Votes des députés";
        }

        else {

            var toDisplay = attrs.resultsBars;
            var node = element[0];
            $(node).addClass("row");

            for (var i=0; i<texte.stats[toDisplay].length; i++){
                var votes = texte.stats[toDisplay][i];
                var nb = votes.pour.nb + votes.contre.nb + votes.abstention.nb;
                if (!nb){
                    continue;
                }

                var data = _.sortBy([votes.pour, votes.contre, votes.abstention], function(vote){ return -vote.nb });
                
                var r_label = votes.label + "\n("+nb+" votes)";

                var graph = $('<div class="span3"></div>').appendTo(node)[0];
                var r = Raphael(graph);
                r.setSize(200,120);

                r.text(0, 20, r_label).attr({ font: "300 26px Roboto Condensed", fill: '#828282', 'text-anchor': 'start' });

                r.piechart(40, 80, 40, [data[0].nb, data[1].nb, data[2].nb],{
                    init: false,
                    legendpos: "east",
                    colors: [data[0].color, data[1].color, data[2].color],
                    legend: ["%%.% "+data[0].label, "%%.% "+data[1].label, "%%.% "+data[2].label]
                });


            }
            var r_label = "Catégories socio-professionnelles";
            //var votes = texte.stats.;
            return;
        }
        var max = getMaxOfArray([votes.pour.nb, votes.contre.nb, votes.abstention.nb]);
        // pour gagne
        if (votes.total && votes.pour.nb == max ){
            var pour_perc = 100;
            var contre_perc = Math.round(votes.contre.perc * 100 / votes.pour.perc * 10)/10;
            var abstention_perc = Math.round(votes.abstention.perc * 100 / votes.pour.perc * 10)/10;
        }
        // contre gagne
        else if (votes.total && votes.contre.nb == max){
            var pour_perc = Math.round(votes.pour.perc * 100 / votes.contre.perc * 10)/10;
            var contre_perc = 100;
            var abstention_perc = Math.round(votes.abstention.perc * 100 / votes.pour.perc * 10)/10;
        }
        // Abstention gagne
        else if (votes.total && votes.abstention.nb == max){
            var pour_perc = Math.round(votes.pour.perc * 100 / votes.abstention.perc * 10)/10;
            var contre_perc = Math.round(votes.contre.perc * 100 / votes.abstention.perc * 10)/10;
            var abstention_perc = 100;

        }

        if (votes.total == 0 ){
            r_label+= ' indisponibles'
        }
        if (votes.total > 0 ){
            $(element[0]).append('<div class="results_bars-title">'+r_label+'</div>');
        }

        votes.total > 0 && $(element[0]).append(
            '<div class="rb-row rb-row_pour"><span class="rb-row-label">Pour</span><span class="rb-row-bar"><span class="rb-row-bar_inside" style="width:'+pour_perc+'%"></span></span><span class="rb-row-perc">'+votes.pour.perc+'%</span></div>',
            '<div class="rb-row rb-row_contre"><span class="rb-row-label">Contre</span><span class="rb-row-bar"><span class="rb-row-bar_inside" style="width:'+contre_perc+'%"></span></span><span class="rb-row-perc">'+votes.contre.perc+'%</span></div>',
            '<div class="rb-row rb-row_abstention"><span class="rb-row-label">Abstention</span><span class="rb-row-bar"><span class="rb-row-bar_inside" style="width:'+abstention_perc+'%"></span></span><span class="rb-row-perc">'+votes.abstention.perc+'%</span></div>'
        );

    };
});
moiElu.directive('truncateWords', ['nl2brFilter', function(nl2brFilter) {  
    return {
        restrict: 'A',
        //template: '<div>{{truncated}}{{more}}</div>',
        link: function(scope, element, attr) {
            var text = scope.texte.communique || scope.texte.$$v.communique;
            var options = {
                size    : attr.words || 10,
                ellipsis: attr.ellipsis || '...',
                textEllipsis  : attr.textEllipsis || false
            }


            var textTemp = text.replace(/\n/g, "[NL]");

            var words = textTemp.split(/\s/g);

            if (words.length < options.size){
                angular.element.append(text);
                return;
            }

            var textTruncated = words.slice(0,options.size).join(' ').replace(/\[NL\]/g, "\n");
            textTruncated = nl2brFilter(textTruncated);

            var hidden = angular.element('<span class="hidden">'
                +' '+nl2brFilter(words.slice(options.size).join(' ').replace(/\[NL\]/g, "\n\n"))
                +'</span>'
                +'<span>'+options.ellipsis+'</span>');

            element.append(textTruncated);
            element.append(hidden);
            
            if (options.textEllipsis){
                var toggler = angular.element('<a href="#">'+options.textEllipsis+'</a>');
                element.append(' ', toggler)
                toggler.one("click", function(){
                    angular.element(this)
                        .toggleClass("hidden")
                        .prev().toggleClass("hidden")
                        .prev().toggleClass("hidden");
                });
            }

        }
    };  
}]);

