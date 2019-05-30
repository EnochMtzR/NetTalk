import { Socket, Server as TCPServer } from "./net";

let MockedServer: Server;

export class TLSSocket extends Socket {
  constructor() {
    super();
    console.log("Mocked SSL Socket created");
  }
}

export class Server extends TCPServer {
  constructor() {
    super();
    console.log("Mocked SSL Server created");
  }
}

export function __setServer(server: Server) {
  MockedServer = server;
}

export function createServer(
  options: any,
  connectionListener: (socket: Socket) => void
) {
  MockedServer.on("connection", connectionListener);
  return MockedServer;
}

export function connect(port: number, host: string, options: any) {
  const socket = new TLSSocket();
  if (!host) throw new Error("Server must be provided.");
  if (host === "fake-echo-server.com") {
    socket.__setRemoteIP(host);
    setTimeout(() => {
      socket.call("ready");
    }, 1000);
  } else {
    setTimeout(() => {
      socket.__emitError(new Error("Server could not be reached."));
    }, 1000);
  }
  return socket;
}

export interface IMockedTLS {
  TLSSocket: TLSSocket;
  Server: Server;
  __setServer?: (server: Server) => void;
  createServer: (connectionListener: (socket: Socket) => void) => void;
}
