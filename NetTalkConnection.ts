import * as tls from "tls";
import * as tcp from "net";

interface IEventCallbacks {
  dataReceived: (connection: NetTalkConnection, data: string) => void;
  timeOut: (connection: NetTalkConnection) => void;
  connectionClosed: (connection: NetTalkConnection, error?: Error) => void;
  clientDisconnected: (connection: NetTalkConnection) => void;
}

interface IEventCallbackParams {
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
}

export default class NetTalkConnection {
  private socket: tls.TLSSocket | tcp.Socket;
  private id: string;
  private delimiter: string;
  private eventCallbacks = {} as IEventCallbacks;
  private currentMessage = "";

  constructor(options: INetTalkConnectionOptions) {
    validateParametters(options.socket);
    this.socket = options.socket;
    this.id = options.id;
    this.delimiter = options.delimiter ? options.delimiter : "\0";

    if (options.keepAlive) this.socket.setKeepAlive(true, options.keepAlive);
    if (options.timeOut) this.socket.setTimeout(options.timeOut);

    this.socket.on("data", this.onDataReceived.bind(this));
    this.socket.on("timeout", this.onTimeOut.bind(this));
    this.socket.on("error", this.onError.bind(this));
    this.socket.on("close", this.onClosed.bind(this));
    this.socket.on("end", this.onClientDisconnected.bind(this));
  }

  on<event extends keyof IEventCallbacks>(
    event: event,
    listener: IEventCallbacks[event]
  ) {
    this.eventCallbacks[event] = listener;
  }

  private call<Event extends keyof IEventCallbacks>(
    event: Event,
    ...params: IEventCallbackParams[Event]
  ) {
    if (this.eventCallbacks[event])
      (<any>this.eventCallbacks[event])(...params);
  }

  private onDataReceived(data: Buffer) {
    this.currentMessage = `${this.currentMessage}${data.toString("utf8")}`;
    if (data.readInt8(data.length - 1) === this.delimiter.charCodeAt(0)) {
      this.call(
        "dataReceived",
        this,
        this.currentMessage.substring(0, this.currentMessage.length - 1)
      );
      this.currentMessage = "";
    }
  }

  private onTimeOut() {
    console.warn(
      `Connection No. ${this.id} (${this.socket.remoteAddress}) has timedOut`
    );
    this.call("timeOut", this);
    this.socket.destroy();
  }

  private onError(error: Error) {
    console.error(
      `Error on connection No. ${this.id} (${
        this.socket.remoteAddress
      })\n${error}`
    );
    this.call("connectionClosed", this, error);
  }

  private onClosed(withError: boolean) {
    if (!withError) {
      console.info(
        `Connection No. ${this.id} (${
          this.socket.remoteAddress
        }) has been terminated.`
      );
      this.call("connectionClosed", this);
    } else {
      console.warn(
        `Connection No. ${this.id} (${
          this.socket.remoteAddress
        }) has closed with errors."`
      );
    }
  }

  private onClientDisconnected() {
    console.info(
      `Client No. ${this.id} (${this.socket.remoteAddress}) has disconnected.`
    );
    this.call("clientDisconnected", this);
  }

  get clientIP() {
    return this.socket.remoteAddress;
  }

  get UUID() {
    return this.id;
  }
}

const validateParametters = (socket: tls.TLSSocket | tcp.Socket) => {
  if (
    !socket ||
    (!(socket instanceof tls.TLSSocket) && !(socket instanceof tcp.Socket))
  ) {
    const error = new Error(
      `Invalid Socket provided: Expected tls.TLSSocket | net.Socket but received ${
        socket ? socket.constructor.name : "undefined"
      }`
    );
    throw error;
  }
};
