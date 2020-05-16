var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	slugg = require('slugg'),
	moment = require('moment'),
	parsedown = require('woods-parsedown'),
	junk = require('junk');

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		// INDEX
		socket.on('newMix', onNewMix);
		socket.on( 'listMix', function (data){ onListMix(socket); });

		// MIX
		socket.on( 'listAllMedias', function (data){ listMedias(data, socket); });
		socket.on('newPosition', reOrderElementInServeur);
		socket.on('deleteEl', deleteElement);

	});


// ------------- F U N C T I O N S -------------------
	// INDEX
	// Lister tous les mix
	function onListMix( socket){
		console.log( "EVENT - onListConf");
    listAllFolders().then(function( allFoldersData) {
      sendEventWithContent( 'listAllFolders', allFoldersData, socket);
    }, function(error) {
      console.error("Failed to list folders! Error: ", error);
    });
	}

	// création d'un nouveau dossier mixette
	function onNewMix( mixData) {
		console.log('New mix: '+ mixData);
		createNewMix(mixData).then(function(newpdata) {
			console.log('newpdata: '+newpdata);
      sendEventWithContent('mixCreated', newpdata);
    }, function(errorpdata) {
      console.error("Failed to create a new folder! Error: ", errorpdata);
      sendEventWithContent('mixAlreadyExist', errorpdata);
    });
	}


	function listMedias(data, socket){
		// const directoryPath = path.join(__dirname, 'uploads');
		const directoryPath = getFullPath(data);
		console.log(getFullPath(data))
		fs.readdir(directoryPath, function (err, files) {
			
			// var files = files.filter(junk.not);
      var files = files.filter(function(file){
                      return file.indexOf('.mp3') !== -1;
                  });
		    //handling error
		    if (err) {
		        return console.log('Unable to scan directory: ' + err);
		    }
		    else{
		    	// remove junk files like .DS_Store
		    	
			    //listing all files using forEach
			    files.forEach(function (file) {
			        // Do whatever you want to do with the file
			        // console.log(file);
			        socket.emit("listMedias", {name:file});
			    });
		    }
		    if(files.length < 1){
		    	socket.emit("emptyFolder");
		    }
		    
		    
		});
	}

	function reOrderElementInServeur(data){
		const dir = getFullPath(data.currentFolder);
		console.log('----------- renommer les fichiers -----------');
		for (var index in data.array) {
		  // index == new number
		  // data.array[index] == old file to change
		  if(parseInt(index) + 1 < 10){
		  	var newName = data.array[index].replace(/^[^-]+-/,'0'+(parseInt(index) + 1)+'-');
		  }
		  else{
		  	var newName = data.array[index].replace(/^[^-]+-/,(parseInt(index) + 1)+'-');
		  }
		  
		  fs.rename(path.join(dir, data.array[index]), path.join(dir, newName), function(err) {
					if ( err ) console.log('ERROR: ' + err);
					else{
            fs.readdir(dir, function(err, files){
              
              var audioFiles = files.filter(function(file){
                  return file.indexOf('.mp3') !== -1;
              });
              // console.log(audioFiles);
              io.sockets.emit('newSrc', audioFiles);
            });
						
					}
			});
		}

	}

	function deleteElement(data){
		// console.log(data);
		var dir = getFullPath(data.currentFolder);
		var elementPath = path.join(dir, data.pathEl);
		console.log(elementPath);
		fs.unlink(elementPath, (err) => {
	  if (err) {
	    console.error(err)
	    return
	  }
	  else{
		  //file removed
		  console.log("file " + elementPath + " has been removed");
		  io.sockets.emit('onDeleteEl', data.id);
	  }

		})
	}



