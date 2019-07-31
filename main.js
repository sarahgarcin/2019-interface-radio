var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	junk = require('junk');

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		
		listMedias(socket);

	});


// ------------- F U N C T I O N S -------------------
	function listMedias(socket){
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



// - - - END FUNCTIONS - - - 
};
