// WMK Combined Arms: navegação A* em grade, sem dependências de renderização.
// Funciona com os obstáculos do mapa e circunferências de veículos estacionados.
import { BUILDINGS } from "./movement.mjs";

const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function blocked(x,z,radius=1,obstacles=[],buildings=BUILDINGS) {
  if(Math.abs(x)>256-radius||Math.abs(z)>256-radius)return true;
  for(const b of buildings)if(x>b.x-b.width/2-radius && x<b.x+b.width/2+radius &&
    z>b.z-b.depth/2-radius && z<b.z+b.depth/2+radius)return true;
  for(const o of obstacles)if((x-o.x)**2+(z-o.z)**2<(radius+o.radius)**2)return true;
  return false;
}

// Limita o mapa a 65x65 células por padrão; distância de ida não ultrapassa 512m.
// A* só roda ao mudar destino ou após um intervalo de atualização, nunca a cada frame.
export function findPath(from,to,{radius=1,cellSize=8,obstacles=[],buildings=BUILDINGS,maxNodes=4500}={}) {
  if(![from?.x,from?.z,to?.x,to?.z,cellSize,radius].every(Number.isFinite)||
      cellSize<2||cellSize>32||radius<0||radius>20)return [];
  const size=Math.floor(512/cellSize)+1,origin=-256;
  const cell=(v)=>clamp(Math.round((v-origin)/cellSize),0,size-1);
  const ix=cell(from.x),iz=cell(from.z),tx=cell(to.x),tz=cell(to.z);
  const point=(x,z)=>({x:origin+x*cellSize,z:origin+z*cellSize});
  const isBlocked=(x,z)=>blocked(origin+x*cellSize,origin+z*cellSize,radius,obstacles,buildings);
  const start=iz*size+ix,goal=tz*size+tx;
  if(isBlocked(tx,tz))return [];
  const open=[{id:start,x:ix,z:iz,g:0,f:Math.hypot(tx-ix,tz-iz)}];
  const best=new Map([[start,0]]),prev=new Map(),closed=new Set();
  const directions=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
  let used=0;
  while(open.length&&used++<maxNodes){
    let smallest=0;
    for(let i=1;i<open.length;i++)if(open[i].f<open[smallest].f)smallest=i;
    const current=open.splice(smallest,1)[0];
    if(closed.has(current.id))continue;
    if(current.id===goal){
      const route=[];let currentId=goal;
      while(currentId!==start){
        const z=Math.floor(currentId/size),x=currentId%size;
        route.push(point(x,z));currentId=prev.get(currentId);
        if(currentId==null)return [];
      }
      route.reverse();
      // O ponto de destino exato é permitido apenas se não for obstáculo.
      if(!blocked(to.x,to.z,radius,obstacles,buildings))route.push({x:to.x,z:to.z});
      return smoothPath({x:from.x,z:from.z},route,{radius,obstacles,buildings});
    }
    closed.add(current.id);
    for(const [dx,dz] of directions){
      const nx=current.x+dx,nz=current.z+dz;
      if(nx<0||nz<0||nx>=size||nz>=size||isBlocked(nx,nz))continue;
      // Não permitir atravessar cantos bloqueados em diagonais.
      if(dx&&dz&&(isBlocked(current.x+dx,current.z)||isBlocked(current.x,current.z+dz)))continue;
      const id=nz*size+nx;if(closed.has(id))continue;
      const nextG=current.g+Math.hypot(dx,dz);
      if(nextG>= (best.get(id)??Infinity))continue;
      best.set(id,nextG);prev.set(id,current.id);
      open.push({id,x:nx,z:nz,g:nextG,f:nextG+Math.hypot(tx-nx,tz-nz)});
    }
  }
  return [];
}

// Segmento livre de colisões: suavização baseada em amostragem conservadora.
export function hasLineOfSight(a,b,{radius=1,obstacles=[],buildings=BUILDINGS,step=2}={}) {
  const distance=Math.hypot(b.x-a.x,b.z-a.z);
  const n=Math.max(1,Math.ceil(distance/Math.max(.5,step)));
  for(let i=1;i<=n;i++){
    const t=i/n;
    if(blocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,radius,obstacles,buildings))return false;
  }
  return true;
}
export function smoothPath(from,points,options={}){
  if(!points.length)return [];
  const route=[];let at=from,index=0;
  while(index<points.length){
    let next=index;
    for(let j=points.length-1;j>index;j--){
      if(hasLineOfSight(at,points[j],options)){next=j;break}
    }
    const p=points[next];route.push(p);at=p;index=next+1;
  }
  return route;
}
