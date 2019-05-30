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
        expect(typeof connection.UUID).toBe("string");
        expect(connection.UUID.length).toBe(36);

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
          expect(typeof server.currentConnections[0].UUID).toBe("string");
          expect(server.currentConnections[0].UUID.length).toBe(36);
          expect(server.currentConnections[1].clientIP).toBe("127.0.0.1");
          expect(typeof server.currentConnections[1].UUID).toBe("string");
          expect(server.currentConnections[1].UUID.length).toBe(36);

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

  describe("testing data reception functionality", () => {
    describe("testing single package reception", () => {
      test("should call onPackageReceived when delimiter is received", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const clientIP = "192.168.1.00";
        const message = "This message is being sent in one go.";
        let connectionId: string;

        function onPackageReceived(
          connection: NetTalkConnection,
          data: string
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(clientIP);
          expect(connection.UUID).toBe(connectionId);

          expect(data).toBe(message);

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("packageReceived", onPackageReceived);
        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connectionId = connection.UUID;
        });
        server.startServer();

        sslServer.__mockConnection(clientIP, socket);
        socket.__emitDataEvent(Buffer.from(`${message}\0`));
      });
    });

    describe("testing multi-package reception", () => {
      test("should call onPackageReceived until delimiter is received", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const clientIP = "192.168.1.65";
        let connectionId: string;
        const package1 = "This message ";
        const package2 = "is being sent ";
        const package3 = "in 3 separate packages";

        function onPackageReceived(
          connection: NetTalkConnection,
          data: string
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(clientIP);
          expect(connection.UUID).toBe(connectionId);

          expect(data).toBe(`${package1}${package2}${package3}`);

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("packageReceived", onPackageReceived);
        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connectionId = connection.UUID;
        });
        server.startServer();

        sslServer.__mockConnection(clientIP, socket);
        socket.__emitDataEvent(Buffer.from(package1));
        socket.__emitDataEvent(Buffer.from(package2));
        socket.__emitDataEvent(Buffer.from(`${package3}\0`));
      });
    });
  });

  describe("testing connectionLost", () => {
    describe("testing connectionClosed", () => {
      test("should call onConnectionLost when connection is closed by Server", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const clientIP = "192.168.1.65";
        let connectionId: string;

        function onConnectionLost(
          connection: NetTalkConnection,
          error?: Error
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(clientIP);
          expect(connection.UUID).toBe(connectionId);

          expect(error).toBeUndefined();

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("connectionLost", onConnectionLost);
        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connectionId = connection.UUID;
        });
        server.startServer();

        sslServer.__mockConnection(clientIP, socket);
        socket.__emitClose();
      });

      test("should remove connection when connection is closed", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket1 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const socket2 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const client1IP = "192.168.1.65";
        const client2IP = "192.168.1.99";
        let connection1Id: string;
        let connection2Id: string;

        function onConnectionLost(
          connection: NetTalkConnection,
          error?: Error
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(client1IP);
          expect(connection.UUID).toBe(connection1Id);

          expect(server.currentConnections.length).toBe(1);
          expect(server.currentConnections[0].UUID).toBe(connection2Id);
          expect(server.currentConnections[0].clientIP).toBe(client2IP);

          expect(error).toBeUndefined();

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connection1Id
            ? (connection2Id = connection.UUID)
            : (connection1Id = connection.UUID);
        });
        server.on("connectionLost", onConnectionLost);
        server.startServer();

        sslServer.__mockConnection(client1IP, socket1);
        sslServer.__mockConnection(client2IP, socket2);
        socket1.__emitClose();
      });
    });

    describe("testing client disconnects", () => {
      test("should call onConnectionLost when client close the connection", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const clientIP = "192.168.1.65";
        let connectionId: string;

        function onConnectionLost(
          connection: NetTalkConnection,
          error?: Error
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(clientIP);
          expect(connection.UUID).toBe(connectionId);

          expect(error).toBeUndefined();

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("connectionLost", onConnectionLost);
        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connectionId = connection.UUID;
        });
        server.startServer();

        sslServer.__mockConnection(clientIP, socket);
        socket.__emitClientDisconnect();
      });

      test("should remove connection when client severs the connection", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket1 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const socket2 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const client1IP = "192.168.1.65";
        const client2IP = "192.168.1.99";
        let connection1Id: string;
        let connection2Id: string;

        function onConnectionLost(
          connection: NetTalkConnection,
          error?: Error
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(client1IP);
          expect(connection.UUID).toBe(connection1Id);

          expect(server.currentConnections.length).toBe(1);
          expect(server.currentConnections[0].UUID).toBe(connection2Id);
          expect(server.currentConnections[0].clientIP).toBe(client2IP);

          expect(error).toBeUndefined();

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connection1Id
            ? (connection2Id = connection.UUID)
            : (connection1Id = connection.UUID);
        });
        server.on("connectionLost", onConnectionLost);
        server.startServer();

        sslServer.__mockConnection(client1IP, socket1);
        sslServer.__mockConnection(client2IP, socket2);
        socket1.__emitClientDisconnect();
      });
    });

    describe("testing error in socket", () => {
      test("should call onConnectionLost when error is found on connection", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const clientIP = "192.168.1.65";
        const sentError = new Error("Error found in connection");
        let connectionId: string;

        function onConnectionLost(
          connection: NetTalkConnection,
          error?: Error
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(clientIP);
          expect(connection.UUID).toBe(connectionId);

          expect(error).toEqual(sentError);

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("connectionLost", onConnectionLost);
        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connectionId = connection.UUID;
        });
        server.startServer();

        sslServer.__mockConnection(clientIP, socket);
        socket.__emitError(sentError);
      });

      test("should remove connection when error is found in connection", done => {
        const sslServer = new tls.Server() as MockedTLS.Server;
        const server = new NetTalk(fixtures.validSSLOptions_Password);
        const tcpSocket = new tcp.Socket();
        const socket1 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const socket2 = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const client1IP = "192.168.1.65";
        const client2IP = "192.168.1.99";
        let connection1Id: string;
        let connection2Id: string;
        const sentError = new Error("Error found in connection");

        function onConnectionLost(
          connection: NetTalkConnection,
          error?: Error
        ) {
          expect(connection).toBeInstanceOf(NetTalkConnection);
          expect(connection.clientIP).toBe(client1IP);
          expect(connection.UUID).toBe(connection1Id);

          expect(server.currentConnections.length).toBe(1);
          expect(server.currentConnections[0].UUID).toBe(connection2Id);
          expect(server.currentConnections[0].clientIP).toBe(client2IP);

          expect(error).toEqual(sentError);

          done();
        }

        (<MockedTLS.IMockedTLS>tls).__setServer(sslServer);

        server.on("connectionReceived", (connection: NetTalkConnection) => {
          connection1Id
            ? (connection2Id = connection.UUID)
            : (connection1Id = connection.UUID);
        });
        server.on("connectionLost", onConnectionLost);
        server.startServer();

        sslServer.__mockConnection(client1IP, socket1);
        sslServer.__mockConnection(client2IP, socket2);
        socket1.__emitError(sentError);
      });
    });
  });
});
