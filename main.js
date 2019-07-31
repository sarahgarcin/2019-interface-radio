var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	junk = require('junk');

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		
		listMedias(socket);

		// socket.on('dropFile', onDropFile);


		socket.on("clearPad", function(){
			var jsonFile = 'uploads/lyon.json';
			var data = fs.readFileSync(jsonFile,"UTF-8");
			var jsonObj = JSON.parse(data);
			jsonObj["files"].length = 0;
			var jsonString = JSON.stringify(jsonObj, null, 4);
      fs.writeFile(jsonFile, jsonString, function(err) {
        if(err) {
            console.log(err);
        } 
        else {
          console.log("remove all files");
          io.sockets.emit("padCleared");
        }
      });
		});
	});


// ------------- F U N C T I O N S -------------------
	function listMedias(socket){
		// var jsonFile = 'uploads/lyon.json';
		// var data = fs.readFileSync(jsonFile,"UTF-8");
		// var jsonObj = JSON.parse(data);
		// for (var i = 0; i < jsonObj["files"].length; i++){
		// 	var name = jsonObj['files'][i].name;
		// 	var id = jsonObj['files'][i].id;
		// 	socket.emit("listMedias", {name:name, id:id});
		// }
		const directoryPath = path.join(__dirname, 'uploads');
		fs.readdir(directoryPath, function (err, files) {
		    //handling error
		    if (err) {
		        return console.log('Unable to scan directory: ' + err);
		    } 
		    files = files.filter(junk.not);
		    //listing all files using forEach
		    files.forEach(function (file) {
		        // Do whatever you want to do with the file
		        console.log(file);
		        socket.emit("listMedias", {name:file});

		    });
		});
	}

// Je n'utilise pas cette fonction pour l'instant
	function onDropFile(id){

		//Save position in json
	  var jsonFile = 'uploads/lyon.json';
    var data = fs.readFileSync(jsonFile,"UTF-8");
    var jsonObj = JSON.parse(data);
    for (var i = 0; i < jsonObj["files"].length; i++){
		  if (jsonObj["files"][i].id == id.id){
		  	var jsonString = JSON.stringify(jsonObj, null, 4);
	      fs.writeFile(jsonFile, jsonString, function(err) {
	        if(err) {
	            console.log(err);
	        } else {
	            console.log("file drop -> The file was saved!");
	        }
	      });
		  }
		}	
	}


// - - - END FUNCTIONS - - - 
};
