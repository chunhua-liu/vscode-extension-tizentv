import { DebugProtocol } from 'vscode-debugprotocol';
import { IDebugAdapter, IDebugTransformer } from './chrome/debugAdapterInterfaces';
export declare type EventHandler = (event: DebugProtocol.Event) => void;
/**
 * Keeps a set of IDebugTransformers and an IDebugAdapter. Has one public method - dispatchRequest, which passes a request through each
 * IDebugTransformer, then to the IDebugAdapter.
 */
export declare class AdapterProxy {
    private static INTERNAL_EVENTS;
    private _requestTransformers;
    private _debugAdapter;
    private _eventHandler;
    constructor(requestTransformers: IDebugTransformer[], debugAdapter: IDebugAdapter, eventHandler: EventHandler);
    /**
     * Passes the request through all IDebugTransformers, then the IDebugAdapter. The request from the IDebugAdapter is passed through all the
     * IDebugTransformers in reverse.
     * Returns a Promise that resolves to the transformed response body.
     */
    dispatchRequest(request: DebugProtocol.Request): Promise<any>;
    /**
     * Pass the request arguments through the transformers. They modify the object in place.
     */
    private transformRequest(request);
    /**
     * Pass the response body back through the transformers in reverse order. They modify the body in place.
     */
    private transformResponse(request, body);
    /**
     * Pass the event back through the transformers in reverse. They modify the object in place.
     */
    private onAdapterEvent(event);
}
