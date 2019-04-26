import { resolve } from 'path'

import winston from 'winston'
import { getConfigVar } from '@spalger/micro-plus'

import { makeReqCache } from './req_cache'
import { getRequestId } from './req_id'

const KILOB = 1000
const MEGAB = 1000 * KILOB

// filter out request objects from logs
const filterRequestType = winston.format((info: any) =>
  info.type === 'request' ? false : info,
)

export type Log = winston.Logger
export const log = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'prbot' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({
      stack: true,
    }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: resolve(getConfigVar('LOGS_DIR'), 'prbot.log'),
      maxsize: 5 * MEGAB,
      maxFiles: 5,
    }),

    new winston.transports.Console({
      format: winston.format.combine(
        filterRequestType(),
        winston.format.simple(),
      ),
    }),
  ],
})

const rootLoggerCache = makeReqCache<Log>('root logger')
export const getRootLogger = rootLoggerCache.get
export const assignRootLogger = rootLoggerCache.assignValue

const reqLoggerCache = makeReqCache('logger', ctx =>
  rootLoggerCache.get(ctx).child({
    requestId: getRequestId(ctx),
  }),
)
export const getRequestLogger = reqLoggerCache.get