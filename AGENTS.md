* Project
** Intelligent Content Processor

* Business Requirements
** Ability to upload a document
** Extract the content of the document with layout information in a markdown format
** Ability to classify the document into one of the following:
*** Resume
*** Professional summary
*** Other

* Technical Requirements
** Use the OpenRouter API key in the .env file for LLM calls. Use the model google/gemma-4-31b-it:free from OpenRouter
** Only allow PDF documents to be uploaded
** Limit upload file size to 10 MB
** Test the functionality before considering the project as complete
** Use React for User Interfaces and Python for the backend programming
** No persistence 
** Keep code consize