const backend = require('./src')
const { serverPort } = require('./config')

backend.listen(serverPort,
  () => console.log(`Marketplace backend running on port ${serverPort}!`)
)
