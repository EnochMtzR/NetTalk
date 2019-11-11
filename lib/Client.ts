import * as tls from "tls";
import * as tcp from "net";

import NetObject from "./NetObject";
import { INetTalkConnectionOptions } from "./types";
import NetTalkConnection = require("./NetTalkConnection");

export class Client extends NetObject {
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

  async sendRequest(request: string) {
    try {
      const connectionSocket = await this.connect();
      const connectionOptions: INetTalkConnectionOptions = {
        socket: connectionSocket,
        id: "",
        delimiter: this.delimiter,
        keepAlive: this.keepAlive,
        timeOut: this.timeOut,
        log: this.log
      };

      this.connection = new NetTalkConnection(connectionOptions);

      return new Promise<String>((resolve, reject) => {
        this.connection.on(
          "dataReceived",
          (connection: NetTalkConnection, data: string) => {
            resolve(data);
            this.connection.close();
          }
        );

        this.connection.on("timeOut", (connection: NetTalkConnection) => {
          reject("Connection timed out.");
        });

        this.connection.on(
          "connectionClosed",
          (connection: NetTalkConnection, error?: Error) => {
            if (error) reject(error);
            else reject("Connection Closed!");
          }
        );

        this.connection.send(request);
      });
    } catch (e) {
      this.errorHandling(e);
    }
  }
}
