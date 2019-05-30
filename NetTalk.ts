import * as fs from "fs";
import * as tls from "tls";
import * as tcp from "net";
import * as generateUUID from "uuid/v4";
import NetTalkConnection, {
  INetTalkConnectionOptions
} from "./NetTalkConnection";

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
}

interface IEventCallbacks {
  serverStarted: (serverType: "SSL" | "TCP") => void;
  connectionReceived: (connection: NetTalkConnection) => void;
  packageReceived: (connection: NetTalkConnection, data: string) => void;
  connectionLost: (connection: NetTalkConnection, error?: Error) => void;
}

interface IEventCallbackParams {
  serverStarted: ["SSL" | "TCP"];
  connectionReceived: [NetTalkConnection];
  packageReceived: [NetTalkConnection, string];
  connectionLost: [NetTalkConnection, Error?];
}

export default class NetTalk {
  private host: string;
  private port: number;
  private protocol: "WPP" | "PPP";
  private delimiter: string;
  private timeOut: number;
  private keepAlive: number;
  private ssl = {
    key: "",
    certificate: "",
    password: ""
  };
  private rejectUnauthorized: boolean;
  private server: tls.Server | tcp.Server;
  private eventCallbacks = {} as IEventCallbacks;
  private connections = [] as NetTalkConnection[];
  private connection = {} as NetTalkConnection;

  constructor(options: NetTalkOptions) {
    try {
      validateOptions(options);

      this.host = options.host;
      this.port = options.port;
      this.protocol = options.protocol;
      this.delimiter = options.delimiter ? options.delimiter : "\0";
      this.timeOut = options.timeOut;
      this.keepAlive = options.keepAlive;

      if (options.ssl) {
        this.ssl.key = options.ssl.key;
        this.ssl.certificate = options.ssl.certificate;
        this.ssl.password = options.ssl.password;
        this.rejectUnauthorized = options.ssl.rejectUnauthorized;
      } else {
        this.ssl = null;
      }
    } catch (e) {
      this.errorHandling(e);
    }
  }

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

  private connect() {
    const clientOptions: tls.ConnectionOptions = {
      rejectUnauthorized: this.rejectUnauthorized
    };

    try {
      const socket = this.ssl
        ? tls.connect(this.port, this.host, clientOptions)
        : tcp.connect(this.port, this.host);

      return new Promise<tls.TLSSocket | tcp.Socket>((resolve, reject) => {
        socket.setTimeout(this.timeOut);

        socket.on("ready", () => {
          resolve(socket);
        });

        socket.on("error", error => {
          reject(error);
        });
      });
    } catch (e) {
      throw e;
    }
  }

  async sendRequest(message: string) {
    try {
      const connectionSocket = await this.connect();
      const connectionOptions: INetTalkConnectionOptions = {
        socket: connectionSocket,
        id: generateUUID(),
        delimiter: this.delimiter,
        keepAlive: this.keepAlive,
        timeOut: this.timeOut
      };

      this.connection = new NetTalkConnection(connectionOptions);

      return new Promise<String>((resolve, reject) => {
        this.connection.on("dataReceived", (connection, data) => {
          resolve(data);
        });

        this.connection.on("timeOut", connection => {
          reject("Connection timed out.");
        });

        this.connection.on("connectionClosed", (connection, error: Error) => {
          reject(error);
        });

        connectionSocket.write(Buffer.from(`${message}${this.delimiter}`));
      });
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
      timeOut: this.timeOut
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
      timeOut: this.timeOut
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
    this.connections = this.connections.filter(
      connection => connection.UUID !== closedConnection.UUID
    );
    error
      ? this.call("connectionLost", closedConnection, error)
      : this.call("connectionLost", closedConnection);
  }

  get currentConnections() {
    return this.connections;
  }

  get isServerUp() {
    return this.server.listening;
  }

  get type() {
    return this.server instanceof tls.Server ? "SSL" : "TCP";
  }

  shutDown() {
    this.server.close();
  }

  private errorHandling(error: any) {
    let returnError: Error;
    if (error.message.includes("0B080074")) {
      returnError = new Error("crt and pem files do not match.");
    } else if (error.message.includes("06065064")) {
      if (this.ssl.password) {
        returnError = new Error("Wrong password provided for key file");
      } else {
        returnError = new Error(
          "No password has been provided for a password protected key file"
        );
      }
    } else {
      returnError = new Error(error);
    }
    throw returnError;
  }
}

const validateOptions = (options: NetTalkOptions) => {
  if (!options) {
    const error = new Error("Options must be provided.");
    throw error;
  }

  if (typeof options.host !== "string") {
    const error = new Error(
      `Host must be of type string, but type ${typeof options.host} was received.`
    );
    throw error;
  }

  if (options.port) {
    if (typeof options.port !== "number") {
      const error = new Error(
        `Port must be of type number, but type ${typeof options.port} was received.`
      );
      throw error;
    }
  } else {
    const error = new Error(`Port must be provided.`);
    throw error;
  }

  if (options.protocol) {
    if (options.protocol !== "WPP" && options.protocol !== "PPP") {
      const error = new Error(
        `Invalid Protocol: must be "WPP" or "PPP", but received ${
          options.protocol
        }.`
      );
      throw error;
    }
  } else {
    const error = new Error(`Protocol must be provided.`);
    throw error;
  }

  if (options.delimiter && options.delimiter.length > 1) {
    const error = new Error("Invalid delimiter provided.");
    throw error;
  }

  if (options.ssl) {
    if (options.ssl.rejectUnauthorized === undefined) {
      if (!options.ssl.certificate || !options.ssl.key) {
        const error = new Error(
          `Key and Certificates must be provided when SSL is being used.`
        );
        throw error;
      } else {
        try {
          const key = fs.readFileSync(options.ssl.key);
          const cert = fs.readFileSync(options.ssl.certificate);
          if (key.length === 0 || cert.length === 0) {
            const error = new Error(`Key and Certificate must be valid.`);
            throw error;
          }
        } catch (e) {
          if (e.code) {
            const error = new Error(`Key or Certificate not found.`);
            throw error;
          } else {
            throw e;
          }
        }
      }
    }
  }
};
