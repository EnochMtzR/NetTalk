import NetTalkConnection, {
  INetTalkConnectionOptions
} from "../NetTalkConnection";
import * as tls from "tls";
import * as tcp from "net";

describe("testing NetTalkConnection instantiation", () => {
  test("should throw error when invalid socket is provided", () => {
    //---------------------- NULL SOCKET PROVIDED -------------------------//
    let options = {
      socket: null as any,
      id: "1",
      delimiter: "\0"
    };

    expect(() => {
      new NetTalkConnection(options);
    }).toThrowError("Invalid Socket provided");

    //--------------- INVALID OBJECT FOR SOCKET PROVIDED ------------------//

    options.id = "2";
    options.socket = new String("invalid Object");

    expect(() => {
      new NetTalkConnection(options);
    }).toThrowError("Invalid Socket provided");
  });

  describe("testing SSL", () => {
    test("should return valid NetTalkConnection instance when valid socket is provided", () => {
      const tcpSocket = new tcp.Socket();
      const sslSocket = new tls.TLSSocket(tcpSocket);
      const options: INetTalkConnectionOptions = {
        socket: sslSocket,
        id: "3",
        delimiter: "|"
      };

      const connection = new NetTalkConnection(options);
      expect(connection).toBeInstanceOf(NetTalkConnection);
      expect(connection.UUID).toBe(options.id);
    });
  });

  describe("testing TCP", () => {
    test("should return valid NetTalkConnection instance when valid socket is provided", () => {
      const tcpSocket = new tcp.Socket();
      const options: INetTalkConnectionOptions = {
        socket: tcpSocket,
        id: "4",
        delimiter: ";"
      };

      const connection = new NetTalkConnection(options);
      expect(connection).toBeInstanceOf(NetTalkConnection);
      expect(connection.UUID).toBe(options.id);
    });
  });
});
