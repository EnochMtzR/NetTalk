import NetTalk from "../NetTalk";
import * as fixtures from "./fixtures/NetTalkOptions.fixture";
import * as MockedTLS from "../__mocks__/tls";
import * as tls from "tls";
import * as tcp from "net";
import NetTalkConnection from "../NetTalkConnection";

jest.mock("net");
jest.mock("tls");

describe("Testing NetTalk's functionality", () => {
  describe("testing newConnections functionality", () => {
    test("should call on new connection when connection received", done => {
      const sslServer = new tls.Server() as MockedTLS.Server;
      const server = new NetTalk(fixtures.validSSLOptions_Password);
      const tcpSocket = new tcp.Socket();
      const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      const clientIP = "192.168.1.00";

      function onNewConnection(connection: NetTalkConnection) {
        expect(connection).toBeInstanceOf(NetTalkConnection);
        expect(connection.clientIP).toBe(clientIP);
        expect(connection.index).toBe(0);

        done();
      }

      (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

      server.on("connectionReceived", onNewConnection);
      server.startServer();

      sslServer.__mockConnection(clientIP, socket);
    });

    test("should return connected sockets on get currentConnections()", done => {
      const sslServer = new tls.Server() as MockedTLS.Server;
      const server = new NetTalk(fixtures.validSSLOptions_Password);
      const tcpSocket = new tcp.Socket();
      const socket1 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      const socket2 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      let connectionCounter = 0;

      function onNewConnection() {
        connectionCounter++;
        if (connectionCounter === 2) {
          expect(server.currentConnections).toBeInstanceOf(Array);
          expect(server.currentConnections.length).toBe(2);
          expect(server.currentConnections[0].clientIP).toBe("192.168.1.89");
          expect(server.currentConnections[0].index).toBe(0);
          expect(server.currentConnections[1].clientIP).toBe("127.0.0.1");
          expect(server.currentConnections[1].index).toBe(1);

          done();
        }
      }

      (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

      server.on("connectionReceived", onNewConnection);
      server.startServer();

      sslServer.__mockConnection("192.168.1.89", socket1);
      sslServer.__mockConnection("127.0.0.1", socket2);
    });
  });
});
