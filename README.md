# pmdAjaxUploader
Cross-browser (IE7+, Chrome, Safari, Firefox) ajax file upload utility

### Summary
pmdAjaxUploader utilitizes HTML5 File APIs, when supported, and falls back to posting to a hidden iFrame when File APIs aren't available, to provide cross-browser AJAX, and AJAX-like file upload support.  It offers both drag and drop, as well as standard file browse options, and also supplies progress, error, and completion callbacks.

### Usage
```
jQuery("#drop_zone").pmdAjaxUploader({
  streamingUploadUrl: 'yourApi/streamingFileUploadEndpoint',
  formUploadUrl: 'yourApi/formBasedFileUploadEndpoint',
  headers: {header1: value1, header2: value2},  // headers (form parameters in case of form upload) to send to server
  fileAddedHandler: function(uploadId, filename, isProgressAvailable) { // called when upload started },
  progressHandler: function(uploadId, filename, percentComplete) {  } ,
  completeHandler: function(uploadId, filename, attachmentId) { // called when upload complete with id supplied by server },
  errorHandler: function(uploadId, filename) { }
});
```

### Example backend implementation
Server-side support can be implemented in any language; this is an example using Java's Jersey framework

```
@POST
@Path("/streamingFileUploadEndpoint")
@Produces(MediaType.APPLICATION_JSON)
public Response visitUploadStreaming(InputStream inputStream, @Context HttpServletRequest request)
{
  String filename = request.getHeader("filename");
  String header1 = request.getHeader("header1");
  String header2 = request.getHeader("header2");
  
  if(inputStream == null || StringUtils.isBlank(filename) || StringUtils.isBlank(header1) || StringUtils.isBlank(header2))
  {
    return Response.status(Response.Status.BAD_REQUEST).build();
  }
  
  // Process the input stream, either saving to a file, or other data persistence, and generate a unique attachment id
  
  // Then, return JSON response
  return Response.ok().entity(new AttachmentSuccessResponse(attachmentId, filename)).build();
}

public static class AttachmentSuccessResponse 
{
    public AttachmentSuccessResponse(long attachmentId, String filename)
    {
        this.attachmentId = attachmentId;
        this.filename = filename;
    }
    
    public long attachmentId;
    public String filename;
}

@POST
@Path("/formBasedFileUploadEndpoint")
@Produces(MediaType.TEXT_PLAIN)
public Response vsiitUploadForm(@Context HttpServletRequest request)
{

  ServletFileUpload upload = new ServletFileUpload();
  FileItemIterator iter = upload.getItemIterator(request);
  if(!iter.hasNext())
  {
      return Response.status(Response.Status.BAD_REQUEST).build();
  }
          
  InputStream attachmentInputStream = null;
  String filename = null;
  String header1 = null;
  String header2 = null;
  
  while (iter.hasNext()) 
  {
      FileItemStream item = iter.next();
      String fieldName = item.getFieldName();
      InputStream stream = item.openStream();
      
      if(item.isFormField() && "header1".equals(fieldName))
      {
          header1 = Streams.asString(stream);
      }
      else if(item.isFormField() && "header2".equals(fieldName))
      {
          header2 = Streams.asString(stream);
      }
      else if(item.isFormField() && "filename".equals(fieldName))
      {
          filename = Streams.asString(stream);
      }
      else if(!item.isFormField() && "file".equals(fieldName))
      {
          attachmentInputStream = stream;
          break;  // HAS to be last
      }
  }
  
  if(inputStream == null || StringUtils.isBlank(filename) || StringUtils.isBlank(header1) || StringUtils.isBlank(header2))
  {
    return Response.status(Response.Status.BAD_REQUEST).build();
  }
  
  // Process the input stream, either saving to a file, or other data persistence, and generate a unique attachment id
  
  // Then, return JSON response - iFrame requires plan text content-type, so manually generate the JSON here
  return Response.ok().entity(new Gson().toJson(new AttachmentSuccessResponse(attachmentId, filename))).build();
}
```
