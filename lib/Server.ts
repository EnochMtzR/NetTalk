import * as fs from "fs";
import * as tls from "tls";
import * as tcp from "net";
import generateUUID from "uuid/v4";
import NetObject from "./NetObject";
import {
  IEventCallbacks,
  IEventCallbackParams,
  INetTalkConnectionOptions
} from "./types";
import NetTalkConnection from "./NetTalkConnection";

export class Server extends NetObject {
  startServer() {
    const serverOptions: tls.TlsOptions = {
      key: this.ssl ? fs.readFileSync(this.ssl.key) : "",
      cert: this.ssl ? fs.readFileSync(this.ssl.certificate) : "",
      passphrase: this.ssl ? this.ssl.password : ""
    };

    try {
      this.server = this.ssl
        ? tls.createServer(serverOptions, this.newSSLConnection.bind(this))
        : tcp.createServer(this.newTCPConnection.bind(this));

      this.server.listen(this.port, this.host, this.listening.bind(this));
      this.server.on("error", this.errorHandling.bind(this));
    } catch (e) {
      this.errorHandling(e);
    }
  }

  on<Event extends keyof IEventCallbacks>(
    event: Event,
    listener: IEventCallbacks[Event]
  ) {
    this.eventCallbacks[event] = listener;
  }

  private call<Event extends keyof IEventCallbackParams>(
    event: Event,
    ...params: IEventCallbackParams[Event]
  ) {
    if (this.eventCallbacks[event])
      (<any>this.eventCallbacks[event])(...params);
  }

  private newSSLConnection(socket: tls.TLSSocket) {
    const options: INetTalkConnectionOptions = {
      socket: socket,
      id: generateUUID(),
      delimiter: this.delimiter,
      keepAlive: this.keepAlive,
      timeOut: this.timeOut,
      log: this.log
    };
    const connection = new NetTalkConnection(options);

    connection.on("dataReceived", this.onDataReceived.bind(this));
    connection.on("connectionClosed", this.removeConnection.bind(this));
    connection.on("clientDisconnected", this.removeConnection.bind(this));
    connection.on("timeOut", this.removeConnection.bind(this));

    this.connections.push(connection);

    console.log(`New SSL connection received from ${connection.clientIP}.`);
    this.call("connectionReceived", connection);
  }

  private newTCPConnection(socket: tcp.Socket) {
    const options: INetTalkConnectionOptions = {
      socket: socket,
      id: generateUUID(),
      delimiter: this.delimiter,
      keepAlive: this.keepAlive,
      timeOut: this.timeOut,
      log: this.log
    };
    const connection = new NetTalkConnection(options);

    connection.on("dataReceived", this.onDataReceived.bind(this));
    connection.on("connectionClosed", this.removeConnection.bind(this));
    connection.on("clientDisconnected", this.removeConnection.bind(this));
    connection.on("timeOut", this.removeConnection.bind(this));

    this.connections.push(connection);
    console.log(`New TCP connection received from ${connection.clientIP}.`);
    this.call("connectionReceived", connection);
  }

  private listening() {
    if (this.server instanceof tls.Server) {
      console.info(`Secure server started listening on port ${this.port}`);
      this.call("serverStarted", "SSL");
    } else {
      console.info(`Server started listening on port ${this.port}`);
      this.call("serverStarted", "TCP");
    }
  }

  private onDataReceived(connection: NetTalkConnection, data: string) {
    this.call("packageReceived", connection, data);
  }

  private removeConnection(closedConnection: NetTalkConnection, error?: Error) {
    if (this.connections.includes(closedConnection)) {
      this.connections = this.connections.filter(
        connection => connection.UUID !== closedConnection.UUID
      );
      error
        ? this.call("connectionLost", closedConnection, error)
        : this.call("connectionLost", closedConnection);

      if (this.log)
        console.log(
          `Connection ${closedConnection.UUID} (${
            closedConnection.clientIP
          }) has been removed\n\nConnections: [${this.connections.map(
            connection => connection.UUID
          )}]\n`
        );
    }
  }

  get currentConnections() {
    return this.connections;
  }

  get isServerUp() {
    return this.server.listening;
  }

  get connectionType() {
    return this.server instanceof tls.Server ? "SSL" : "TCP";
  }

  shutDown() {
    this.server.close();
  }
}
