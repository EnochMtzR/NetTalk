import * as fs from "fs";

export interface NetTalkOptions {
  host: string;
  port: number;
  ssl?: {
    key: string;
    certificate: string;
    password?: string;
  };
  protocol: "WPP" | "PPP";
}

export default class NetTalk {
  private host: string;
  private port: number;
  private protocol: "WPP" | "PPP";
  private ssl = {
    key: "",
    certificate: "",
    password: ""
  };

  constructor(options: NetTalkOptions) {
    try {
      validateOptions(options);

      this.host = options.host;
      this.port = options.port;
      this.protocol = options.protocol;
      if (options.ssl) {
        this.ssl.key = options.ssl.key;
        this.ssl.certificate = options.ssl.certificate;
        this.ssl.password = options.ssl.password;
      } else {
        this.ssl = null;
      }
    } catch (e) {
      throw e;
    }
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

  if (options.ssl) {
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
};
