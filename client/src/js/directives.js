
poligame.directive('results', function(Textes) {
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

poligame.directive('humanTime', ['$timeout', 'dateFilter', function($timeout, dateFilter) {
    // return the directive link function. (compile function not needed)
    return function($scope, element, attrs) {
 
        var texte = $scope.texte.$$v || $scope.texte;
        var hop = moment.unix(texte[attrs.humanTime]).fromNow();
        var txt = dateFilter(new Date(), "YYYY");
        element.text(hop);
    }
}]);

poligame.directive('duration', ['$timeout', 'dateFilter', function($timeout, dateFilter) {
    // return the directive link function. (compile function not needed)
    return function($scope, element, attrs) {
        var texte = $scope.texte.$$v || $scope.texte;
        var starts_at = moment.unix(texte.starts_at);
        var ends_at = moment.unix(texte.ends_at);
        var duration = ends_at.from(starts_at);
        element.text("pendant "+duration);
    }
}]);



poligame.directive('fbComments', ['$window', function($window) {  
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


poligame.directive('resultsBars', function(Textes) {
    
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
        else{
            var pour_perc = 0;
            var contre_perc = 0;
            var abstention_perc = 0;
        }

        /*
        if (votes.total == 0 ){
            r_label+= ' indisponibles'
        }
        */
        if (attrs.resultsBars == "net"){
            r_label+= ' ('+votes.total+')'
        }
        $(element[0]).append('<div class="results-bars__title">'+r_label+'</div>');

        if (attrs.resultsBars == "assemblee" && votes.total == 0){
            $(element[0]).append('<div class="results-bars__stitle">Données non disponibles</div>');
        }
        else{
            $(element[0]).append(
                '<div class="results-bars__row results-bars__row-pour"><span class="results-bars__row-label">Pour</span><span class="results-bars__row-bar"><span class="results-bars__inside" style="width:'+pour_perc+'%"></span></span><span class="results-bars__row-perc">'+votes.pour.perc+'%</span></div>',
                '<div class="results-bars__row results-bars__row-contre"><span class="results-bars__row-label">Contre</span><span class="results-bars__row-bar"><span class="results-bars__inside" style="width:'+contre_perc+'%"></span></span><span class="results-bars__row-perc">'+votes.contre.perc+'%</span></div>',
                '<div class="results-bars__row results-bars__row-abstention"><span class="results-bars__row-label">Abstention</span><span class="results-bars__row-bar"><span class="results-bars__inside" style="width:'+abstention_perc+'%"></span></span><span class="results-bars__row-perc">'+votes.abstention.perc+'%</span></div>'
            );
        }

    };
});
poligame.directive('truncateWords', ['nl2brFilter', function(nl2brFilter) {  
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

