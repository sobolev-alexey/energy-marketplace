const backend = require('./src')
const { serverPort } = require('./config')

backend.listen(serverPort,
  () => console.log(`Bid manager backend running on port ${serverPort}!`)
)
