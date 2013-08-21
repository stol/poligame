
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , textes = require('./routes/textes')
  , users = require('./routes/users')
  , http = require('http')
  , mysql = require('mysql')
  , path = require('path');


db = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'poligame'
});

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '../client/src/views');
app.set('view engine', 'ejs');

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(__dirname + '../client/src'));
app.use(express.static(path.join(__dirname, '../client/src')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/textes', textes.textes);
app.get('/a-propos', routes.about);
app.get('/textes/:texte_id', textes.show);
app.post('/textes/:texte_id/vote', textes.vote);
app.post('/users/login', users.login);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});