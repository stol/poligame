poligame.filter('nl2br', function () {
    return function(text) {
        if (!text)
            return '';
        return text.replace(/\n/g, '<br/>');
    }
});


poligame.filter('truncateChars', function () {
    return function(text, size, omission, ignore) {
        var options = {
            size    : size || 240,
            omission: omission || '...',
            ignore  : ignore || true
        }

        var textDefault = text,
            textTruncated,
            elements = $(this),
            regex    = /[!-\/:-@\[-`{-~]$/;

        if (textDefault.length > options.size) {
            textTruncated = $.trim(textDefault).
                            substring(0, options.size).
                            split(' ').
                            slice(0, -1).
                            join(' ');

            if (options.ignore) {
                textTruncated = textTruncated.replace( regex , '' );
            }

            return textTruncated + options.omission;
        }
        else{
            return text;
        }
    }
});

poligame.filter('truncateWords', function () {
    return function(text, size, omission, toggleText) {

        var options = {
            size    : size || 10,
            omission: omission || '...',
            toggleText  : toggleText || false
        }

        var textTemp = text.replace(/\n/g, "[NL]");

        var words = textTemp.split(/\s/g);
        if (words.length < options.size){
            return text;
        }

        var textTruncated = words.slice(0,options.size).join(' ').replace(/\[NL\]/g, "\n");

        textTruncated += '<span class="hidden">'
            +words.slice(options.size+1).join(' ').replace(/\[NL\]/g, "\n")
            +'</span>'

        textTruncated += '<span>'+options.omission+'</span>';
        if (toggleText){
            textTruncated += ' <a href="#">'+toggleText+'</a>'
        }
    }
});