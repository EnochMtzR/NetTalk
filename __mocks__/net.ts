interface IEventCallbacks {
  data: (data: Buffer) => void;
  timeout: () => void;
}

interface IEventCallbackParams {
  data: [Buffer];
  timeout: [];
}

export class Socket {
  private eventListeners? = {} as IEventCallbacks;

  private timer? = 0;

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
    setTimeout(this.eventListeners.timeout, 1000);
  }

  __emitDataEvent?(data: Buffer) {
    this.call("data", data);
  }
}
