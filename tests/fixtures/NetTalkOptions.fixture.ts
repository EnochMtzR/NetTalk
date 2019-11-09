import * as path from "path";
import { NetTalkOptions } from "../../lib/types";

export const validSSLOptions_noPassword: NetTalkOptions = {
  host: "",
  port: 3000,
  protocol: "PPP",
  delimiter: "\0",
  ssl: {
    key: path.join(__dirname, "..", "certificates", "key.pem"),
    certificate: path.join(__dirname, "..", "certificates", "server.crt")
  }
};

export const validSSLOptions_Password: NetTalkOptions = {
  host: "",
  port: 3000,
  protocol: "PPP",
  ssl: {
    key: path.join(__dirname, "..", "certificates", "passKey.pem"),
    certificate: path.join(__dirname, "..", "certificates", "passCert.crt"),
    password: "abc12345"
  }
};

export const validSSLClientOptions: NetTalkOptions = {
  host: "fake-echo-server.com",
  port: 3000,
  protocol: "PPP",
  ssl: {
    rejectUnauthorized: false
  },
  delimiter: "\0",
  timeOut: 3000
};

export const invalidSSLOptions_unmatchingKeyAndCert: NetTalkOptions = {
  host: "",
  port: 3000,
  protocol: "PPP",
  ssl: {
    key: path.join(__dirname, "..", "certificates", "key.pem"),
    certificate: path.join(__dirname, "..", "certificates", "otherServer.crt")
  }
};

export const invalidSSLOptions_passwordNotGiven: NetTalkOptions = {
  host: "",
  port: 3000,
  protocol: "PPP",
  ssl: {
    key: path.join(__dirname, "..", "certificates", "passKey.pem"),
    certificate: path.join(__dirname, "..", "certificates", "passCert.crt")
  }
};

export const invalidSSLOptions_passwordWrong: NetTalkOptions = {
  host: "",
  port: 3000,
  protocol: "PPP",
  ssl: {
    key: path.join(__dirname, "..", "certificates", "passKey.pem"),
    certificate: path.join(__dirname, "..", "certificates", "passCert.crt"),
    password: "not the password"
  }
};

export const validTCPOptions: NetTalkOptions = {
  host: "",
  port: 3000,
  protocol: "PPP"
};

export const validTCPClientOptions: NetTalkOptions = {
  host: "fake-echo-server.com",
  port: 3000,
  protocol: "PPP",
  delimiter: "\0",
  timeOut: 3000
};
