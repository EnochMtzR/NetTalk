import NetTalkConnection from "../NetTalkConnection";
import * as MockedTLS from "../__mocks__/tls";
import * as tcp from "net";
import * as tls from "tls";

jest.mock("net");
jest.mock("tls");

describe("testing dataReceived", () => {
  describe("testing ssl", () => {
    test("should call timeOut when timedOut", done => {
      const tcpSocket = new tcp.Socket();
      const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      const connection = new NetTalkConnection(socket as tls.TLSSocket, 1);

      function timeOut(NTConnection: NetTalkConnection) {
        expect(NTConnection).toBeInstanceOf(NetTalkConnection);
        expect(NTConnection).toEqual(connection);

        done();
      }

      connection.on("timeOut", timeOut);

      socket.__connectMocked();
    });

    test("should not call dataReceived function, when no delimiter is send", done => {
      const tcpSocket = new tcp.Socket();
      const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      const connection = new NetTalkConnection(socket as tls.TLSSocket, 1);

      const onData = jest.fn();

      function timedOut(NTConnection: NetTalkConnection) {
        expect(onData).not.toHaveBeenCalled();
        done();
      }

      connection.on("dataReceived", onData);
      connection.on("timeOut", timedOut);

      socket.__connectMocked();
      socket.__emitDataEvent(Buffer.from("sent Message with no delimiter"));
    });

    test("should call dataReceived function when delimiter is send", done => {
      const tcpSocket = new tcp.Socket();
      const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      const connection = new NetTalkConnection(socket as tls.TLSSocket, 1);
      const message = "Message to be send";

      function dataReceived(NTConnection: NetTalkConnection, data: String) {
        expect(NTConnection).toBeInstanceOf(NetTalkConnection);
        expect(NTConnection).toBe(connection);
        expect(data).toHaveLength(message.length);
        expect(data).toBe(message);

        done();
      }

      connection.on("dataReceived", dataReceived);

      socket.__emitDataEvent(Buffer.from(`${message}\0`));
    });

    test("should not call dataReceived when not bound", done => {
      const tcpSocket = new tcp.Socket();
      const socket = new tls.TLSSocket(tcpSocket) as MockedTLS.TLSSocket;
      const connection = new NetTalkConnection(socket as tls.TLSSocket, 1);
      const message = "Message to be send";

      const dataReceived = jest.fn();

      function timedOut() {
        expect(dataReceived).not.toHaveBeenCalled();

        done();
      }

      connection.on("timeOut", timedOut);

      socket.__connectMocked();
      socket.__emitDataEvent(Buffer.from(`${message}\0`));
    });
  });
});
