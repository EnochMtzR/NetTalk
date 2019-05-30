interface ISocketEventCallbacks {
  data: (data: Buffer) => void;
  timeout: () => void;
  error: (error: Error) => void;
  close: (hasError: boolean) => void;
  end: () => void;
  ready: () => void;
}

interface ISocketEventCallbackParams {
  data: [Buffer];
  timeout: [];
  error: [Error];
  close: [boolean];
  end: [];
  ready: [];
}

let MockedServer: Server;

export class Socket {
  private eventListeners? = {} as ISocketEventCallbacks;
  private timeoutCounter?: NodeJS.Timeout;

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

  write?(data: Buffer) {
    this.__connectMocked();
    if (data.readInt8(data.length - 1) === 0) {
      this.__emitDataEvent(data);
      this.__emitClientDisconnect();
    } else if (
      data.toString("utf8", 0, data.length - 1) === "Error in sending"
    ) {
      this.__emitError(new Error("Connection was lost."));
    }
  }

  __setRemoteIP?(address: string) {
    this.remoteAddress = address;
  }

  __connectMocked?() {
    if (this.timer)
      this.timeoutCounter = setTimeout(this.eventListeners.timeout, this.timer);
  }

  __emitDataEvent?(data: Buffer) {
    this.call("data", data);
  }

  __emitError?(error: Error) {
    this.call("error", error);
    this.call("close", true);
  }

  __emitClose?() {
    clearTimeout(this.timeoutCounter);
    this.call("close", false);
  }

  __emitClientDisconnect?() {
    clearTimeout(this.timeoutCounter);
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

export function connect(port: number, host: string) {
  const socket = new Socket();
  if (!host) throw new Error("Server must be provided.");
  if (host === "fake-echo-server.com") {
    socket.__setRemoteIP(host);
    setTimeout(() => {
      socket.call("ready");
    }, 1000);
  } else {
    throw new Error("Server could not be reached.");
  }
  return socket;
}

export interface IMockedNET {
  Socket: Socket;
  Server: Server;
  __setServer?: (server: Server) => void;
  createServer: (connectionListener: (socket: Socket) => void) => void;
}
