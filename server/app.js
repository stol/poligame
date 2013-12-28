
/**
 * Module dependencies.
 */

var express = require('express')
    , routes = require('./routes')
    , textes = require('./routes/textes')
    , users = require('./routes/users')
    , http = require('http')
    , mysql = require('mysql')
    , path = require('path')
    , helmet = require('helmet')
    , request = require('request')
    , Twig = require("twig")
;


TYPE_TEXTE = 1;
TYPE_ARTICLE = 2;
TYPE_AMENDEMENT = 3;


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);

// This section is optional and used to configure twig.
app.set("twig options", {
    strict_variables: false
});

app.use(express.compress());
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());

app.use(helmet.xframe());
app.use(helmet.iexss());
app.use(helmet.contentTypeOptions());
app.use(helmet.cacheControl());


app.use(express.cookieParser('optional secret string'));
app.use(express.session({
    secret: 'keyboard cat',
    key: 'sid',
    //cookie: {httpOnly: true, secure: true}
    cookie: {httpOnly: true}
}));
app.use(express.csrf());
app.use(function (req, res, next) {
    res.locals.csrftoken = req.session._csrf;
    next();
});

app.use(app.router);

app.use(function(req, res, next) {
    
    next();
});

// Production
if ('production' == app.get('env')) {
    console.log("------------\nENV => PRODUCTION\n");
    app.set('views', __dirname + '/../client/build/views');
    app.use(require('stylus').middleware(__dirname + '../client/build'));
    app.use(express.static(path.join(__dirname, '../client/build')));
    db = mysql.createConnection({
        host     : process.env.DB_HOST,
        user     : process.env.DB_USER,
        password : process.env.DB_PASSWORD,
        database : process.env.DB_NAME
    });
}
// Dev with prod assets
else if ('fakeprod' == app.get('env')) {
    console.log("------------\nENV => DEVELOPMENT\n");
    app.set('views', __dirname + '/../client/build/views');
    app.use(express.errorHandler());
    app.use(require('stylus').middleware(__dirname + '../client/build'));
    app.use(express.static(path.join(__dirname, '../client/build')));
    db = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'poligame'
    });
}
// Development 
else{
    console.log("------------\nENV => DEVELOPMENT\n");
    app.set('views', __dirname + '/../client/src/views');
    app.use(express.errorHandler());
    app.use(require('stylus').middleware(__dirname + '../client/src'));
    app.use(express.static(path.join(__dirname, '../client/src')));
    db = mysql.createConnection({
        host     : 'localhost',
        user     : 'root',
        password : '',
        database : 'poligame'
    });
}

app.get ('/', routes.index);
app.get ('/textes', textes.textes);
app.get ('/a-propos', routes.about);
app.get ('/textes/:texte_id', textes.show);
app.get ('/textes/:texte_id/articles', textes.articles);
app.post('/textes/:texte_id/vote', textes.vote);
app.post('/users/login', users.login);
app.post('/users/:user_id', users.update);
app.post('/users/:user_id/qualified', users.qualified);
app.get ('/user', users.show);
app.get ('/users/:user_id', users.show);

http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
