import { DebugProtocol } from 'vscode-debugprotocol';
import { ISetBreakpointsArgs, IDebugTransformer, ILaunchRequestArgs, IAttachRequestArgs, IStackTraceResponseBody } from '../chrome/debugAdapterInterfaces';
/**
 * Converts a local path from Code to a path on the target.
 */
export declare class PathTransformer implements IDebugTransformer {
    private _webRoot;
    private _clientPathToTargetUrl;
    private _targetUrlToClientPath;
    private _pendingBreakpointsByPath;
    launch(args: ILaunchRequestArgs): void;
    attach(args: IAttachRequestArgs): void;
    setBreakpoints(args: ISetBreakpointsArgs): Promise<void>;
    clearClientContext(): void;
    clearTargetContext(): void;
    scriptParsed(event: DebugProtocol.Event): void;
    stackTraceResponse(response: IStackTraceResponseBody): void;
}
