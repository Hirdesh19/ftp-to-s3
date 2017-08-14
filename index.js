const ftpd = require('ftpd')
const S3FS = require('./lib/s3-to-ftp-fs')
const Profile = require('./lib/profile')

const bucket = process.env.BUCKET_NAME

if (!bucket) {
  throw new Error('BUCKET_NAME env var must be set')
}

const authorize = (username, password) => {
  return (username === 'mgoodings' && password === 'qwerty123')
}

const options = {
  host: process.env.IP || '127.0.0.1',
  port: process.env.PORT || 2221
}

const server = new ftpd.FtpServer(options.host, {
  useReadFile: false,
  useWriteFile: false,
  getInitialCwd: () => '/',
  getRoot: ({ username }, callback) => {
    const profile = Profile.get(username)

    if (profile && profile.path) {
      callback(null, profile.path)
    } else {
      callback('Profile not found')
    }
  }
})

server.on('client:connected', (connection) => {
  let username = null

  connection.on('command:user', (user, success, failure) => {
    if (user) {
      username = user

      success()
    } else {
      failure('Username was not found')
    }
  })

  connection.on('command:pass', (password, success, failure) => {
    if (authorize(username, password)) {
      Profile.set(username, {
        bucket,
        path: '/'
      })

      success(username, new S3FS(username, bucket))
    } else {
      failure('Login credentials are invalid')
    }
  })
})

server.debugging = 1
server.listen(options.port)

console.log(`Listening on port ${options.port}`)
