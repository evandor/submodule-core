import { getLokiLogger } from '@miketako3/cloki'
import { EXTENSION_NAME } from 'src/boot/constants'
import { useErrorHandlingConfig } from 'src/core/config/errorHandlingConfig'

const version = import.meta.env.PACKAGE_VERSION

// let graylogErrorLogged = false

const { setupErrorHandling } = useErrorHandlingConfig()
var scope = setupErrorHandling()

const postLogsToLoki = async (message: string, labels: object) => {
  const lokiURL = 'https://logs-prod-012.grafana.net/loki/api/v1/push' // Replace with your Loki URL
  const headers = {
    'Content-Type': 'application/json',
    // Add any other custom headers you need
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    Authorization: `Basic ${btoa(`${process.env.GRAFANA_LOKI_USER as string}:${process.env.GRAFANA_LOKI_TOKEN as string}`)}`,
  }

  const logData = {
    streams: [
      {
        stream: Object.assign({ level: 'info' }, labels),
        values: [[`${Date.now().toString()}000000`, JSON.stringify(message)]],
      },
    ],
    // streams: [
    //   {
    //     stream: {
    //       lablename: 'test lable', // Replace with your labels
    //     },
    //     values: [
    //       [new Date().toISOString(), 'post message from culture'],
    //       // Add more log entries as needed
    //     ],
    //   },
    // ],
  }

  try {
    // const response = await axios.post(lokiURL, logData,{ headers }).catch((e)=>{
    //   console.log(e);
    // });
    fetch(lokiURL, { method: 'POST', headers, body: JSON.stringify(logData) }).then((response) => {
      response.json().then((data) => {
        console.log('data', data)
      })
    })
  } catch (error) {
    console.error('Error posting logs to Loki:', error)
  }
}

async function log(msg: string, level: number) {
  // console.log('sending message to sentry...', scope)
  // scope.captureMessage(msg)

  const logger = getLokiLogger({
    lokiHost: 'logs-prod-012.grafana.net',
    lokiUser: process.env.GRAFANA_LOKI_USER as string,
    lokiToken: process.env.GRAFANA_LOKI_TOKEN as string,
  })

  if (level === 3) {
    await logger.error(
      { message: msg },
      { _mode: process.env.MODE || 'unknown', _version: version, service_name: EXTENSION_NAME },
    )
  } else {
    // await logger.info(
    //   { message: msg },
    //   { _mode: process.env.MODE || 'unknown', _version: version, service_name: EXTENSION_NAME },
    // )
    postLogsToLoki(msg, {
      _mode: process.env.MODE || 'unknown',
      _version: version,
      _logger: 'postlogstoloki',
      service_name: EXTENSION_NAME,
    })
  }

  // const gelfMessage = {
  //   version: '1.1',
  //   host: process.env.HOST,
  //   short_message: msg,
  //   level: level,
  //   _app: EXTENSION_NAME,
  //   _mode: process.env.MODE,
  //   _version: version,
  //   _logflowId: useAppStore().logflowId,
  //   _stage: process.env.TABSETS_STAGE,
  // }
  // api
  //   .post('http://graylog.tabsets.net:12201/gelf', gelfMessage, {
  //     headers: { 'Content-Type': 'application/json' },
  //   })
  //   .catch((err: any) => {
  //     if (!graylogErrorLogged) {
  //       graylogErrorLogged = true
  //       console.warn('could not log to graylog')
  //     }
  //   })
}

export function useLogger() {
  const info = (msg: string) => {
    if (process.env.MODE === 'bex') {
      log(msg, 5) // do not log for pwa, there's faro-collector for that
    }
  }

  const error = (msg: string) => {
    console.log('sending message to sentry...', scope)
    scope.captureMessage(msg)
    log(msg, 3)
  }

  return {
    info,
    error,
  }
}
