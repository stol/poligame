moiElu.service('Social', ['$window', function($window) {

    "use strict";

    var loaded_libs = [];
    var actions = {};
    var inits = {};

    var ready_libs = {};

    // Charge les librairies des différents réseaux sociaux
    // usage :
    // social.load() => loads all the libs
    // social.load("facebook") => loads facebook lib
    // social.load(["facebook", "google"]) => loads facebook & google lib
    function load(lib){
        loaded_libs = lib;

        // Load de la lib facebook
        if (!lib || lib.indexOf("facebook") >= 0 ){
            (function(d, s, id){
                var js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) {return;}
                js = d.createElement(s); js.id = id; js.src = "//connect.facebook.net/fr_FR/all.js";
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));

            $window.fbAsyncInit = function() {
                ready_libs["facebook"] = $window.FB;

                if (!actions["facebook"].length){
                    return;
                }
                    
                for(var i=0; i<actions["facebook"].length; i++){
                    actions["facebook"][i]($window.FB);
                }

            };
        }

        // Load de la lib twitter
        if (!lib || lib.indexOf("twitter") >= 0){
            $window.twttr = (function (d,s,id) {
                var t, js, fjs = d.getElementsByTagName(s)[0]; if (d.getElementById(id)) return;
                js=d.createElement(s); js.id=id; js.src="https://platform.twitter.com/widgets.js";
                fjs.parentNode.insertBefore(js, fjs); return $window.twttr || (t = { _e: [], ready: function(f){ t._e.push(f) } });
            }(document, "script", "twitter-wjs"));

            $window.twttr.ready(function(twttr){
                ready_libs["twitter"] = twttr;

                if (!actions["twitter"].length){
                    return;
                }
                    
                for(var i=0; i<actions["twitter"].length; i++){
                    actions["twitter"][i] && actions["twitter"][i](twttr);
                }


            });

        }

        // Load de la lib google
        if (!lib || lib.indexOf("google") >= 0){
            $window.___gcfg = {
                lang: 'fr',
                parsetags: 'explicit'
            }
            
            ;(function() {
                var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
                po.src = 'https://apis.google.com/js/plusone.js?onload=plusoneLoaded';
                var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s)
            })();

            $window.plusoneLoaded = function(){
                if (!actions["google"].length){
                    return;
                }
                    
                for(var i=0; i<actions["google"].length; i++){
                    actions["google"][i]($window.gapi);
                }
                ready_libs["facebook"] = $window.gapi;
            }

        }
        
    }

    function register(lib, action){
        if (ready_libs[lib]){
            action(ready_libs[lib]);
        }
        else{
            actions[lib] = actions[lib] || [];
            actions[lib].push(action);
        }
    }

    function init(lib, init){
        // Already initialized ?
        if (inits[lib]){
            throw "Social : " + lib + " has already been initialized";
        }

        // Load lib if not already loaded
        loaded_libs.indexOf(lib) >=0 || load(lib);

        // Register initialization before already registered actions
        actions[lib] = actions[lib] ? [init].concat(actions[lib]) : [init];

        inits[lib] = true;
    }

    return {
        load: load,
        register: register,
        init: init
    }
}]);