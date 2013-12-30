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
            prebuild: ['client/build'],
            postbuild: ['.tmp','client/build/css', 'client/build/js', 'client/build/vendor']
        },
        // Copie des fichiers de devs vers le build
        copy: {
            reset: {
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
            html: 'client/build/views/index.twig',
            options: {
                root: 'client/build/',
                dest: 'client/build/'
            }
        },
        usemin: {
            html: 'client/build/views/index.twig',
            options: {
                root: 'client/build/',
                dest: 'client/build/'
            }
        }
    });

    grunt.registerTask('default', ['clean:prebuild', 'copy',
                                   'useminPrepare',
                                   'concat', 'uglify', 'cssmin',
                                   'usemin',
                                   'clean:postbuild']);
};
