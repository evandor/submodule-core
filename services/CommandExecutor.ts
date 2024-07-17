import Command from "src/core/domain/Command";
import {NotificationType, useNotificationHandler} from "src/core/services/ErrorHandler";
import {ExecutionFailureResult, ExecutionResult} from "src/core/domain/ExecutionResult";

const {handleSuccess, handleError} = useNotificationHandler()

export function useCommandExecutor() {

    const executeFromUi = (command: Command<any>, type: NotificationType = NotificationType.TOAST): Promise<ExecutionResult<any>> => {
        console.log(" * executing command", command)
        return command.execute()
            .then((res) => handleSuccess(res, type))
            .catch(err => {
                console.log("error in command", command)
                handleError(err, type)
                return new ExecutionFailureResult(null, err)
            })
    }

    const execute = (command: Command<any>): Promise<ExecutionResult<any>> => {
        console.log(" * executing command", command)
        return command.execute()
            .catch(err => {
                console.log("error in command", command)
                handleError(err)
                return new ExecutionFailureResult(null, err)
            })
    }

    return {
        executeFromUi,
        execute
    }
}
