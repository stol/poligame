module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        usemin2: {
            options: {
                // If provided, then set all path in html files relative to this directory
                baseDir: "/",

                // Same thing as baseDir but forces path to be absolute to this directory
                absoluteBaseDir: "/",

                // Task(s) to execute to process the css
                cssmin: 'cssmin',

                // Task(s) to execute to process the js
                jsmin: 'uglify'
            },

            // This should contain a reference to all HTML files that usemin2
            // needs to process
            html: 'views/index.ejs',

            // This section contain everything about css files processing
            css: {
                // You can create as much section as you want with
                // any name you want to use
                section_name: {
                    // Each section should define a destination that point to the file
                    // that will be created if the minification process is executed
                    dest: "app.min.css",

                    // Files that needs to be processed for this section
                    files: [{
                        // Same as usual
                        cwd: "src",
                        // List of src (can be an array), each can be expanded,
                        // you can also use a special "__min__" markup to select
                        // thje correct file depending on the running process
                        src: ["css/*.css", "externals/css/*__min__.css"],
                        // Destination of the files when no minification process
                        // occurs
                        dest: "dest/"
                    } /* , ... */]
                }/* , ... */
            },

            // Same as css but for js files
            js: {
                // ...
            }
        }

    });


    // Loaded a task from an npm module
    grunt.loadNpmTasks("grunt-usemin2");

    //setup our workflow
    grunt.registerTask("default", ["usemin2"]);
};