import NetTalk from "../NetTalk";
import * as fixtures from "./fixtures/NetTalkOptions.fixture";

describe("testing createServer()", () => {
  describe("testing ssl", () => {
    describe("testing startServer functionality", () => {
      describe("wrong ssl parametters", () => {
        test("should throw error when *.crt file do not match *.pem file", () => {
          const server = new NetTalk(
            fixtures.invalidSSLOptions_unmatchingKeyAndCert
          );

          expect(() => {
            server.startServer();
          }).toThrowError("crt and pem files do not match.");
        });

        test("should throw error when password is not provided for a protected key.pem file", () => {
          const server = new NetTalk(
            fixtures.invalidSSLOptions_passwordNotGiven
          );

          expect(() => {
            server.startServer();
          }).toThrowError(
            "No password has been provided for a password protected key file"
          );
        });

        test("should throw error when wrong password is provided for key.pem file", () => {
          const server = new NetTalk(fixtures.invalidSSLOptions_passwordWrong);

          expect(() => {
            server.startServer();
          }).toThrowError("Wrong password provided for key file");
        });
      });

      describe("Valid SSL Parameters", () => {
        test("Should start secure server when valid SSL with no password provided", done => {
          const server = new NetTalk(fixtures.validSSLOptions_Password);
          function serverStarted(type: "SSL" | "TCP") {
            expect(type).toBe("SSL");
            server.shutDown();
            done();
          }

          server.on("serverStarted", serverStarted);
          server.startServer();
          expect(server.isServerUp).toBeTruthy();
          expect(server.type).toBe("SSL");
        });

        test("Should start secure server when valid SSL with password provided", done => {
          const server = new NetTalk(fixtures.validSSLOptions_noPassword);
          function serverStarted(type: "SSL" | "TCP") {
            expect(type).toBe("SSL");
            server.shutDown();
            done();
          }

          server.on("serverStarted", serverStarted);
          server.startServer();
          expect(server.isServerUp).toBeTruthy();
          expect(server.type).toBe("SSL");
        });
      });
    });
  });

  describe("testing TCP", () => {
    test("should create tcp server when no ssl attributes provided", done => {
      const server = new NetTalk(fixtures.validTCPOptions);
      function serverStarted(type: "SSL" | "TCP") {
        expect(type).toBe("TCP");
        server.shutDown();
        done();
      }

      server.on("serverStarted", serverStarted);
      server.startServer();
      expect(server.isServerUp).toBeTruthy();
      expect(server.type).toBe("TCP");
    });
  });
});
