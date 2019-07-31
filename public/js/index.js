/* VARIABLES */
var socket = io.connect();
var zIndex = 0;

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);

socket.on('listMedias', onListMedias);
socket.on('newMedia', onNewMedia); // l'event newMedia se trouve dans router.js

jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});


function init(){

	$(window).on('dragover',function(e){
		$(".drop-files-container").css('pointer-events', "auto");
		e.preventDefault();
		e.stopPropagation();
		return false;
	});
	$(window).on('dragleave',function(e){
		e.preventDefault();
		e.stopPropagation();
		return false;
	});

	$(".drop-files-container").on("drop", function(e) {
		e.preventDefault();
		console.log("DROP FILE");
    var files = e.originalEvent.dataTransfer.files;
    processFileUpload(files); 
    $(".drop-files-container").css('pointer-events', "none");
 		// var id = convertToSlug(files[0].name);
		// socket.emit("dropFile", {id:id});
  	// forward the file object to your ajax upload method
    return false;
	});

	$('.close-audio').on('click', function(){
		var thisPath = $(this).parents('li').find('source').attr('src');
		console.log(thisPath);
	});

}

function onListMedias(data){
	var path = data.name;
	var id = convertToSlug(path);
	var ext = data.name.split('.').pop();
	var mediaItem;

	if(ext == 'mp3'){
		mediaItem = $(".js--templates .son").clone(false);
		mediaItem
		  .find('source')
		    .attr('src', path)
		  .end()
		  .attr('id', id)
		 ;
		mediaItem
			.find('.caption')
			.html(data.name.replace('.mp3', ''))
		;
	}

  $('.medias-list ul').append(mediaItem);

}

function onNewMedia(data){
	var path = data.name;
	var id = data.id;
	var ext = data.name.split('.').pop();
	var mediaItem;

	if(ext == 'mp3'){
		mediaItem = $(".js--templates .son").clone(false);
		mediaItem
		  .find('source')
		    .attr('src', path)
		  .end()
		  .attr('id', id)
		;
		mediaItem
			.find('.caption')
			.html(data.name.replace('.mp3', ''))
		;
	}



	$('.medias-list ul').append(mediaItem);
	  

}


/* sockets */
function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};



function processFileUpload(droppedFiles) {
  // add your files to the regular upload form
  var uploadFormData = new FormData($("#form")[0]); 
  if(droppedFiles.length > 0) { // checks if any files were dropped
    for(var f = 0; f < droppedFiles.length; f++) { // for-loop for each file dropped
      uploadFormData.append("files[]",droppedFiles[f]);  // adding every file to the form so you could upload multiple files
    	console.log(droppedFiles[f]);
    }
  }


	// the final ajax call
 $.ajax({
  url : "/file-upload", // use your target
  type : "POST",
  data : uploadFormData,
  cache : false,
  contentType : false,
  processData : false,
  success : function(ret) {
    // callback function
    console.log(ret);
  }
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