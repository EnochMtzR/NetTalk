import * as tls from "tls";
import * as tcp from "net";
import {
  IConEventCallbacks,
  INetTalkConnectionOptions,
  IConEventCallbackParams,
  IConnection
} from "./types";

class NetTalkConnection implements IConnection {
  private socket: tls.TLSSocket | tcp.Socket;
  private id: string;
  private delimiter: string;
  private log: boolean;
  private eventCallbacks = {} as IConEventCallbacks;
  private currentMessage = "";

  constructor(options: INetTalkConnectionOptions) {
    validateParametters(options.socket);
    this.socket = options.socket;
    this.id = options.id;
    this.delimiter = options.delimiter ? options.delimiter : "\0";
    this.log = options.log || false;

    if (options.keepAlive) this.socket.setKeepAlive(true, options.keepAlive);
    if (options.timeOut) this.socket.setTimeout(options.timeOut);

    this.socket.on("data", this.onDataReceived.bind(this));
    this.socket.on("timeout", this.onTimeOut.bind(this));
    this.socket.on("error", this.onError.bind(this));
    this.socket.on("close", this.onClosed.bind(this));
    this.socket.on("end", this.onClientDisconnected.bind(this));
  }

  on<event extends keyof IConEventCallbacks>(
    event: event,
    listener: IConEventCallbacks[event]
  ) {
    this.eventCallbacks[event] = listener;
  }

  private call<Event extends keyof IConEventCallbacks>(
    event: Event,
    ...params: IConEventCallbackParams[Event]
  ) {
    if (this.eventCallbacks[event])
      (<any>this.eventCallbacks[event])(...params);
  }

  send(data: string) {
    this.socket.write(Buffer.from(`${data}${this.delimiter}`), error => {
      if (error) this.onError(error);
    });
  }

  close() {
    this.socket.end(() => {
      if (this.log) console.info("Connection successfully closed!");
    });
  }

  private onDataReceived(data: Buffer) {
    if (this.log)
      console.info(`Data received from: ${this.clientIP} (${this.id})`);
    this.currentMessage = `${this.currentMessage}${data.toString("utf8")}`;
    if (this.isDataComplete(data)) {
      if (this.log)
        console.info(`Data completed for: ${this.clientIP} (${this.id})`);
      this.call("dataReceived", this, this.currentMessage.slice(0, -1));
      this.currentMessage = "";
    }
  }

  private isDataComplete(data: Buffer) {
    return data.readInt8(data.length - 1) === this.delimiter.charCodeAt(0);
  }

  private onTimeOut() {
    if (this.id && this.log)
      console.warn(
        `Connection No. ${this.id} (${this.socket.remoteAddress}) has timed out!`
      );
    else if (this.log) console.warn(`Connection has timed out!`);
    this.call("timeOut", this);
    this.socket.destroy();
  }

  private onError(error: Error) {
    if (this.id && this.log)
      console.error(
        `Error on connection No. ${this.id} (${this.socket.remoteAddress})\n${error}`
      );
    else if (this.log) console.error(`Error:\n${error}`);
    this.call("connectionClosed", this, error);
  }

  private onClosed(withError: boolean) {
    if (!withError) {
      if (this.id && this.log)
        console.info(
          `Connection No. ${this.id} (${this.socket.remoteAddress}) has been terminated.`
        );
      this.call("connectionClosed", this);
    } else {
      if (this.id && this.log)
        console.warn(
          `Connection No. ${this.id} (${this.socket.remoteAddress}) has closed with errors."`
        );
      else if (this.log) console.warn(`Connection has closed with errors`);
    }
  }

  private onClientDisconnected() {
    if (this.id && this.log)
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

const validateParametters = (socket: any) => {
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

export = NetTalkConnection;
