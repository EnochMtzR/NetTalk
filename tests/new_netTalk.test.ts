import * as path from "path";
import NetTalk from "../lib/NetTalk";
import * as fixtures from "./fixtures/NetTalkOptions.fixture";
import { NetTalkOptions } from "../lib/types";

describe("Testing NetTalk Instantiation", () => {
  test("should throw error when no options are provided", () => {
    expect(() => {
      new NetTalk.Server(null as any);
    }).toThrow("Options must be provided.");
  });

  describe("should throw error when invalid options provided", () => {
    test("1. Invalid Typeof host", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: 23 as any,
          port: null as any,
          protocol: "WPP"
        };

        new NetTalk.Server(options);
      }).toThrowError("Host must be of type string");
    });

    test("2. No Port provided", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "",
          port: null as any,
          protocol: "WPP"
        };

        new NetTalk.Server(options);
      }).toThrow("Port must be provided.");

      expect(() => {
        const options: NetTalkOptions = {
          host: "",
          port: 0,
          protocol: "WPP"
        };

        new NetTalk.Server(options);
      }).toThrow("Port must be provided.");
    });

    test("3. Invalid Typeof Port", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "",
          port: "23" as any,
          protocol: "WPP"
        };

        new NetTalk.Server(options);
      }).toThrow("Port must be of type number");
    });

    test("4. No Protocol Provided", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: null as any
        };

        new NetTalk.Server(options);
      }).toThrow();

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "" as any
        };

        new NetTalk.Server(options);
      }).toThrow();
    });

    test("5. Invalid Protocol Provided", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "a" as "WPP"
        };

        new NetTalk.Server(options);
      }).toThrow('Invalid Protocol: must be "WPP" or "PPP"');
    });

    test("6. Invalid delimiter Provided", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "PPP",
          delimiter: "invalid"
        };

        new NetTalk.Server(options);
      }).toThrow("Invalid delimiter provided.");
    });

    test("7. No Key or Certificate provided when SSL declared", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {} as any
        };

        new NetTalk.Server(options);
      }).toThrow(
        "Key and Certificates must be provided when SSL is being used"
      );

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: null as any,
            certificate: "some Cert"
          }
        };

        new NetTalk.Server(options);
      }).toThrow(
        "Key and Certificates must be provided when SSL is being used"
      );

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: "",
            certificate: "some Cert"
          }
        };

        new NetTalk.Server(options);
      }).toThrow(
        "Key and Certificates must be provided when SSL is being used"
      );

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: "Some Key",
            certificate: null as any
          }
        };

        new NetTalk.Server(options);
      }).toThrow(
        "Key and Certificates must be provided when SSL is being used"
      );

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: "Some Key",
            certificate: ""
          }
        };

        new NetTalk.Server(options);
      }).toThrow(
        "Key and Certificates must be provided when SSL is being used"
      );
    });

    test("8. Non-Existent Key or Certificate provided", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: "path/not/existent/file.pem",
            certificate: path.join(__dirname, "certificates", "server.crt")
          }
        };

        new NetTalk.Server(options);
      }).toThrow("Key or Certificate not found");

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: path.join(__dirname, "certificates", "key.pem"),
            certificate: "path/not/existent/file.crt"
          }
        };

        new NetTalk.Server(options);
      }).toThrow("Key or Certificate not found");
    });

    test("9. Invalid Key or Certificate provided", () => {
      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: path.join(__dirname, "certificates", "invalidKey.pem"),
            certificate: path.join(__dirname, "certificates", "server.crt")
          }
        };

        new NetTalk.Server(options);
      }).toThrow("Key and Certificate must be valid.");

      expect(() => {
        const options: NetTalkOptions = {
          host: "localhost",
          port: 56,
          protocol: "WPP",
          ssl: {
            key: path.join(__dirname, "certificates", "key.pem"),
            certificate: path.join(__dirname, "certificates", "invalidCer.crt")
          }
        };

        new NetTalk.Server(options);
      }).toThrow("Key and Certificate must be valid.");
    });
  });

  test("should return instance of NetTalk when valid Options provided", () => {
    expect(
      new NetTalk.Server(fixtures.validSSLOptions_Password)
    ).toBeInstanceOf(NetTalk.Server);

    expect(
      new NetTalk.Server(fixtures.validSSLOptions_noPassword)
    ).toBeInstanceOf(NetTalk.Server);

    expect(new NetTalk.Server(fixtures.validTCPOptions)).toBeInstanceOf(
      NetTalk.Server
    );
  });
});
