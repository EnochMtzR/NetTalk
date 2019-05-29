import * as path from "path";
import { NetTalkOptions } from "../../NetTalk";

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
