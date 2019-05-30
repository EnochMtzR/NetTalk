import NetTalkConnection, {
  INetTalkConnectionOptions
} from "../NetTalkConnection";
import * as MockedTLS from "../__mocks__/tls";
import * as MockedTCP from "../__mocks__/net";
import * as tcp from "net";
import * as tls from "tls";

jest.mock("net");
jest.mock("tls");

describe("testing NetTalk Connection Functionality", () => {
  describe("testing ssl", () => {
    describe("testing timeOut Functionality", () => {
      test("should not call timedOut when timeOut option not provided", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "1",
          keepAlive: 3000
        };
        const connection = new NetTalkConnection(options);
        const timeOut = jest.fn(() => {
          console.log("should not print this");
        });

        function testTimedOut() {
          expect(timeOut).not.toHaveBeenCalled();
          done();
        }

        connection.on("timeOut", timeOut);
        setTimeout(testTimedOut, 1000);
        sslSocket.__connectMocked();
      });

      test("should call timeOut when timedOut", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "1",
          keepAlive: 3000,
          timeOut: 1000
        };

        const connection = new NetTalkConnection(options);

        function timeOut(NTConnection: NetTalkConnection) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toEqual(connection);

          done();
        }

        connection.on("timeOut", timeOut);

        sslSocket.__connectMocked();
      });
    });

    describe("testing data reception functionality", () => {
      test("should not call dataReceived function, when no delimiter is send", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "2",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        const onData = jest.fn();

        function timedOut(NTConnection: NetTalkConnection) {
          expect(onData).not.toHaveBeenCalled();
          done();
        }

        connection.on("dataReceived", onData);
        connection.on("timeOut", timedOut);

        sslSocket.__connectMocked();
        sslSocket.__emitDataEvent(
          Buffer.from("sent Message with no delimiter")
        );
      });

      describe("testing single package", () => {
        test("should call dataReceived function when delimiter is sent", done => {
          const tcpSocket = new tcp.Socket();
          const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
          const options: INetTalkConnectionOptions = {
            socket: sslSocket as tls.TLSSocket,
            id: "3",
            delimiter: "\0",
            keepAlive: 3000,
            timeOut: 1000
          };
          const connection = new NetTalkConnection(options);
          const message = "Message to be send";

          function dataReceived(NTConnection: NetTalkConnection, data: String) {
            expect(NTConnection).toBeInstanceOf(NetTalkConnection);
            expect(NTConnection).toBe(connection);
            expect(data).toHaveLength(message.length);
            expect(data).toBe(message);

            done();
          }

          connection.on("dataReceived", dataReceived);

          sslSocket.__emitDataEvent(Buffer.from(`${message}\0`));
        });
      });

      describe("testing multiPackage", () => {
        test("should call dataReceived function until delimiter is sent", done => {
          const tcpSocket = new tcp.Socket();
          const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
          const options: INetTalkConnectionOptions = {
            socket: sslSocket as tls.TLSSocket,
            id: "3",
            delimiter: "\0",
            keepAlive: 3000,
            timeOut: 1000
          };
          const connection = new NetTalkConnection(options);
          const package1 = "This message ";
          const package2 = "is being sent";
          const package3 = "in 3 separate packages";

          function dataReceived(NTConnection: NetTalkConnection, data: String) {
            expect(NTConnection).toBeInstanceOf(NetTalkConnection);
            expect(NTConnection).toBe(connection);
            expect(data).toHaveLength(
              package1.length + package2.length + package3.length
            );
            expect(data).toBe(`${package1}${package2}${package3}`);

            done();
          }

          connection.on("dataReceived", dataReceived);

          sslSocket.__emitDataEvent(Buffer.from(package1));
          sslSocket.__emitDataEvent(Buffer.from(package2));
          sslSocket.__emitDataEvent(Buffer.from(`${package3}\0`));
        });
      });

      test("should not call dataReceived when not bound", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "4",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);
        const message = "Message to be send";

        const dataReceived = jest.fn();

        function timedOut() {
          expect(dataReceived).not.toHaveBeenCalled();

          done();
        }

        connection.on("timeOut", timedOut);

        sslSocket.__connectMocked();
        sslSocket.__emitDataEvent(Buffer.from(`${message}\0`));
      });
    });

    describe("testing close Connection functionality", () => {
      test("should call close callback with Error when error is thrown", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "5",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        const sentError = new Error("My Mocked Error");

        function onConnectionClosed(
          NTConnection: NetTalkConnection,
          error: Error
        ) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toBe(connection);

          expect(error).toBeInstanceOf(Error);
          expect(error).toEqual(sentError);

          done();
        }

        connection.on("connectionClosed", onConnectionClosed);
        sslSocket.__emitError(sentError);
      });

      test("should call close callback with no Error when no error is thrown", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "5",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        function onConnectionClosed(NTConnection: NetTalkConnection) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toBe(connection);

          done();
        }

        connection.on("connectionClosed", onConnectionClosed);
        sslSocket.__emitClose();
      });

      test("should call onClientDisconnected when client has disconnected", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "5",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        function onClientDisconnected(NTConnection: NetTalkConnection) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toBe(connection);

          done();
        }

        connection.on("clientDisconnected", onClientDisconnected);

        sslSocket.__emitClientDisconnect();
      });
    });
    describe("testing getters", () => {
      test("NetTalkConnection.index should return provided id", () => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "6",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        expect(connection.UUID).toBe("6");
        expect(typeof connection.UUID).toBe("string");
      });

      test("NetTalkConnection.clientIP should return sockets remoteAddress", () => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: "6",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        sslSocket.__setRemoteIP("192.168.1.255");

        expect(connection.clientIP).toBe("192.168.1.255");
        expect(typeof connection.clientIP).toBe("string");
      });
    });
  });

  describe("testing tcp", () => {
    describe("testing timeOut Functionality", () => {
      test("should not call timedOut when timeOut option not provided", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "1",
          keepAlive: 3000
        };
        const connection = new NetTalkConnection(options);
        const timeOut = jest.fn(() => {
          console.log("should not print this");
        });

        function testTimedOut() {
          expect(timeOut).not.toHaveBeenCalled();
          done();
        }

        connection.on("timeOut", timeOut);
        setTimeout(testTimedOut, 1000);
        tcpSocket.__connectMocked();
      });

      test("should call timeOut when timedOut", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "1",
          keepAlive: 3000,
          timeOut: 1000
        };

        const connection = new NetTalkConnection(options);

        function timeOut(NTConnection: NetTalkConnection) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toEqual(connection);

          done();
        }

        connection.on("timeOut", timeOut);

        tcpSocket.__connectMocked();
      });
    });

    describe("testing data reception functionality", () => {
      test("should not call dataReceived function, when no delimiter is send", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "2",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        const onData = jest.fn();

        function timedOut(NTConnection: NetTalkConnection) {
          expect(onData).not.toHaveBeenCalled();
          done();
        }

        connection.on("dataReceived", onData);
        connection.on("timeOut", timedOut);

        tcpSocket.__connectMocked();
        tcpSocket.__emitDataEvent(
          Buffer.from("sent Message with no delimiter")
        );
      });

      describe("testing single package", () => {
        test("should call dataReceived function when delimiter is sent", done => {
          const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
          const options: INetTalkConnectionOptions = {
            socket: tcpSocket as tcp.Socket,
            id: "3",
            delimiter: "\0",
            keepAlive: 3000,
            timeOut: 1000
          };
          const connection = new NetTalkConnection(options);
          const message = "Message to be send";

          function dataReceived(NTConnection: NetTalkConnection, data: String) {
            expect(NTConnection).toBeInstanceOf(NetTalkConnection);
            expect(NTConnection).toBe(connection);
            expect(data).toHaveLength(message.length);
            expect(data).toBe(message);

            done();
          }

          connection.on("dataReceived", dataReceived);

          tcpSocket.__emitDataEvent(Buffer.from(`${message}\0`));
        });
      });

      describe("testing multiPackage", () => {
        test("should call dataReceived function until delimiter is sent", done => {
          const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
          const options: INetTalkConnectionOptions = {
            socket: tcpSocket as tcp.Socket,
            id: "3",
            delimiter: "\0",
            keepAlive: 3000,
            timeOut: 1000
          };
          const connection = new NetTalkConnection(options);
          const package1 = "This message ";
          const package2 = "is being sent";
          const package3 = "in 3 separate packages";

          function dataReceived(NTConnection: NetTalkConnection, data: String) {
            expect(NTConnection).toBeInstanceOf(NetTalkConnection);
            expect(NTConnection).toBe(connection);
            expect(data).toHaveLength(
              package1.length + package2.length + package3.length
            );
            expect(data).toBe(`${package1}${package2}${package3}`);

            done();
          }

          connection.on("dataReceived", dataReceived);

          tcpSocket.__emitDataEvent(Buffer.from(package1));
          tcpSocket.__emitDataEvent(Buffer.from(package2));
          tcpSocket.__emitDataEvent(Buffer.from(`${package3}\0`));
        });
      });

      test("should not call dataReceived when not bound", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "4",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);
        const message = "Message to be send";

        const dataReceived = jest.fn();

        function timedOut() {
          expect(dataReceived).not.toHaveBeenCalled();

          done();
        }

        connection.on("timeOut", timedOut);

        tcpSocket.__connectMocked();
        tcpSocket.__emitDataEvent(Buffer.from(`${message}\0`));
      });
    });

    describe("testing close Connection functionality", () => {
      test("should call close callback with Error when error is thrown", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "5",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        const sentError = new Error("My Mocked Error");

        function onConnectionClosed(
          NTConnection: NetTalkConnection,
          error: Error
        ) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toBe(connection);

          expect(error).toBeInstanceOf(Error);
          expect(error).toEqual(sentError);

          done();
        }

        connection.on("connectionClosed", onConnectionClosed);
        tcpSocket.__emitError(sentError);
      });

      test("should call close callback with no Error when no error is thrown", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "5",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        function onConnectionClosed(NTConnection: NetTalkConnection) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toBe(connection);

          done();
        }

        connection.on("connectionClosed", onConnectionClosed);
        tcpSocket.__emitClose();
      });

      test("should call onClientDisconnected when client has disconnected", done => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "5",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        function onClientDisconnected(NTConnection: NetTalkConnection) {
          expect(NTConnection).toBeInstanceOf(NetTalkConnection);
          expect(NTConnection).toBe(connection);

          done();
        }

        connection.on("clientDisconnected", onClientDisconnected);

        tcpSocket.__emitClientDisconnect();
      });
    });
    describe("testing getters", () => {
      test("NetTalkConnection.index should return provided id", () => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "6",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        expect(connection.UUID).toBe("6");
        expect(typeof connection.UUID).toBe("string");
      });

      test("NetTalkConnection.clientIP should return sockets remoteAddress", () => {
        const tcpSocket = new tcp.Socket() as MockedTCP.Socket;
        const options: INetTalkConnectionOptions = {
          socket: tcpSocket as tcp.Socket,
          id: "6",
          delimiter: "\0",
          keepAlive: 3000,
          timeOut: 1000
        };
        const connection = new NetTalkConnection(options);

        tcpSocket.__setRemoteIP("192.168.1.255");

        expect(connection.clientIP).toBe("192.168.1.255");
        expect(typeof connection.clientIP).toBe("string");
      });
    });
  });
});
