const AWS = require('aws-sdk');
const s3 = new AWS.S3({apiVersion: '2006-03-01'});
const { isNumber, toBlockDate, isObject, isError } = require('./utils');

const SEP = '\/';
const MAX_KEYS = 5

const getObjects = async (sourceBucket, maxKeys) => {

    console.info('-- getObjects --');

    const params = { 
        Bucket: sourceBucket 
    };

    if (isNumber(maxKeys) && Number(maxKeys) > 0) {
        params.MaxKeys = `${maxKeys}`
    }

    try {
        const items = await s3.listObjects(params).promise();
        if (isError(items)) {
            console.info('-- getObjects error --');
        }
        return items;
    } catch (ex) {
        console.info('-- getObjects failure --');
        console.info(JSON.stringify(ex, null, 2));
        return ex;
    }
}
const getObject = async (bucketName, key) => {

    console.info('-- getObject --')
    console.info(`BUCKET: ${bucketName}`)
    console.info(`KEY: ${key}`)

    const params = {
      Bucket: bucketName,
      Key: key
    }
    
    try {
        const item = await s3.getObject(params).promise();
        if (isError(item)) {
            console.info('-- getObject error --');
        }
        return item;
    } catch (ex) {
        if (ex && isNumber(ex.statusCode) && Number(ex.statusCode) === 404) {
            return null;
        }
        console.info('-- getObject failure --');
        console.info(JSON.stringify(ex, null, 2));
        return ex;
    }
}
const objectExists = async (bucketName, key) => {
    
    console.info('-- objectExists --')
    
    const item = await getObject(bucketName, key);
    if (isError(item)) {
        console.info('-- objectExists : ERROR --')
        return item;
    }
    if (item && item.ETag) {
        console.info('-- objectExists : TRUE --')
        console.log(`Etag: ${item.ETag}`);
        return true;
    }
    console.info('-- objectExists : FALSE --');
    return false;
}
const deleteObject = async (bucketName, item) => {
    console.info('-- deleteObject --');
    const params = {
      Bucket: bucketName,
      Key: item.Key
    };
    try {
        const item = await s3.deleteObject(params).promise();
        if (isError(item)) {
            console.info('-- deleteObject error --');
            console.info(JSON.stringify(item, null, 2));
            return false
        }
        return true;
    } catch (ex) {
        console.info('-- deleteObject failure --');
        console.info(JSON.stringify(ex, null, 2));
        return ex;
    }
    
}

const copyItem = async (item, sourceBucket, targetBucket) => {

    console.info('-- copyItem --');

    const date = new Date(Date.parse(item.LastModified));
    const domain = item.Key.split(SEP)[0];
    const id = item.Key.split(SEP)[1];
    const datePath = toBlockDate(date, SEP, false);

    const targetKey = [].concat(domain, datePath, id).join(SEP);
    const exists = await objectExists(targetBucket, targetKey);
    if (exists === true) {
        console.info('Object exists in target bucket.');
        console.info(`BUCKET: ${targetBucket}`);
        console.info(`KEY: ${targetKey}`);
        return false;
    }

    const params = {
      Bucket: targetBucket,
      CopySource: `${sourceBucket}/${item.Key}`,
      Key: targetKey,
      Metadata: {
          domain,
          id: id
      }
    }
    try {
        const result = await s3.copyObject(params).promise();
        if (result && result.CopyObjectResult && result.CopyObjectResult.ETag) {
            return true;
        }
        console.info('-- copyItem error --');
        return false;
    } catch (ex) {
        console.info('-- copyItem failure --');
        console.info(JSON.stringify(ex, null, 2));
        return ex;
    }    
}

exports.handler = async (event, context, cb) => {

    let fetchResult = await getObjects(process.env.SOURCE_BUCKET, process.env.QUANTITY);
    if (!fetchResult) {
        return cb(new Error('No fetch result.'));
    }
    if (fetchResult instanceof Error) {
        return cb(fetchResult);
    }
    if (!isObject(fetchResult)) {
        return cb(new Error('Fetch returned unexpected results.'));
    }
    if (!Array.isArray(fetchResult.Contents)) {
        return cb(new Error('No Contents returned.'));
    }
    
    const items = fetchResult.Contents.filter(x => (x && 
        x.LastModified &&
        x.Key && x.Key.includes(SEP) && 
        x.Key.split(SEP).length === 2 && 
        x.LastModified != null &&
        x.Key.split('/')[1] !== x.Key.split('/')[1].toUpperCase()));
        
    console.info(`Qualified Items: ${items.length}`)

    for (let i = 0; i < items.length; i += 1) {
        
        console.info(`item ${(i + 1)} of ${items.length}`);
        
        const copyResult = await copyItem(items[i], process.env.SOURCE_BUCKET, process.env.TARGET_BUCKET);
        if (copyResult === false) { 
            console.log(`COPY FAILURE ON #${i + 1}`);
            continue;
        }
        if (copyResult !== true) {
            return cb(new Error('Copy Failure!'));
        }
        
        const deleteResult = await deleteObject(process.env.SOURCE_BUCKET, items[i]);
        if (deleteResult === false) { 
            console.log(`DELETE FAILURE ON #${i + 1}`);
            continue;
        }
        if (deleteResult !== true) {
            return cb(new Error('Delete Failure!'));
        }
    }
};
