# AWS Lambda Example: 
# Copy Objects Between S3 Buckets using NodeJS
Simple example function showing how to copy files between S3 buckets using AWS Lambda.

## Background  
A friend needed a way to copy all S3 objects created by the Simple Email Service (SES) and copy them to a date-organized structure within a different S3 bucket.

## Variables  
Three environment variables exist:

**`QUANTITY`**  
Optional numeric to force the `getObjects` operation to limit the number of returned objects.  If not set, default from S3 is 1,000 objects.  NOT setting this may cause timeouts.

**`SOURCE_BUCKET`**  
Name of the bucket to copy objects from.

**`TARGET_BUCKET`**  
Name of the bucket to copy objects to.

## Process  
The steps are as follows:

#. Get a list of all objects
#. Loop through objects
#. Check if target object exists
#. Copy object to target if new

## Note  
If you use this, I recommend adding a `deleteObject` from the `SOURCE_BUCKET` location to speed up additional processing later on.

## Contact Info  
As always, if you find this and need a hand, feel free to reach out:

**Fred Lackey**  
**fred.lackey@gmail.com**  
**http://fredlackey.com**

