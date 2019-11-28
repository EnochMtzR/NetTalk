import * as tls from "tls";
import * as tcp from "net";
import * as fs from "fs";
import { ISSLProps, IEventCallbacks, NetTalkOptions } from "./types";
import NetTalkConnection = require("./NetTalkConnection");

export default class NetObject {
  protected host!: string;
  protected port!: number;
  protected protocol!: "WPP" | "PPP";
  protected delimiter!: string;
  protected timeOut!: number;
  protected keepAlive!: number;
  protected keepConnected!: boolean;
  protected log!: boolean;
  protected ssl: ISSLProps | undefined = {
    key: "",
    certificate: "",
    password: ""
  };
  protected rejectUnauthorized!: boolean;
  protected server!: tls.Server | tcp.Server;
  protected eventCallbacks = {} as IEventCallbacks;
  protected connections = [] as NetTalkConnection[];
  protected connection = {} as NetTalkConnection;

  constructor(options: NetTalkOptions) {
    try {
      validateOptions(options);

      this.host = options.host;
      this.port = options.port;
      this.protocol = options.protocol;
      this.delimiter = options.delimiter ? options.delimiter : "\0";
      this.timeOut = options.timeOut || 0;
      this.keepAlive = options.keepAlive || 0;
      this.log = options.log || false;
      this.keepConnected = options.keepConnected || false;

      if (options.ssl && this.ssl) {
        this.ssl.key = options.ssl.key || "";
        this.ssl.certificate = options.ssl.certificate || "";
        this.ssl.password = options.ssl.password || "";
        this.rejectUnauthorized = options.ssl.rejectUnauthorized || false;
      } else {
        this.ssl = undefined;
      }
    } catch (e) {
      this.errorHandling(e);
    }
  }

  protected errorHandling(error: any) {
    let returnError: Error;
    if (error.message.includes("0B080074")) {
      returnError = new Error("crt and pem files do not match.");
    } else if (error.message.includes("06065064")) {
      if (this.ssl && this.ssl.password) {
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
        `Invalid Protocol: must be "WPP" or "PPP", but received ${options.protocol}.`
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
