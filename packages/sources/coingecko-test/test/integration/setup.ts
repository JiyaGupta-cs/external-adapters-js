import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import * as process from 'process'
import * as nock from 'nock'
import { FastifyInstance } from 'fastify'

export type SuiteContext = {
  req: SuperTest<Test> | null
  server: () => Promise<FastifyInstance>
  fastify?: FastifyInstance
}

export type EnvVariables = { [key: string]: string }

export type TestOptions = { cleanNock?: boolean; fastify?: boolean }

export const setupExternalAdapterTest = (
  envVariables: NodeJS.ProcessEnv,
  context: SuiteContext,
  options: TestOptions = { cleanNock: true, fastify: false },
): void => {
  let fastify: FastifyInstance

  beforeAll(async () => {
    process.env['METRICS_ENABLED'] = 'false'
    for (const key in envVariables) {
      process.env[key] = envVariables[key]
    }

    if (process.env['RECORD']) {
      nock.recorder.rec()
    }
    fastify = await context.server()

    // eslint-disable-next-line require-atomic-updates
    context.req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)

    // Only for edge cases when someone needs to use the fastify instance outside this function
    if (options.fastify) {
      // eslint-disable-next-line require-atomic-updates
      context.fastify = fastify
    }
  })

  afterAll(async () => {
    if (process.env['RECORD']) {
      nock.recorder.play()
    }

    const asd = 123
    if (asd > 0) {
      // Options.cleanNock) {
      nock.restore()
      nock.cleanAll()
      nock.enableNetConnect()
    }

    await fastify.close()
  })
}
