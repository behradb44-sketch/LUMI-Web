import {WebSocketServer} from "ws";
import crypto from "node:crypto";
import {RoomManager} from "../rooms/roomManager.js";
import {Player} from "../rooms/player.js";
import {RateLimiter} from "../security/rateLimit.js";
import {name} from "../security/validation.js";
import {route} from "./messageRouter.js";
export function attach(server){
 const wss=new WebSocketServer({server,path:'/ws'}),rooms=new RoomManager(),clients=new Map();
 wss.on('connection',(ws,req)=>{
  const u=new URL(req.url,'http://localhost');
  const requestedRoom=u.searchParams.get('room');
  const p=new Player(crypto.randomUUID(),name(u.searchParams.get('username')),Number(u.searchParams.get('character')));
  p.ws=ws;
  const room=rooms.join(requestedRoom,p);
  if(!room){ws.send(JSON.stringify({type:requestedRoom&&requestedRoom!=='CREATE'?'room-not-found':'room-full'}));ws.close();return}
  const ctx={ws,room,player:p,limiter:new RateLimiter(40,1000)};clients.set(ws,ctx);
  ws.send(JSON.stringify({type:'welcome',id:p.id,room:room.code,hostId:room.hostId,host:p.id===room.hostId,started:room.started,player:{id:p.id,name:p.name,character:p.character,color:p.color,x:p.x,y:p.y,state:p.state},players:room.snapshot(),objective:room.objective,event:room.event}));
  room.broadcast({type:'room-state',...room.state()});
  room.broadcast({type:'voice-users',users:[...room.players.keys()]});
  ws.on('message',raw=>{try{route(JSON.parse(raw),ctx)}catch(e){console.error(e)}});
  ws.on('close',()=>{
   const c=clients.get(ws);if(!c)return;
   const wasHost=room.hostId===p.id;
   room.remove(p.id);clients.delete(ws);
   room.broadcast({type:'player-left',id:p.id});
   room.broadcast({type:'room-state',...room.state(),hostChanged:wasHost});
   room.broadcast({type:'voice-users',users:[...room.players.keys()]});
   if(!room.players.size)rooms.rooms.delete(room.code);
  });
 });
 const timer=setInterval(()=>{rooms.tick();for(const r of rooms.rooms.values())if(r.started)r.broadcast({type:'state',players:r.snapshot(),objective:r.objective,event:r.event})},1000/20);
 wss.on('close',()=>clearInterval(timer));
 return wss;
}
