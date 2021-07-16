import {Definition} from 'typescript-json-schema';

declare global {
    declare var acquireVsCodeApi: Function;
    declare var vscode;
    declare var requestArgsSchema: Definition;
    declare var odcCommands: string[];
}
