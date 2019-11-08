# NetTalk
Library for connecting via sockets with a NetTalk's Clarion Application using WPP or Partial Packet Protocol

## Installation
`npm i NetTalk`

## Usage
The following examples create a _Server_ and _Client_ that can communicate between each other using Partiall Packet Protocol (PPP)
### Server.js
```javascript 
const NetTalk = require("NetTalk");

const options = {
  host: "",
  port: 8080,
  protocol: "PPP"
};

const server = new NetTalk(options);

server.startServer();

server.on("packageReceived", (connection, data) => {
  if(data === "Hello World!") {
    connection.send("Hi there!");
  }
})
```

### Client.js
```javascript
const NetTalk = require("NetTalk");

const options = {
  host: "127.0.0.1",
  port: 8080,
  protocol: "PPP"
};

const client = new NetTalk(options);

client.sendRequest("Hello World!")
.then(data => {
  console.log(data);
})
.catch(e => {
  console.error(e);
});
```

## Specifications
### Server
The server part of NetTalk library provides a series of Methods and properties to handle connections and packets.
#### Options:
Following is an interface representing a complete _Server Configuration Object_:
```typescript
interface NetTalkOptions {
  host: string; // for server this is for focused listening; i.e. listening for packages comming only from a defined address.
  port: number;
  ssl?: {   // if present, SSL will be used on the connection.
    key: string;
    certificate: string;
    password: string;
    rejectUnauthorized: boolean;
  };
  protocol: "WPP" | "PPP"; // protocol to be used WPP("Whole Packet Protocol") or PPP ("Partial Packet Protocol")
  delimiter?: string; // in case of protocol: "PPP", represents the character to send at the end of stream.
  timeOut?: number;
  keepAlive?: number;
  log?: boolean;  // if present = true; if you want a more in depth logging, you may activate it.
}
```
#### Properties:
  The Properties provided by the _NetTalk object_ are:
  
  **connectionType: "SSL" | "TCP"** &mdash; Returns the _type_ of connection beign used on the socket i.e. `"SSL" | "TCP"`
  
  **isServerUp: boolean** &mdash; `true` if server is up, `false` if server is down.
  
  **currentConnections: [NetTalkConnection[]](#nettalkconnection)** &mdash; Returns an array with the current open connections.
  
#### Methods:
  A _NetTalk Object_ has the following methods defined:

  **startServer: (): void** &mdash; Creates and starts a new _Server_.
  
  **on (event: string, listener: \*()=> void): void** &mdash; attaches a listener to the [event](#events) provided.
  
  **shutDown(): void**
  
  **\*Note:** every listener uses diferent parammeters, for more information on listeners and events see [Events](#events).

### Client
The client part of NetTalk library is defined as followed:
#### Options:
  The follow code represents a complete _Client Config Object_:
```typescript
interface NetTalkOptions {
  host: string; // The server to connect to.
  port: number;
  ssl?: {   // if present, SSL will be used on the connection.
    key: string;
    certificate: string;
    password: string;
  };
  protocol: "WPP" | "PPP"; // protocol to be used WPP("Whole Packet Protocol") or PPP ("Partial Packet Protocol")
  delimiter?: string; // in case of protocol: "PPP", represents the character to send at the end of stream.
  timeOut?: number;
  keepAlive?: number;
  log?: boolean;  // if present = true; if you want a more in depth logging, you may activate it.
}
```
#### Methods:
  As the client part of the library is build for maximum ease of use, it only provides one method.
  
  **sendRequest(request: string): Promise< string >** &mdash; Sends a request to the specified host. The method returs a promise that will be resolved with the data responded by the server, so it is possible to use it on **_async_/_await_** functions.

# Events
## "serverStarted" 
  **Listener: (serverType: "SSL" | "TCP") => void**
  
  This event fires up immediately after the server starts listening on the specified port. The listener is called with the type of server that was started _"SSL"_ or _"TCP"_.
  
## "connectionReceived"
  **Listener: (connection: [NetTalkConnection](#nettalkconnection)) => void**
  
  This event fires up for every new connection that is established. The listener is called with the _connection_ object.

## "packageReceived"
  **Listener: (connection: [NetTalkConnection](#nettalkconnection), data: string) => void**
  
  This event fires up every time a new package is received. The listener is called with the _connection_ object where the message was sent, and the data sent.

## "connectionLost"
  **Listener: (connection: [NetTalkConnection](#nettalkconnection), error?: Error) => void**
  
  This event fires up when a connection is _closed,_ _timed up_, or _killed_. The listener is called with the _connection_ object that was lost, and if it was lost for some _error_, the _error_ that occurred.
  
  **Note:** when this event is fired, the connection lost have already been remove from the _currentConnections_ array.

# NetTalkConnection
A _NettalkConnection_ is an object that represents a connection on **_NetTalk_**, it is basically a wrapper on a **_TCP/SSL:_ Socket** that abstracts most of the deep stuff on the Socket.

## Properties
  It provides the following properties:
  
  **clientIP: string** &mdash; The _ip_ of the client connected.
  
  **UUID: string** &mdash; The UUID that uniquely identifies the connection.

## Methods
  The following methods are available on the object:
  
  **on(event: string, listener: \*()=> void): void** &mdash; attaches a listener to the [event](#events) provided.
  
  **send(data: string): void** &mdash; sends data back to the client.
  
  **\*Note:** every listener uses diferent parammeters, for more information on listeners and events see [Events](#events).

