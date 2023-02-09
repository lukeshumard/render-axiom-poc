import http from 'node:http'
import express from 'express'
import helmet from 'helmet'
import { createTerminus, HealthCheck } from '@godaddy/terminus'
import pinoHttp from 'pino-http'

const app = express()
const pino = pinoHttp({})
app.use(helmet())
app.use(pino)
app.disable('x-powered-by')

app.get('/', (_req, res) => {
  res.send('OK')
})

app.get('/error', (_req, res) => {
  throw Error('Test Error')
})

app.use((err: any, req: any, res: any, _next: any) => {
  req.log.error(err)
  try {
    const status = err?.status || 500
    res.status(status).json({ error: err.message })
  } catch (err) {
    req.log.error(err)
    res.status(500).end()
  }
})

const server = http.createServer(app)

const onHealth:HealthCheck = async () => {
  pino.logger.info('Health check')
}

createTerminus(server, {
  healthChecks: {
    '/health': onHealth
  },
  async onSignal() {
    pino.logger.info('onSignal')
  },
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  pino.logger.info(`API listening on port ${PORT}`)
})
