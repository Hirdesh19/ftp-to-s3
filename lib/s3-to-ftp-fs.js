const S3FS = require('s3fs')
const debug = require('debug')

const S_IFDIR = 16384
const S_IFREG = 32768

const createStatProxy = (fs) => {
  const proxyFn = (p, callback, firstTry = true) => {
    fs.stat(p, (err, stat) => {
      if (err) {
        // If file is not found, try looking for directory
        if (err.message === 'NotFound' && firstTry) {
          // If file name has no path suffix
          if (p[p.length - 1] !== '/') {
            return proxyFn(`${p}/`, callback, false)
          }
        }

        return callback(err)
      }

      // Set stat mode to file or directory
      stat.mode = stat.isDirectory() ? S_IFDIR : S_IFREG

      callback(null, stat)
    })
  }

  return proxyFn
}

class S3ToFtpFS {
  constructor (username, bucket, options = {}) {
    this.fs = new S3FS(bucket, options)
    this.statProxy = createStatProxy(this.fs)

    this.debug = debug('s3-to-ftp-fs')
    this.username = username

    this.debug('ctor')
  }

  open (p, mode, callback) {
    this.debug(this.username, 'open')

    callback(null, p)
  }

  rename (from, to, callback) {
    this.debug(this.username, 'rename', from, to)

    // TODO: Support renaming files / directories
    this.fs.stat(from, (err, stat) => {
      if (err) {
        return callback(err)
      }

      if (stat.isDirectory()) {
        callback(new Error('Cannot move directories'))
      } else {
        callback(new Error('Cannot move files'))
      }
    })
  }

  createReadStream (path, options) {
    if (!path && options.fd) {
      path = options.fd
    }

    this.debug(this.username, 'createReadStream', path)

    return this.fs.createReadStream(path)
  }

  createWriteStream (path, options) {
    this.debug(this.username, 'createWriteStream', path)

    return this.fs.createWriteStream(path)
  }

  exists (path, callback) {
    this.debug(this.username, 'exists', path)

    this.fs.exists(path, callback)
  }

  stat (path, callback) {
    this.debug(this.username, 'stat', path)

    this.statProxy(path, callback)
  }

  lstat (path, callback) {
    this.debug(this.username, 'lstat', path)

    this.statProxy(path, callback)
  }

  mkdir (path, ...callbacks) {
    this.debug(this.username, 'mkdir', path)

    // Fix mkdir callback
    this.fs.mkdir(path, callbacks.slice(-1)[0])
  }

  readdir (path, callback) {
    this.debug(this.username, 'readdir', path)

    this.fs.readdir(path, callback)
  }

  readFile (filename, options, callback) {
    this.debug(this.username, 'readFile', filename)

    this.fs.readFile(filename, options, callback)
  }

  rmdir (path, callback) {
    this.debug(this.username, 'rmdir', path)

    this.fs.rmdir(path, callback)
  }

  unlink (path, callback) {
    this.debug(this.username, 'unlink', path)

    this.fs.unlink(path, callback)
  }

  writeFile (filename, data, options, callback) {
    this.debug(this.username, 'writeFile', filename)

    // Remove writeFile options
    this.fs.writeFile(filename, data, {}, callback)
  }
}

module.exports = S3ToFtpFS
