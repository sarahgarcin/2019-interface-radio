var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	junk = require('junk');

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		listMedias(socket);
		socket.on('newPosition', reOrderElementInServeur);
		socket.on('deleteEl', deleteElement);

	});


// ------------- F U N C T I O N S -------------------
	function listMedias(socket){
		const directoryPath = path.join(__dirname, 'uploads');
		fs.readdir(directoryPath, function (err, files) {
			
			var files = files.filter(junk.not);
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

	function reOrderElementInServeur(positionArr){
		const dir = path.join(__dirname, 'uploads');
		console.log('----------- renommer les fichiers -----------');
		for (var index in positionArr) {
		  // index == new number
		  // positionArr[index] == old file to change
		  if(parseInt(index) + 1 < 10){
		  	var newName = positionArr[index].replace(/^[^-]+-/,'0'+(parseInt(index) + 1)+'-');
		  }
		  else{
		  	var newName = positionArr[index].replace(/^[^-]+-/,(parseInt(index) + 1)+'-');
		  }
		  
		  fs.rename(path.join(dir, positionArr[index]), path.join(dir, newName), function(err) {
					if ( err ) console.log('ERROR: ' + err);
					else{
						io.sockets.emit('newSrc', positionArr);
					}
			});
		}

	}

	function deleteElement(data){
		// console.log(data);
		var dir = path.join(__dirname, 'uploads');
		var elementPath = path.join(dir, data.pathEl);
		// console.log(elementPath);
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
};
