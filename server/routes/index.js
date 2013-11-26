
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index', {
        title: 'Moi, président'
        ,og_title: ''
        ,og_url: req.protocol + "://" + req.get('host') + req.url
    });
};

exports.about = function(req, res){
    res.render('index', {
        title: 'Moi, président'
        ,og_title: ''
        ,og_url: req.protocol + "://" + req.get('host') + req.url
    });
};