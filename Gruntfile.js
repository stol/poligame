module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),


        // Configured a task
        concat: {
            css: {
                src: ['public/libs/**/*.css', 'public/css/**.css'],
                dest: 'public/prod.css'
            },
            js: {
                src: [
                    'public/libs/jquery/jquery.min.js',
                    'public/libs/angular/*.js',
                    'public/libs/ui-bootstrap/*.js',
                    'public/libs/raphael/*.js',
                    'public/libs/moment/*.js',
                    'public/libs/underscore/*.js',
                    'public/js/**/*.js',
                ],
                dest: 'public/prod.js'
            }

        }
    });

    // Loaded a task from an npm module
    grunt.loadNpmTasks("grunt-contrib-concat");

    //setup our workflow
    grunt.registerTask("default", "concat");
};