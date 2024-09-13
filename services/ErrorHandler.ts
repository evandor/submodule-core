import {Notify} from 'quasar'
import {ExecutionResult} from "src/core/domain/ExecutionResult";
import {useUiStore} from "src/ui/stores/uiStore";
import {BrowserClient, defaultStackParser, getDefaultIntegrations, makeFetchTransport, Scope} from "@sentry/browser";

export enum NotificationType {
  NOTIFY = "NOTIFY",
  TOAST = "TOAST"
}

export function useNotificationHandler() {

  const handleError = (err: any, type: NotificationType = NotificationType.TOAST) => {
    const errorMsg = err ? err.toString() : 'unknown error'

    const integrations = getDefaultIntegrations({}).filter(
      (defaultIntegration) => {
        return !["BrowserApiErrors", "Breadcrumbs", "GlobalHandlers"].includes(
          defaultIntegration.name,
        );
      },
    );

    const client = new BrowserClient({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.TABSETS_STAGE,
      transport: makeFetchTransport,
      stackParser: defaultStackParser,
      integrations: integrations,
    });

    const scope = new Scope();
    scope.setClient(client);
    client.init();

    scope.captureException(new Error(errorMsg));

    console.warn("showing error message: ", errorMsg)
    console.trace()

    //console.warn(errorMsg /** todo pass actual error */)

    switch (type) {
      case NotificationType.NOTIFY:
        Notify.create({
          position: 'bottom',
          color: 'red-5',
          textColor: 'white',
          icon: 'error',
          message: errorMsg
        })
        break;
      default:
        useUiStore().createErrorToast(errorMsg)
    }

  }

  const handleWarning = (res: ExecutionResult<any>) => {
    useUiStore().createWarningToast(res.message)
  }

  const handleSuccess = (executionResult: ExecutionResult<any>, type: NotificationType = NotificationType.TOAST): ExecutionResult<any> => {
    const actions: any[] = []

    for (const key of executionResult.nextCommands.keys()) {
      actions.push(
        {
          label: key,
          color: 'white',
          handler: () => {
            executionResult.nextCommands.get(key)!.execute()
              .then((res: any) => handleWarning(res))
              .catch((err: any) => handleError(err))
          }
        }
      )
    }

    switch (type) {
      case NotificationType.NOTIFY:
        Notify.create({
          color: 'positive',
          message: executionResult.message,
          actions: actions
        })
        break;
      default:
        useUiStore().createSuccessToast(executionResult.message, actions)
    }
    return executionResult
  }

  return {
    handleError, handleSuccess
  }
}
