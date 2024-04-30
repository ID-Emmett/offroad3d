class WebSocketService {
  private userId: string = 'user' + (Math.random() * 10).toFixed(2)
  private url: string
  private socket: WebSocket
  private heartbeat: boolean = false

  private dataReceived: (data: any) => void;

  constructor(url: string) {
    this.url = url
    this.initWebSocket()
  }
  private handleData(data: any): void {
    if (this.dataReceived) {
      this.dataReceived(JSON.parse(data));
    }
  }
  public onDataReceived(callback: (data: any) => void): void {
    this.dataReceived = callback;
  }
  public getUserId() {
    return this.userId
  }

  public initWebSocket() {
    // WebSocket与普通的请求所用协议有所不同，ws等同于http，wss等同于https
    console.log('调用了链接websock')
    // var url = window._CONFIG['domianURL'].replace('https://', 'wss://').replace('http://', 'ws://') + '/websocket/' + userId
    this.socket = new WebSocket(this.url + this.userId);

    console.log(this.url + this.userId)

    this.socket.onmessage = (event) => this.handleData(event.data);
    this.socket.onopen = (event) => this.websocketOnopen(event)
    this.socket.onerror = (event) => this.websocketOnerror(event)
    this.socket.onclose = (event) => this.websocketOnclose(event)
  }


  public websocketOnopen(e: any) {
    console.log('WebSocket连接成功')
    this.websocketSend({ state: 1 })
  }

  public websocketSend(text: any) {
    // 数据发送

    if (this.socket.readyState === 1) {
      this.socket.send(JSON.stringify({ ...text, userId: this.userId }))
    }
  }

  public websocketOnerror(e: any) {
    console.log('WebSocket连接发生错误')
    this.reconnect()
  }

  public websocketOnmessage(e: any) {
    console.log('-----接收消息-------')
    const data = JSON.parse(e.data)
    this.handleData(data)
  }

  public websocketOnclose(e: any) {
    console.log('连接关闭 (' + e.code + ')')
  }


  public reconnect() {
    if (this.heartbeat) {
      setTimeout(() => {
        console.info('尝试重连...')
        this.initWebSocket()
      }, 5000)
    }

  }
}

export const webSocketService = new WebSocketService('wss://192.168.1.103:8888/websocket/')
