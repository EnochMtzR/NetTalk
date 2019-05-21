jest.mock("tls");
jest.mock("net");

import NetTalkConnection from "../NetTalkConnection";
import * as tls from "tls";
import * as tcp from "net";

describe("testing NetTalkConnection instantiation", () => {
  describe("testing SSL", () => {
    test("should throw error when invalid socket is provided", () => {
      let socket: any;

      expect(() => {
        new NetTalkConnection(socket, 1);
      }).toThrowError("Invalid Socket provided");

      socket = new String("invalid Object");

      expect(() => {
        new NetTalkConnection(socket, 1);
      }).toThrowError("Invalid Socket provided");
    });

    test("should return valid NetTalkConnection instance when valid socket is provided", () => {
      const tcpSocket = new tcp.Socket();
      const sslSocket = new tls.TLSSocket(tcpSocket);

      const connection = new NetTalkConnection(sslSocket, 1);
      expect(connection).toBeInstanceOf(NetTalkConnection);
      expect(connection.UUID).toBe(1);
    });
  });
});
