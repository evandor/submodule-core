import Command from "src/core/domain/Command";

export class ExecutionResult<T> {
  constructor(
    public result: T,
    public message: string,
    public nextCommands: Map<string, Command<any>> = new Map()) {

  }


}
