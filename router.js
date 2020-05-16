var _ = require("underscore");
var url = require('url')
var fs = require('fs-extra');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var formidable = require('formidable');
var parsedown = require('woods-parsedown'),
    slugg = require('slugg'),
    moment = require('moment'),
    path = require("path");
var contentDir = "sessions";

module.exports = function(app,io,m){

  /**
  * routing event
  */
  app.get("/", getIndex);
  // app.post("/file-upload", multipartMiddleware, postFile);

  app.get("/:mix", getMix);
  app.post("/:mix/file-upload", multipartMiddleware, postFile);

  /**
  * routing functions
  */

  // GET
  // function getIndex(req, res) {
  //   res.render("index", {title : "radio psg matin"});
  // };

  function getIndex(req, res) {
    var pageTitle = "Tool for Awesome Radio Shows";
    res.render("index", {title : pageTitle});
  };

  function getMix(req, res) {
    var fmeta = getFolderMeta(req.params.mix);
    var mixTitle = fmeta.name;
    var mixDate = fmeta.date; 
    var mixAuteur = fmeta.auteur;
    res.render("mixette", {title : mixTitle, date: mixDate, auteur: mixAuteur});
  };

  function postFile(req, res) {
    console.log("------ Requête reçue ! -----");
    var slugMixName = req.params.mix;
    var dir = getFullPath(slugMixName);
    console.log(dir);
    // var dir = __dirname + "/uploads/";

    // // https://github.com/burib/nodejs-multiple-file-upload-example
    req.files.files.forEach(function (element, index, array) {
      // console.log(index);
      countNumberOfFilesInDir(dir).then(function(result) {
        if(index > 0){
          fs.readFile(element.path, function (err, data) {
            var name = element.name;
            var id = convertToSlug(name);
            if(result < 10){
              var prefix = '0' + result + '-';
            }
            else{
              var prefix = result + '-';
            }
            var nameWithPrefix = prefix + name;
            var newPath = dir +'/'+ nameWithPrefix;
            fs.writeFile(newPath, data, function (err) {
              io.sockets.emit("newMedia", {path: newPath, name:nameWithPrefix, id: id});
              // supprimer les fichiers temporaires stockés par multipart
              fs.unlink(element.path, (err) => {
                if (err) {
                  console.error(err)
                  return
                }
                console.log('file has been removed');
              });
              if(err) {
                console.log(err);
              }
            });


          });
        }
      });

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


  function getFolderMeta( slugFolderName) {
    console.log( "COMMON — getFolderMeta");

    var folderPath = getFullPath( slugFolderName);
    var folderMetaFile = getMetaFileOfFolder( folderPath);

    var folderData = fs.readFileSync( folderMetaFile,"UTF-8");
    var folderMetadata = parseData( folderData);

    return folderMetadata;
  }

  function getFullPath( path) {
    return contentDir + "/" + path;
  }

  function getMetaFileOfFolder( folderPath) {
    return folderPath + '/' + 'data' + '.txt';
  }

  function parseData(d) {
    var parsed = parsedown(d);
    return parsed;
  }

  function getCurrentDate() {
    return moment().format('YYYYMMDD_HHmmss');
  }

  function storeData( mpath, d, e) {
    return new Promise(function(resolve, reject) {
      console.log('Will store data', mpath);
      var textd = textifyObj(d);
      if( e === "create") {
        fs.appendFile( mpath, textd, function(err) {
          if (err) reject( err);
          resolve(parseData(textd));
        });
      }
      if( e === "update") {
        fs.writeFile( mpath, textd, function(err) {
        if (err) reject( err);
          resolve(parseData(textd));
        });
      }
    });
  }

  function textifyObj( obj) {
    var str = '';
    // console.log( '1. will prepare string for storage');
    for (var prop in obj) {
      var value = obj[prop];
      // console.log('2. value ? ' + value);
      // if value is a string, it's all good
      // but if it's an array (like it is for medias in publications) we'll need to make it into a string
      if( typeof value === 'array')
        value = value.join(', ');
      // check if value contains a delimiter
      if( typeof value === 'string' && value.indexOf('\n----\n') >= 0) {
        // console.log( '2. WARNING : found a delimiter in string, replacing it with a backslash');
        // prepend with a space to neutralize it
        value = value.replace('\n----\n', '\n ----\n');
      }
      str += prop + ': ' + value + "\n\n----\n\n";
    }
    // console.log( '3. textified object : ' + str);
    return str;
  }

};
