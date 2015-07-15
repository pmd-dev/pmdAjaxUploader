(function ( $ ) {
 
    $.fn.pmdAjaxUploader = function(options) {
    	var settings = $.extend({
            // These are the defaults
    		headers: [],
            fileAddedHandler: function(){},
            progressHandler: function(){},
            completeHandler: function(){},
            errorHandler: function(){},
            formUploadUrl: 'localhost',
            streamingUploadUrl: 'localhost'
        }, options );
    	
    	return this.each(function() {
    		var _this = $(this);
    		
    		var handleDragOver = function(evt) 
    	    {
    	        evt.stopPropagation();
    	        evt.preventDefault();
    	        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
    	        $(this).css({"background-color":"#F5F5F2"});
    	    }
    		
    		var handleDragLeave = function(evt)
    		{
    			$(this).css({"background-color":"#FFFFFF"});
    		}
    		
    		var handleFileDrop = function(evt)
    		{
    			evt.stopPropagation();
    		    evt.preventDefault();
    		 
    		    $(this).css({"background-color":"#FFFFFF"});
    		    
    		    processFiles(evt.dataTransfer.files); // FileList object
    		}
    		
    		var handleFilesChosen = function(evt)
    		{
    			// Reset the file selector
    			$('#file_upload_multi').replaceWith('<input type="file" name="file" id="file_upload_multi" multiple/>');
    			document.getElementById('file_upload_multi').addEventListener('change', handleFilesChosen, false);
    			
    			processFiles(evt.target.files); // FileList object
    		}
    		
    		var ProgressUpdater = function(uploadId, filename)
    		{
    		    this.progressHandler = function(evt)
    		    {
    		    	if (evt.lengthComputable) 
    		        {
    			    	var percentComplete = Math.round(evt.loaded * 100 / evt.total);
    			    	settings.progressHandler(uploadId, filename, percentComplete);
    		        }
    		    }
    		    
    		    this.loadHandler = function(evt)
    		    {
    		    	// This means we got a response from the server
    		        if (evt.target.readyState === 4) 
    		        {
    		        	if (evt.target.status === 200) 
    		            {
    		        		var rsp = JSON.parse(evt.target.response);
    		        		settings.completeHandler(uploadId, rsp.filename, rsp.attachmentId);
    		            }
    		            else 
    		            {
    		            	settings.errorHandler(uploadId, filename);
    		            }
    		        }
    		    }
    		    
    		    this.errorHandler = function(evt)
    		    {
    		    	settings.errorHandler(uploadId, filename);
    		    }
    		    
    		    this.abortHandler = function(evt)
    		    {
    		    	settings.errorHandler(uploadId, filename);
    		    }
    		}
    		
    		var processFiles = function(files) 
    		{
    		    for (var i = 0, f; f = files[i]; i++) 
    		    {
    		    	var uploadId = Math.floor((Math.random() * 1000000) + 1);

    		    	settings.fileAddedHandler(uploadId, f.name, true);
    		    	
    		        var xhr = new XMLHttpRequest();
    		        xhr.open("POST", settings.streamingUploadUrl, true);
    		        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
    		        xhr.setRequestHeader("filename", f.name);
    		        
    		        for(key in settings.headers)
		        	{
    		        	xhr.setRequestHeader(key, settings.headers[key]);
		        	}
    		        
    		        var updater = new ProgressUpdater(uploadId);
    		        xhr.upload.addEventListener("progress", updater.progressHandler, false);
    		        xhr.addEventListener("load", updater.loadHandler, false);
    		        xhr.addEventListener("error", updater.errorHandler, false);
    		        xhr.addEventListener("abort", updater.abortHandler, false);
    		        
    		        xhr.send(f);
    		    }
    		}
    		
    		var handleFileSelected = function()
    		{
    			var uploadId = Math.floor((Math.random() * 1000000) + 1);
    		    var fileInput = $("#file_upload");
    		    
    		    // Chop off the directory path, if it's there (most browsers do C:\fakepath\filename, or just filename)
    		    var filename = fileInput.val();
    		    var index = filename.lastIndexOf("\\");
    		    if(index > 0)
    		   	{
    		        filename = filename.substring(index+1);
    		   	}
    		    
    		    settings.fileAddedHandler(uploadId, filename, false);
    		    
    		    // Create the form here, since having a form within a form on the page isn't valid
    		    var form = $('<form id="file_upload_form" name="file_upload_form"  action="'+settings.formUploadUrl+'" method="post" target="upload_target" enctype="multipart/form-data" encoding="multipart/form-data"></form>');

    		    form.append('<input type="hidden" name="filename" value="'+filename+'"/>');

    		    for(key in settings.headers)
	        	{
    		    	form.append('<input type="hidden" name="'+key+'" value="'+settings.headers[key]+'"/>');
	        	}
    		    
    		    form.append(fileInput);
    		    form.append('<input type="submit" value="Submit" style="display:none;"/>');
    		    
    		    // Create the iFrame
    		    var iFrame = $('<iframe id="upload_target" name="upload_target" scrolling="yes" height="0" width="0" frameborder="0"></iframe>');
    		    $('body').append(iFrame);
    		    
    		    // Add a load handler to the iframe
    		    iFrame.load(function(){
    		    	var rsp = '';
    		    	try
    		    	{
    		    	    rsp = $.parseJSON($(this).contents().text());
    		    	}
    		    	catch(e)
    		    	{
    		    	    // Unable to access the iFrame contents due to same origin policy; happens on some browsers after server 500
    		    	}
    		    	
    		    	if(typeof rsp.attachmentId == 'undefined' || rsp.attachmentId == 0)
    		    	{
    		    		settings.errorHandler(uploadId, filename);
    		    	}	
    		    	
    		    	settings.completeHandler(uploadId, filename, rsp.attachmentId);
    		            	
    		    	// Remove the iFrame
    		    	iFrame.remove();
    		    	
    		        // Add the input element back
    		        _this.html('<input type="file" name="file" id="file_upload"/>');
    		        addEvent(document.getElementById('file_upload'), 'change', handleFileSelected);
    		    });
    		    
    		    $('body').append(form);
    		    form.submit();
    		    form.remove();
    		}
    		
    		// add event cross browser - ie8 doesn't support addEventListener
    		var addEvent = function(elem, event, fn) {
    		    if (elem.addEventListener) {
    		        elem.addEventListener(event, fn, false);
    		    } else {
    		        elem.attachEvent("on" + event, function() {
    		            // set the this pointer same as addEventListener when fn is called
    		            return(fn.call(elem, window.event));   
    		        });
    		    }
    		}
    		
    		// Check for file api support
    		if (window.File && window.FileReader && window.FileList && window.Blob) 
	  		{
	  			// Use plain old js to attach event listeners here
	  		    var dropZone = document.getElementById($(this).attr("id"));
	  		    dropZone.addEventListener('dragover', handleDragOver, false);
	  		    dropZone.addEventListener('dragleave', handleDragLeave, false);
	  		    dropZone.addEventListener('drop', handleFileDrop, false);
	  		    
	  		    // Add a standard file browse option as well
	  		    $(this).append('<input type="file" name="file" id="file_upload_multi" multiple/>');
	  		    document.getElementById('file_upload_multi').addEventListener('change', handleFilesChosen, false);
	  		} 
	  		else 
	  		{
	  			// Replace the dropzone with a standard file input
	  			$(this).attr('style', '');
	  			$(this).html('<input type="file" name="file" id="file_upload"/>');
	  			
	  			// Can only do these one at a time, and don't get progress, so don't need a wrapper class
	  			addEvent(document.getElementById('file_upload'), 'change', handleFileSelected);
	  		}
    	});
    };
 
}( $ ));