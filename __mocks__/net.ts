interface IEventCallbacks {
  data: (data: Buffer) => void;
  timeout: () => void;
  error: (error: Error) => void;
  close: (hasError: boolean) => void;
  end: () => void;
}

interface IEventCallbackParams {
  data: [Buffer];
  timeout: [];
  error: [Error];
  close: [boolean];
  end: [];
}

export class Socket {
  private eventListeners? = {} as IEventCallbacks;

  private timer? = 0;

  remoteAddress = "127.0.0.1";

  constructor() {}

  on<Event extends keyof IEventCallbacks>(
    event: Event,
    listener: IEventCallbacks[Event]
  ) {
    this.eventListeners[event] = listener;
  }

  private call?<Event extends keyof IEventCallbacks>(
    event: Event,
    ...params: IEventCallbackParams[Event]
  ) {
    if (this.eventListeners[event])
      (<any>this.eventListeners[event])(...params);
  }

  setKeepAlive(activated: boolean, time: number) {}

  setTimeout(time: number, callback?: () => void) {
    this.timer = time;
    this.eventListeners.timeout = callback;
  }

  destroy() {}

  __connectMocked?() {
    if (this.timer) setTimeout(this.eventListeners.timeout, this.timer);
  }

  __emitDataEvent?(data: Buffer) {
    this.call("data", data);
  }

  __emitError?(error: Error) {
    this.call("error", error);
    this.call("close", true);
  }

  __emitClose?() {
    this.call("close", false);
  }

  __emitClientDisconnect?() {
    this.call("end");
  }
}
