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

export interface IMockedTLS {
  TLSSocket: TLSSocket;
  Server: Server;
  __setServer?: (server: Server) => void;
  createServer: (connectionListener: (socket: Socket) => void) => void;
}
