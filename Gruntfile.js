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
        clean: { // Vider le build
            build: ['client/build']
        },
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
            html: ['dist/index.html']
        },
        usemin: {
            html: ['dist/index.html'],
            options: {
                dirs: ['dist/']
            }
        }
    });

    grunt.registerTask('default', ['clean', 'copy',
                                   'useminPrepare',
                                   'concat', 'uglify', 'cssmin',
                                   'usemin']);
};
