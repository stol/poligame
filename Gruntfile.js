module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        'useminPrepare': {
            html: 'views/index.ejs',
            dest: "public"
        },
        usemin: {
            basedir: '/public',
            options: {
                dest: "public",
                dirs: ['temp', 'dist']
            }
        }
    });


    // Loaded a task from an npm module
    grunt.loadNpmTasks("grunt-usemin");

    //setup our workflow
    grunt.registerTask("default", ["useminPrepare", "usemin"]);
};