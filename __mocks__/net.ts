interface ISocketEventCallbacks {
  data: (data: Buffer) => void;
  timeout: () => void;
  error: (error: Error) => void;
  close: (hasError: boolean) => void;
  end: () => void;
}

interface ISocketEventCallbackParams {
  data: [Buffer];
  timeout: [];
  error: [Error];
  close: [boolean];
  end: [];
}

let MockedServer: Server;

export class Socket {
  private eventListeners? = {} as ISocketEventCallbacks;

  private timer? = 0;

  remoteAddress? = "127.0.0.1";

  constructor() {
    console.log("Mocked TCP Socket created");
  }

  on?<Event extends keyof ISocketEventCallbacks>(
    event: Event,
    listener: ISocketEventCallbacks[Event]
  ) {
    this.eventListeners[event] = listener;
  }

  call?<Event extends keyof ISocketEventCallbacks>(
    event: Event,
    ...params: ISocketEventCallbackParams[Event]
  ) {
    if (this.eventListeners[event])
      (<any>this.eventListeners[event])(...params);
  }

  setKeepAlive?(activated: boolean, time: number) {}

  setTimeout?(time: number, callback?: () => void) {
    this.timer = time;
    this.eventListeners.timeout = callback;
  }

  destroy?() {}

  __setRemoteIP?(address: string) {
    this.remoteAddress = address;
  }

  __connectMocked?() {
    if (this.timer) setTimeout(this.eventListeners.timeout, this.timer);
  }

  __emitDataEvent?(data: Buffer) {
    this.call("data", data);
  }

  __emitError?(error: Error) {
    this.call("error", error);
    this.call("close", true);
  }

  __emitClose?() {
    this.call("close", false);
  }

  __emitClientDisconnect?() {
    this.call("end");
  }
}

interface IServerEventCallbacks {
  connection: (socket: Socket) => void;
  error: (error: Error) => void;
  listen: () => void;
}

interface IServerEventCallbackParams {
  connection: [Socket];
  error: [Error];
  listen: [];
}

export class Server {
  private eventListeners? = {} as IServerEventCallbacks;

  constructor() {
    console.log("Mocked TCP Server created");
  }

  on?<Event extends keyof IServerEventCallbacks>(
    event: Event,
    listener: IServerEventCallbacks[Event]
  ) {
    this.eventListeners[event] = listener;
  }

  call?<Event extends keyof IServerEventCallbacks>(
    event: Event,
    ...params: IServerEventCallbackParams[Event]
  ) {
    if (this.eventListeners[event])
      (<any>this.eventListeners[event])(...params);
  }

  listen?(port: number, host: string, listener?: () => void) {
    listener();
  }

  __mockConnection?(from: string, socket: Socket) {
    socket.__setRemoteIP(from);
    this.call("connection", socket);
  }
}

export function __setServer(server: Server) {
  MockedServer = server;
}

export function createServer(connectionListener: (socket: Socket) => void) {
  MockedServer.on("connection", connectionListener);
  return MockedServer;
}

export interface IMockedNET {
  TLSSocket: Socket;
  Server: Server;
  __setServer?: (server: Server) => void;
  createServer: (connectionListener: (socket: Socket) => void) => void;
}
