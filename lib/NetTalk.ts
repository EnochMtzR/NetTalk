import * as types from "./types";
import * as NetServer from "./Server";
import * as NetClient from "./Client";

export = NetTalk;
namespace NetTalk {
  export import IServerOptions = types.NetTalkOptions;
  export import IConnection = types.IConnection;
  export import Server = NetServer.Server;
  export import Client = NetClient.Client;
}
