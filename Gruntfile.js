module.exports = function(grunt) {

    // load tasks
    [
        'grunt-contrib-clean',
        'grunt-contrib-copy',
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-contrib-cssmin',
        'grunt-contrib-concat',
        'grunt-usemin'
    ].forEach(function(task) { grunt.loadNpmTasks(task); });


    // setup init config
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        // Vider le précédent
        clean: {
            build: ['client/build']
        },
        // Copie des fichiers de devs vers le build
        copy: {
            build: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: 'client/src',
                    dest: 'client/build',
                    src: [
                        '*',
                        '**/**'
                    ]
                }]
            }
        },
        useminPrepare: {
            html: ['client/build/views/index.ejs'],
            options: {
                dest: 'client/build/',
                basedir: 'sfpsdfpo'
            }
        },
        usemin: {
            html: ['client/build/views/index.ejs'],
            options: {
                dirs: ['build/'],
                basedir: 'sfpsdfpo'
            }
        }
    });

    grunt.registerTask('default', ['clean', 'copy',
                                   'useminPrepare',
                                   'concat', 'uglify', 'cssmin',
                                   'usemin']);
};
