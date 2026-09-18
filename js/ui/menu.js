const COLORS=["#55dce4","#ed5c62","#62d68b","#a879e8","#f0ce58","#f17fc5"];
export function setupUI({game,network,voice}){
 const menu=document.getElementById("menu"),hud=document.getElementById("hud"),lobby=document.getElementById("roomLobby"),chars=document.getElementById("characters"),status=document.getElementById("menuStatus");
 const lobbyCode=document.getElementById("lobbyRoomCode"),invite=document.getElementById("inviteLink"),waitCount=document.getElementById("waitCount"),waitTitle=document.getElementById("waitTitle"),waitingPlayers=document.getElementById("waitingPlayers"),playGame=document.getElementById("playGame"),hostHint=document.getElementById("hostHint"),copyInvite=document.getElementById("copyInvite"),copyStatus=document.getElementById("copyStatus");
 let selected=Number(localStorage.selectedCharacter||0);
 COLORS.forEach((c,i)=>{const d=document.createElement("button");d.className="char"+(i===selected?" selected":"");d.innerHTML=`<i style="background:${c}"></i>`;d.onclick=()=>{selected=i;document.querySelectorAll(".char").forEach(x=>x.classList.remove("selected"));d.classList.add("selected")};chars.append(d)});
 const name=document.getElementById("username");name.value=localStorage.lastUsername||"";
 function connect(room){const n=(name.value.trim()||"LumiPlayer").slice(0,16);localStorage.lastUsername=n;localStorage.selectedCharacter=selected;status.textContent=room?"Joining Room...":"Finding Players...";network.connect({username:n,character:selected,room})}
 function renderLobby(m){
  const code=network.room||m?.room||"—";const players=m?.players||[];const count=m?.count??players.length;const max=m?.max??20;
  lobbyCode.textContent=`ROOM ${code}`;waitCount.textContent=`${count} / ${max} players`;
  waitingPlayers.innerHTML="";
  players.forEach(p=>{const d=document.createElement("div");d.className="waiting-player"+(p.id===network.hostId?" host":"");d.textContent=(p.id===network.hostId?"★ ":"")+p.name;waitingPlayers.append(d)});
  const hasGuest=count>1;
  waitTitle.textContent=network.started?"GAME STARTING":"WAITING FOR PLAYERS";
  playGame.classList.toggle("hidden",!(network.isHost&&!network.started&&hasGuest));
  hostHint.textContent=network.isHost?(hasGuest?"A player joined. Start the game when you’re ready.":"Share the invite link with your friends."):"Waiting for the room host to start the game.";
 }
 function openLobby(m){
  const roomFlow=network.connectArgs?.room;
  if(!roomFlow||network.started){lobby.classList.add("hidden");hud.classList.remove("hidden");return}
  menu.classList.add("hidden");hud.classList.add("hidden");lobby.classList.remove("hidden");
  const url=new URL(location.href);url.searchParams.set("room",network.room);invite.value=url.href;history.replaceState({},"",url);
  renderLobby(m);
 }
 document.getElementById("play").onclick=()=>connect(null);
 document.getElementById("create").onclick=()=>connect("CREATE");
 document.getElementById("join").onclick=()=>document.getElementById("roomInput").classList.toggle("hidden");
 document.getElementById("joinCode").onclick=()=>{const c=document.getElementById("roomCode").value.trim().toUpperCase();if(c)connect(c)};
 network.on("welcome",m=>{openLobby(m)});
 network.on("room-state",m=>{if(!lobby.classList.contains("hidden"))renderLobby(m)});
 network.on("game-start",()=>{network.started=true;lobby.classList.add("hidden");hud.classList.remove("hidden")});
 network.on("room-full",()=>status.textContent="Room is full");
 network.on("room-not-found",()=>status.textContent="Room not found");
 network.on("error",m=>status.textContent=m.message||"Server error");
 copyInvite.onclick=async()=>{const value=invite.value;if(!value)return;try{await navigator.clipboard.writeText(value);copyStatus.textContent="Copied!"}catch{invite.focus();invite.select();copyStatus.textContent="Select the link and copy it."}setTimeout(()=>copyStatus.textContent="",2200)};
 playGame.onclick=()=>{if(network.isHost&&!network.started){playGame.disabled=true;playGame.textContent="STARTING...";network.startGame()}};
 document.getElementById("leaveRoom").onclick=()=>{network.close(true);network.connectArgs=null;lobby.classList.add("hidden");hud.classList.add("hidden");menu.classList.remove("hidden");status.textContent="Ready";const u=new URL(location.href);u.searchParams.delete("room");history.replaceState({},"",u)};
 const send=()=>{const i=document.getElementById("chatInput"),t=i.value.trim();if(t){network.chat(t);i.value=""}};document.getElementById("sendChat").onclick=send;document.getElementById("chatInput").onkeydown=e=>e.key==="Enter"&&send();
 async function mic(){const on=await voice.toggle();document.getElementById("micBtn").textContent=on?"🔊":"🎙";document.getElementById("mobileMic").textContent=on?"🔊":"🎙"}document.getElementById("micBtn").onclick=mic;document.getElementById("mobileMic").onclick=mic;
 function toggle(el){el.classList.toggle("hidden")}document.getElementById("mapBtn").onclick=()=>toggle(document.getElementById("mapOverlay"));document.getElementById("closeMap").onclick=()=>toggle(document.getElementById("mapOverlay"));document.getElementById("invBtn").onclick=()=>toggle(document.getElementById("inventoryOverlay"));document.getElementById("closeInv").onclick=()=>toggle(document.getElementById("inventoryOverlay"));document.getElementById("menuBtn").onclick=()=>toggle(menu);
 document.getElementById("jumpBtn").onpointerdown=()=>game.input.jump=true;document.getElementById("jumpBtn").onpointerup=()=>game.input.jump=false;document.getElementById("interactBtn").onclick=()=>network.interact("pulse");document.getElementById("buildBtn").onclick=()=>network.build(0);
 const joy=document.getElementById("joystick"),knob=joy.querySelector("span");function joyMove(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,l=Math.min(Math.hypot(dx,dy),34),a=Math.atan2(dy,dx);const x=Math.cos(a)*l/34,y=Math.sin(a)*l/34;knob.style.transform=`translate(${x*25}px,${y*25}px)`;game.mobileVec={x,y}}function joyEnd(){knob.style.transform="";game.mobileVec=null}joy.onpointermove=joyMove;joy.onpointerdown=e=>{joy.setPointerCapture(e.pointerId);joyMove(e)};joy.onpointerup=joyEnd;joy.onpointercancel=joyEnd;
 const roomQ=new URLSearchParams(location.search).get("room");
 if(roomQ){document.getElementById("roomCode").value=roomQ;setTimeout(()=>connect(roomQ),1250)}
 setTimeout(()=>{if(!roomQ)menu.classList.remove("hidden")},1200);
}
