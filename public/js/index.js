/* VARIABLES */
var socket = io.connect();
var zIndex = 0;

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);

socket.on('listMedias', onListMedias);
socket.on('emptyFolder', onEmptyFolder);

// l'event newMedia se trouve dans router.js
socket.on('newMedia', onListMedias); 
socket.on('onDeleteEl', function(id){
	console.log(id);
	$('#' + id).remove();
	if($('.medias-list ul li').length < 1){
		$('.infos-empty').show();
	}
	
}); 

jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});


function init(){



	$(window).on('dragover',function(e){
		$(".drop-files-container").css('pointer-events', "auto");
		$("body").addClass('active');
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
    $('.infos-empty').hide();
    $("body").removeClass('active');
 		// var id = convertToSlug(files[0].name);
		// socket.emit("dropFile", {id:id});
  	// forward the file object to your ajax upload method
    return false;
	});

	// make the elements sortable and get their position 
	$(".medias-list ul").sortable({
    stop: function(event, ui) {
      var newPositionsArr = {};
      $(".medias-list ul li").each(function(){
      	newPositionsArr[$(this).index()] = $(this).find('source').attr('src');
      	var newName = newPositionsArr[$(this).index()].replace(/^[^-]+-/,(parseInt($(this).index()) + 1)+'-');
      	$(this).find('source').attr('src', newName);
      });

      // send new position to the server
      socket.emit('newPosition', newPositionsArr);
    }
});

	$('body').on('click', '.close-audio',function(){
		var thisPath = $(this).parents('li').find('source').attr('src');
		var thisId = $(this).parents('li').attr('id');
		socket.emit('deleteEl', {pathEl:thisPath, id: thisId});
	});

	$('body').on('click', '.loop',function(){
		if($(this).hasClass('active')){
			$(this).removeClass('active');
			$(this).parents('li').find('audio').attr('loop', false);
		}
		else{
			$(this).addClass('active');
			$(this).parents('li').find('audio').attr('loop', true);
		}
		
	});

	$('body').on('input', '#speed-slider',function(){
		var speedVal = $(this).val();
		console.log($(this).next('span').next('.speedValue'));
		$(this).next('span').next('.speedValue').html(speedVal);
		 this.parentNode.parentNode.parentNode.getElementsByTagName("audio")[0].playbackRate = speedVal;
	});
	$('body').on('input', '#volume-slider',function(){
		var volumeVal = $(this).val();
		$(this).next('span').next('.volumeValue').html(volumeVal);
		 this.parentNode.parentNode.parentNode.getElementsByTagName("audio")[0].volume = volumeVal;
	});
}

function onEmptyFolder(){
	$('.drop-files-container').append('<div class="infos-empty">Glissez des fichiers audio ici</div>');
}



function onListMedias(data){
	var path = data.name;
	var id = convertToSlug(path);
	var ext = data.name.split('.').pop();
	var mediaItem;

	if(ext == 'mp3' || ext == 'wav'){
		mediaItem = $(".js--templates .son").clone(false);
		mediaItem
		  .find('source')
		    .attr('src', path)
		  .end()
		  .attr('id', id)
		 ;
		mediaItem
			.find('.caption')
			.html(data.name.replace('.mp3', '').replace('.wav', '').replace(/^[^-]+-/,''))
		;
	}

	$('.medias-list ul').append(mediaItem);

	

}

// function onNewMedia(data){
// 	var path = data.name;
// 	var id = data.id;
// 	var ext = data.name.split('.').pop();
// 	var mediaItem;

// 	if(ext == 'mp3'){
// 		mediaItem = $(".js--templates .son").clone(false);
// 		mediaItem
// 		  .find('source')
// 		    .attr('src', path)
// 		  .end()
// 		  .attr('id', id)
// 		;
// 		mediaItem
// 			.find('.caption')
// 			.html(data.name.replace('.mp3', '').replace(/^[^-]+-/,''))
// 		;
// 	}



// 	$('.medias-list ul').append(mediaItem);
	  

// }


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