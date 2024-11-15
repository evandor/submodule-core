import Command from "src/core/domain/Command";
import {NotificationType, useNotificationHandler} from "src/core/services/ErrorHandler";
import {ExecutionFailureResult, ExecutionResult} from "src/core/domain/ExecutionResult";
import {useUiStore} from "src/ui/stores/uiStore";

const {handleSuccess, handleError} = useNotificationHandler()

export function useCommandExecutor() {

  const executeFromUi = async (command: Command<any>, type: NotificationType = NotificationType.TOAST): Promise<ExecutionResult<any>> => {
    console.log(" * executing command", command.toString())
    useUiStore().commandExecuting = true
    return command.execute()
      .then((res: ExecutionResult<any>) => {
        useUiStore().commandExecuting = false
        return res
      })
      .then((res) => handleSuccess(res, type))
      .catch(err => {
        console.log("error in command", command)
        useUiStore().commandExecuting = false
        handleError(err, type)
        return new ExecutionFailureResult(null, err)
      })
  }

  const execute = async (command: Command<any>): Promise<ExecutionResult<any>> => {
    console.log(" * executing command", command.toString())
    return command.execute()
      .catch(err => {
        console.log("error in command", command.toString())
        handleError(err)
        return new ExecutionFailureResult(null, err)
      })
  }

  return {
    executeFromUi,
    execute
  }
}
