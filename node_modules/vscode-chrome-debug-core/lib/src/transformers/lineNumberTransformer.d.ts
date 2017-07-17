import { DebugProtocol } from 'vscode-debugprotocol';
import { IDebugTransformer, ISetBreakpointsResponseBody, IStackTraceResponseBody } from '../chrome/debugAdapterInterfaces';
/**
 * Converts from 1 based lines on the client side to 0 based lines on the target side
 */
export declare class LineNumberTransformer implements IDebugTransformer {
    private _targetLinesStartAt1;
    private _clientLinesStartAt1;
    constructor(targetLinesStartAt1: boolean);
    initialize(args: DebugProtocol.InitializeRequestArguments): void;
    setBreakpoints(args: DebugProtocol.SetBreakpointsArguments): void;
    setBreakpointsResponse(response: ISetBreakpointsResponseBody): void;
    stackTraceResponse(response: IStackTraceResponseBody): void;
    private convertClientLineToTarget(line);
    private convertTargetLineToClient(line);
}
