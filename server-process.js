var fs = require('fs')
var Path = require('path')
var electron = require('electron')
var spawn = require('child_process').spawn
var fixPath = require('fix-path')
// var DHT = require('multiserver-dht')

// removing DHT invites until they work in sbot@13
//
// function dhtTransport (sbot) {
//   sbot.multiserver.transport({
//     name: 'dht',
//     create: dhtConfig => {
//       return DHT({
//         keys: sbot.dhtInvite.channels(),
//         port: dhtConfig.por t
//       })
//     }
//   })
// }

var createSbot = require('scuttlebot')
  .use(require('scuttlebot/plugins/master'))
  .use(require('scuttlebot/plugins/gossip'))
  .use(require('scuttlebot/plugins/replicate'))
  .use(require('scuttlebot/plugins/no-auth'))
  .use(require('scuttlebot/plugins/unix-socket'))
  .use(require('ssb-friends'))
  .use(require('ssb-blobs'))
  .use(require('ssb-backlinks'))
  .use(require('ssb-about'))
  .use(require('ssb-private'))
  // .use(require('ssb-dht-invite')) // this one must come before dhtTransport
  // .use(dhtTransport)
  .use(require('scuttlebot/plugins/invite'))
  .use(require('scuttlebot/plugins/local'))
  .use(require('scuttlebot/plugins/logging'))
  .use(require('ssb-query'))
  .use(require('ssb-search'))
  .use(require('ssb-ws'))
  .use(require('ssb-tags'))
  .use(require('ssb-ebt')) // enable at your own risk!
  .use(require('./sbot'))

fixPath()

module.exports = function (ssbConfig) {
  var context = {
    sbot: createSbot(ssbConfig),
    config: ssbConfig
  }
  ssbConfig.manifest = context.sbot.getManifest()
  fs.writeFileSync(Path.join(ssbConfig.path, 'manifest.json'), JSON.stringify(ssbConfig.manifest))
  electron.ipcRenderer.send('server-started', ssbConfig)

  // start dht invite support
  // context.sbot.dhtInvite.start()

  // check if we are using a custom ssb path (which would break git-ssb-web)
  if (!ssbConfig.customPath) {
    // attempt to run git-ssb if it is installed and in path
    var gitSsb = spawn('git-ssb', [ 'web' ], {
      stdio: 'inherit'
    })
    gitSsb.on('error', () => {
      console.log('git-ssb is not installed, or not available in path')
    })
    process.on('exit', () => {
      gitSsb.kill()
    })
  }
}
