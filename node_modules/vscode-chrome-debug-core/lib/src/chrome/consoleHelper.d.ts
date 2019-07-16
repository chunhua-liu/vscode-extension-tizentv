import * as Chrome from './chromeDebugProtocol';
export declare function formatConsoleMessage(m: Chrome.Console.Message): {
    text: string;
    isError: boolean;
};
