import * as tls from "tls";
import * as tcp from "net";

export default class NetTalkConnection {
  private socket: tls.TLSSocket | tcp.Socket;
  private id: number;

  constructor(socket: tls.TLSSocket | tcp.Socket, id: number) {
    validateParametters(socket);
    this.socket = socket;
    this.id = id;
  }

  get UUID() {
    return this.id;
  }
}

const validateParametters = (socket: tls.TLSSocket | tcp.Socket) => {
  if (
    !socket ||
    (!(socket instanceof tls.TLSSocket) && !(socket instanceof tcp.Socket))
  ) {
    const error = new Error(
      `Invalid Socket provided: Expected tls.TLSSocket | net.Socket but received ${
        socket ? socket.constructor.name : "undefined"
      }`
    );
    throw error;
  }
};
