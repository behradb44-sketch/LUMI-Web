import {Room} from './room.js';
export class RoomManager{
 constructor(){this.rooms=new Map()}
 create(started=true){let r=new Room(undefined,started);while(this.rooms.has(r.code))r=new Room(undefined,started);this.rooms.set(r.code,r);return r}
 get(c){return this.rooms.get(c)}
 join(c,p){let r;if(c==='CREATE')r=this.create(false);else if(c)r=this.get(c);else r=this.create(true);if(!r||r.players.size>=20)return null;r.add(p);return r}
 leave(r,id){if(!r)return;r.remove(id);if(!r.players.size)this.rooms.delete(r.code)}
 tick(){for(const r of this.rooms.values())r.tick()}
}
