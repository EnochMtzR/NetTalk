import NetTalkConnection from "../NetTalkConnection";
import * as tls from "tls";
import * as tcp from "net";

describe("testing NetTalkConnection instantiation", () => {
  test("should throw error when invalid socket is provided", () => {
    let socket: any;

    expect(() => {
      new NetTalkConnection(socket, 1, "\0");
    }).toThrowError("Invalid Socket provided");

    socket = new String("invalid Object");

    expect(() => {
      new NetTalkConnection(socket, 1, "\0");
    }).toThrowError("Invalid Socket provided");
  });

  describe("testing SSL", () => {
    test("should return valid NetTalkConnection instance when valid socket is provided", () => {
      const tcpSocket = new tcp.Socket();
      const sslSocket = new tls.TLSSocket(tcpSocket);

      const connection = new NetTalkConnection(sslSocket, 1, "\0");
      expect(connection).toBeInstanceOf(NetTalkConnection);
      expect(connection.UUID).toBe(1);
    });
  });

  describe("testing TCP", () => {
    test("should return valid NetTalkConnection instance when valid socket is provided", () => {
      const tcpSocket = new tcp.Socket();

      const connection = new NetTalkConnection(tcpSocket, 5, ";");
      expect(connection).toBeInstanceOf(NetTalkConnection);
      expect(connection.UUID).toBe(5);
    });
  });
});