// - - - END FUNCTIONS - - - 
	
	// MIX METHODS
	function createNewMix(mixData) {
    return new Promise(function(resolve, reject) {
    	console.log("COMMON — createNewFolder");

    	var mixDate= mixData.date;
    	var mixName = mixData.titre;
    	var mixAuth = mixData.auteur;
    	var slugmixName = slugg(mixName);
    	var mixPath = getFullPath( slugmixName);
    	var currentDateString = getCurrentDate();

  	  fs.access(mixPath, fs.F_OK, function( err) {
    	  // if there's nothing at path
        if (err) {
        	console.log("New mix created with name " + mixName + " and path " + mixPath);
          fs.ensureDirSync(mixPath);//write new folder in folders
          var fmeta =
            {
              "name" : mixName,
              "date" : mixDate,
              "auteur": mixAuth,
              "created" : currentDateString,
            };
          storeData( getMetaFileOfFolder(mixPath), fmeta, "create").then(function( meta) {
          	console.log('sucess ' + meta)
            resolve( meta);
          });

        } else {
          // if there's already something at path
          console.log("WARNING - the following folder name already exists: " + slugmixName);
          var objectJson = {
            "name": mixName,
            "timestamp": currentDateString
          };
          reject( objectJson);
        }
  	  });

    });
  }

  function listAllFolders() {
    return new Promise(function(resolve, reject) {
  		fs.readdir("sessions", function (err, filenames) {
        if (err) return console.log( 'Couldn\'t read content dir : ' + err);

        var folders = filenames.filter( function(slugFolderName){ return new RegExp("^([^.]+)$", 'i').test( slugFolderName); });
  	    console.log( "Number of folders in " + "sessions" + " = " + folders.length + ". Folders are " + folders);

  	    var foldersProcessed = 0;
  	    var allFoldersData = [];
  		  folders.forEach( function( slugFolderName) {

  		    if( new RegExp("^([^.]+)$", 'i').test( slugFolderName)){
          	var fmeta = getFolderMeta( slugFolderName);
          	fmeta.slugFolderName = slugFolderName;
            allFoldersData.push( fmeta);
          }

          foldersProcessed++;
          if( foldersProcessed === folders.length && allFoldersData.length > 0) {
            console.log( "- - - - all folders JSON have been processed.");
            resolve( allFoldersData);
          }
  		  });
  		});
    });
	}

  // C O M M O N     F U N C T I O N S
  function eventAndContent( sendEvent, objectJson) {
    var eventContentJSON =
    {
      "socketevent" : sendEvent,
      "content" : objectJson
    };
    return eventContentJSON;
  }

  function sendEventWithContent( sendEvent, objectContent, socket) {
    var eventAndContentJson = eventAndContent( sendEvent, objectContent);
    console.log("eventAndContentJson " + JSON.stringify( eventAndContentJson, null, 4));
    if( socket === undefined)
      io.sockets.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
    else
      socket.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
  }
function getFullPath( path) {
    return "sessions" + "/" + path;
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

  function getFolderMeta( slugFolderName) {
		console.log( "COMMON — getFolderMeta");

    var folderPath = getFullPath( slugFolderName);
  	var folderMetaFile = getMetaFileOfFolder( folderPath);

		var folderData = fs.readFileSync( folderMetaFile,"UTF-8");
		var folderMetadata = parseData( folderData);

    return folderMetadata;
  }

  function textifyObj( obj) {
    var str = '';
    console.log( '1. will prepare string for storage');
    for (var prop in obj) {
      var value = obj[prop];
      console.log('2. value ? ' + value);
      // if value is a string, it's all good
      // but if it's an array (like it is for medias in publications) we'll need to make it into a string
      if( typeof value === 'array')
        value = value.join(', ');
      // check if value contains a delimiter
      if( typeof value === 'string' && value.indexOf('\n----\n') >= 0) {
        console.log( '2. WARNING : found a delimiter in string, replacing it with a backslash');
        // prepend with a space to neutralize it
        value = value.replace('\n----\n', '\n ----\n');
      }
      str += prop + ': ' + value + "\n\n----\n\n";
    }
    console.log( '3. textified object : ' + str);
    return str;
  }
};
