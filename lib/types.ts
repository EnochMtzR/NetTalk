import NetTalkConnection from "./NetTalkConnection";
import * as tls from "tls";
import * as tcp from "net";

export interface NetTalkOptions {
  host: string;
  port: number;
  ssl?: {
    key?: string;
    certificate?: string;
    password?: string;
    rejectUnauthorized?: boolean;
  };
  protocol: "WPP" | "PPP";
  /**
   * **only when `protocol = "PPP"`**
   *
   * Represents the character, previously agreed on, to be sent at the end of a packet to signify the end of that packet.
   */
  delimiter?: string;
  timeOut?: number;
  keepAlive?: number;
  log?: boolean;
}

export interface IEventCallbacks {
  serverStarted: (serverType: "SSL" | "TCP") => void;
  connectionReceived: (connection: NetTalkConnection) => void;
  packageReceived: (connection: NetTalkConnection, data: string) => void;
  connectionLost: (connection: NetTalkConnection, error?: Error) => void;
}

export interface IEventCallbackParams {
  serverStarted: ["SSL" | "TCP"];
  connectionReceived: [NetTalkConnection];
  packageReceived: [NetTalkConnection, string];
  connectionLost: [NetTalkConnection, Error?];
}

export interface ISSLProps {
  key: string;
  certificate: string;
  password: string;
}

export interface IConEventCallbacks {
  dataReceived: (connection: NetTalkConnection, data: string) => void;
  timeOut: (connection: NetTalkConnection) => void;
  connectionClosed: (connection: NetTalkConnection, error?: Error) => void;
  clientDisconnected: (connection: NetTalkConnection) => void;
}

export interface IConEventCallbackParams {
  dataReceived: [NetTalkConnection, string];
  timeOut: [NetTalkConnection];
  connectionClosed: [NetTalkConnection, Error?];
  clientDisconnected: [NetTalkConnection];
}

export interface INetTalkConnectionOptions {
  socket: tls.TLSSocket | tcp.Socket;
  id: string;
  delimiter?: string;
  timeOut?: number;
  keepAlive?: number;
  log?: boolean;
}

export interface IConnection {
  readonly clientIP: string | undefined;
  readonly UUID: string;

  /**
   * Defines a listener for a given event.
   * @param event The name of the event to listen.
   * @param listener The callback function
   */
  on<event extends keyof IConEventCallbacks>(
    event: event,
    listener: IConEventCallbacks[event]
  ): void;

  /**
   * Sends data on a given connection.
   * @param data
   */
  send(data: string): void;
}

export interface INetTalk {
  currentConnections: NetTalkConnection[];
  isServerUp: boolean;
  connectionType: "SSL" | "TCP";

  /**
   * Creates and starts a new _NetTalk server_
   */
  startServer(): void;

  /**
   * Sends a request as a client to the connected host.
   * @param request
   */
  sendRequest(request: string): Promise<String | undefined>;

  /**
   * Defines a listener for a given event.
   * @param event The name of the event to listen.
   * @param listener The callback function
   */
  on<Event extends keyof IEventCallbacks>(
    event: Event,
    listener: IEventCallbacks[Event]
  ): void;

  /**
   * Closes the server.
   */
  shutDown(): void;
}
