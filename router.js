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
    var dir = __dirname + "/uploads/";

    // https://github.com/burib/nodejs-multiple-file-upload-example
    req.files.files.forEach(function (element, index, array) {
      if(index > 0){
      fs.readFile(element.path, function (err, data) {
        var name = element.name;
        var id = convertToSlug(name);
        if(index < 10){
          var prefix = '0' + index + '-';
        }
        else{
          var prefix = index + '-';
        }
        var nameWithPrefix = prefix + name;
        var newPath = dir + nameWithPrefix;
        fs.writeFile(newPath, data, function (err) {
          io.sockets.emit("newMedia", {path: newPath, name:nameWithPrefix, id: id});
          if(err) {
            console.log(err);
          }
        });
      });
      }
    });


    
    // countNumberOfFilesInDir(dir).then(function(result) {
    //   for(var i= 0; i<req.files.files.length; i++){
    //     if(req.files.files[i].size > 0){
    //       // console.log(nameWithPrefix);
    //       // console.log('fichier base', req.files.files[i]);
    //       // fs.readFile(req.files.files[i].path, function (err, data) {

    //       //   console.log('fichier après promise', file);
    //       //   var name = file.name;
    //       //   var id = convertToSlug(name);
    //       //   if(result < 10){
    //       //     var prefix = '0' + result + '-';
    //       //   }
    //       //   else{
    //       //     var prefix = result + '-';
    //       //   }
    //       //   var nameWithPrefix = prefix + name;
    //       //   var newPath = dir + nameWithPrefix;
    //       //   writeTheFile(newPath, filePath).then(function(data){
    //       //     // console.log(data);

    //       //     io.sockets.emit("newMedia", {path: newPath, name:nameWithPrefix, id: id});
    //       //   });
    //       // }); 
    //         var name = req.files.files[i].name;
    //         fs.readFile(req.files.files[i].path, function (err, data) {
              
    //           var id = convertToSlug(name);
    //           if(result < 10){
    //             var prefix = '0' + result + '-';
    //           }
    //           else{
    //             var prefix = result + '-';
    //           }
    //           var nameWithPrefix = prefix + name;
    //           var newPath = dir + nameWithPrefix;
    //           fs.writeFile(newPath, data, function (err) {
    //             io.sockets.emit("newMedia", {path: newPath, name:nameWithPrefix, id: id});
    //           });
    //         });
          
          
    //     }
    //   }
    // }, function(err) {
    //     console.log(err);
    // })


  };

  function countNumberOfFilesInDir(dir){
    return new Promise(function(resolve, reject) {
      fs.readdir(dir, function(err, files){
        if (err) 
          reject(err); 
        else 
          resolve(files.length);
      });
    });

  }


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
