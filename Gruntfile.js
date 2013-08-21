module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        'useminPrepare': {
            html: 'views/index.ejs',
            options: {
                dest: 'public/'
            }
        },

        cssmin:
          { 'public/app.css': 'public/app.css' },

        concat:
          { 'public/app.css': 
           [ 'views/http:/netdna.bootstrapcdn.com/twitter-bootstrap/2.3.1/css/bootstrap.min.css',
             'views/css/jumbotron-narrow.css' ],
          'public/app.js': 
           [ 'views/bower_components/jquery/jquery.min.js',
             'views/bower_components/angular/angular.min.js',
             'views/bower_components/angular-resource/angular-resource.min.js',
             'views/bower_components/angular-cookies/angular-cookies.min.js',
             'views/bower_components/angular-bootstrap/ui-bootstrap-tpls.min.js',
             'views/bower_components/raphael/raphael-min.js',
             'views/bower_components/g.raphael/min/g.raphael-min.js',
             'views/bower_components/g.raphael/min/g.pie-min.js',
             'views/bower_components/moment/moment.js',
             'views/bower_components/underscore/underscore-min.js',
             'views/js/app.js',
             'views/js/controllers/controllers.js',
             'views/js/controllers/TextesCtrl.js',
             'views/js/directives.js' ]
        },
        uglify:{
            'public/app.js': 'public/app.js'
        },

        usemin: {
            html: ['views/index.ejs'],
            css: ['public/app.css'],
            options: {
                dest: 'public/dist/'
            }
        }



    });


    // Loaded a task from an npm module
    grunt.loadNpmTasks("grunt-usemin");

    //setup our workflow
    grunt.registerTask("default", ["usemin"]);
};