import NetTalkConnection, {
  INetTalkConnectionOptions
} from "../NetTalkConnection";
import * as MockedTLS from "../__mocks__/tls";
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
          id: 1,
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
          id: 1,
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
          id: 2,
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

      test("should call dataReceived function when delimiter is send", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: 3,
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

      test("should not call dataReceived when not bound", done => {
        const tcpSocket = new tcp.Socket();
        const sslSocket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
        const options: INetTalkConnectionOptions = {
          socket: sslSocket as tls.TLSSocket,
          id: 4,
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
          id: 5,
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
          id: 5,
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
          id: 5,
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
  });
});
