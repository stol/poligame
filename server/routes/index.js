
/*
 * GET home page.
 */

exports.index = function(req, res){
    res.render('index.twig', {
        title: 'Moi, président'
        ,og_url: req.protocol + "://" + req.get('host') + req.url
    });
};

exports.about = function(req, res){
    res.render('index.twig', {
        title: 'Moi, président',
        og_url: req.protocol + "://" + req.get('host') + req.url
    });
};