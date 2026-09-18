import {CONFIG} from "../config.js";
export class Network{
 constructor(cfg){this.cfg=cfg;this.ws=null;this.listeners={};this.room=null;this.clientId=null;this.connected=false;this.retry=0;this.connectArgs=null}
 on(t,f){(this.listeners[t]??=[]).push(f);return()=>this.listeners[t]=this.listeners[t].filter(x=>x!==f)}
 emit(t,d){for(const f of this.listeners[t]||[])try{f(d)}catch(e){console.error(e)}}
 connect(args){this.connectArgs=args;this.close(true);this.emit("status","Finding Players...");const q=new URLSearchParams({username:args.username,character:String(args.character)});if(args.room)q.set("room",args.room);let ws;try{ws=new WebSocket(`${this.cfg.BACKEND_WS}/ws?${q}`)}catch{this.emit("status","Connection Failed");return}this.ws=ws;
 ws.onopen=()=>{this.connected=true;this.retry=0;this.emit("status","Connected");this.send("hello",{})};
 ws.onmessage=e=>{try{this.route(JSON.parse(e.data))}catch(err){console.warn("Bad packet",err)}};
 ws.onerror=()=>this.emit("status","Connection Failed");
 ws.onclose=()=>{const was=this.connected;this.connected=false;if(was)this.emit("status","Reconnecting...");if(this.connectArgs&&!this._closing&&this.retry<7){this.retry++;setTimeout(()=>this.connect(this.connectArgs),Math.min(7000,600*this.retry*this.retry))}else if(!was)this.emit("status","Connection Failed")};
 }
 route(m){if(m.type==="welcome"){this.clientId=m.id;this.room=m.room}this.emit(m.type,m)}
 send(type,data={}){if(this.ws?.readyState===WebSocket.OPEN)this.ws.send(JSON.stringify({type,...data}))}
 move(x,y,state,jump=false){this.send("move",{x,y,state,jump})}
 chat(text){this.send("chat",{text})}
 interact(action){this.send("interact",{action})}
 build(typeId){this.send("build",{typeId})}
 signal(to,data){this.send("signal",{to,data})}
 close(permanent=false){this._closing=permanent;try{this.ws?.close()}catch{}if(!permanent)this._closing=false}
}