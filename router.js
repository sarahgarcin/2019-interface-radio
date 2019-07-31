var _ = require("underscore");
var url = require('url')
var fs = require('fs-extra');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var formidable = require('formidable');


module.exports = function(app,io,m){

  /**
  * routing event
  */
  app.get("/", getIndex);
  app.post("/file-upload", multipartMiddleware, postFile);

  /**
  * routing functions
  */

  // GET
  function getIndex(req, res) {
    res.render("index", {title : "radio psg matin"});
  };

  function postFile(req, res) {
    console.log("------ Requête reçue ! -----");
    console.log(req.files);
    for(var i= 0; i<req.files.files.length; i++){
      if(req.files.files[i].size > 0){
        var name = req.files.files[i].name;
        var id = convertToSlug(name);
        var newPath = __dirname + "/uploads/"+name;
        console.log(name);
        fs.readFile(req.files.files[i].path, function (err, data) {
          fs.writeFile(newPath, data, function (err) {
            io.sockets.emit("newMedia", {path: newPath, name:name, id: id});
          });
        });
      }
    }
  };


  function convertToSlug(Text){
    // converti le texte en minuscule
    var s = Text.toLowerCase();
    // remplace les a accentué
    s = s.replace(/[àâäáã]/g, 'a');
    // remplace les e accentué
    s = s.replace(/[èêëé]/g, 'e');
    // remplace les i accentué
    s = s.replace(/[ìîïí]/g, 'i');
    // remplace les u accentué
    s = s.replace(/[ùûüú]/g, 'u');
    // remplace les o accentué
    s = s.replace(/[òôöó]/g, 'o');
    // remplace le c cédille
    s = s.replace(/[ç]/g, 'c');
    // remplace le ene tilde espagnol
    s = s.replace(/[ñ]/g, 'n');
    // remplace tous les caractères qui ne sont pas alphanumérique en tiret
    s = s.replace(/\W/g, '-');
    // remplace les double tirets en tiret unique
    s = s.replace(/\-+/g, '-');
    // renvoi le texte modifié
    return s;
  }

};
