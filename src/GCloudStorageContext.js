const Storage = require('@google-cloud/storage');
const Promise = require('bluebird');
const ArgumentError = require('auth0-extension-tools').ArgumentError;

/**
 * Create a new GCloudStorageContext.
 * @param {Object} options The options object.
 * @param {Object} options.defaultData The default data to use when the file does not exist or is empty.
 * @constructor
 */
function GCloudStorageContext(options) {
  if (options === null || options === undefined) {
    throw new ArgumentError('The \'options\' object is required when configuring the GCloudStorageContext.');
  }
  if (!options.path || options.path.length === 0) {
    throw new ArgumentError('The \'path\' property is required when configuring the GCloudStorageContext.');
  }
  if (!options.bucket || options.bucket.length === 0) {
    throw new ArgumentError('The \'bucket\' property is required when configuring the GCloudStorageContext.');
  }
  if (!options.projectId || options.projectId.length === 0) {
    throw new ArgumentError('The \'projectId\' property is required when configuring the GCloudStorageContext.');
  }
  if (!options.credentials) {
    throw new ArgumentError('The \'credentials\' property is required when configuring the GCloudStorageContext.');
  }

  this.storage = new Storage({
  	projectId: options.projectId,
  	credentials: options.credentials
  });
  this.options = options;
  this.defaultData = options.defaultData || {};
}

/**
 * Read payload from Storage.
 * @return {object} The object parsed from Storage.
 */
GCloudStorageContext.prototype.read = function() {
  const ctx = this;
  return new Promise(function(resolve, reject) {
  	const bucket = ctx.storage.bucket(ctx.options.bucket);
  	const file = bucket.file(ctx.options.path);

  	file.download(function getObject(err, file, apiResponse) {
	  try {
        if (err) {
          if (err.code === 'NoSuchKey') {
            return resolve(ctx.defaultData);
          }

          return reject(err);
        }

        const data = JSON.parse((file && file.toString())) || ctx.defaultData;
        return resolve(data);
      } catch (e) {
        return reject(e);
      }
  	});
  });
};

/**
 * Write data to Storage.
 * @param {object} data The object to write.
 */
GCloudStorageContext.prototype.write = function(data) {
  const ctx = this;
  return new Promise(function(resolve, reject) {
  	const bucket = ctx.storage.bucket(ctx.options.bucket);
  	const file = bucket.file(ctx.options.path);

    try {
      file.save(JSON.stringify(data, null, 2), { uploadType: "media" }, function putObject(err) {
        if (err) {
          return reject(err);
        }

        return resolve();
      });
    } catch (e) {
      reject(e);
    }
  });
};

/**
 * Module exports.
 * @type {function}
 */
module.exports = GCloudStorageContext;