class WebSocketService {
  private userId: string = 'user' + (Math.random() * 10).toFixed(2);
  private url: string;
  private socket: WebSocket | null = null;
  private heartbeat: boolean = false;

  private dataReceived: ((data: any) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    this.initWebSocket();
  }

  private handleData(data: any): void {
    if (this.dataReceived) {
      this.dataReceived(JSON.parse(data));
    }
  }

  public onDataReceived(callback: (data: any) => void): void {
    this.dataReceived = callback;
  }

  public getUserId(): string {
    return this.userId;
  }

  private initWebSocket(): void {
    console.log('调用了链接websock');
    this.socket = new WebSocket(this.url + this.userId);
    console.log(this.url + this.userId);

    this.socket.onmessage = (event: MessageEvent) => this.handleData(event.data);
    this.socket.onopen = (event: Event) => this.websocketOnopen(event);
    this.socket.onerror = (event: Event) => this.websocketOnerror(event);
    this.socket.onclose = (event: CloseEvent) => this.websocketOnclose(event);
  }

  private websocketOnopen(event: Event): void {
    console.log('WebSocket连接成功');
    this.websocketSend({ state: 1 });
  }

  public websocketSend(data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ ...data, userId: this.userId }));
    }
  }

  private websocketOnerror(event: Event): void {
    console.log('WebSocket连接发生错误');
    this.reconnect();
  }

  private websocketOnmessage(event: MessageEvent): void {
    console.log('-----接收消息-------');
    const data = JSON.parse(event.data);
    this.handleData(data);
  }

  private websocketOnclose(event: CloseEvent): void {
    console.log('连接关闭 (' + event.code + ')');
    this.reconnect();
  }

  private reconnect(): void {
    if (this.heartbeat) {
      setTimeout(() => {
        console.info('尝试重连...');
        this.initWebSocket();
      }, 5000);
    }
  }
}

export const webSocketService = new WebSocketService('wss://192.168.1.103:8888/websocket/');
