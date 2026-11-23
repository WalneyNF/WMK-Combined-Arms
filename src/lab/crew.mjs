// WMK Combined Arms: gerenciamento de postos independente de Three.js e do input.
// Um posto admite no máximo um ocupante, e um soldado só ocupa um posto no mesmo veículo.
export const SEATS=Object.freeze({
  tank:Object.freeze(["driver","gunner","commander"]),
  heli:Object.freeze(["pilot","door-gunner"])
});
export function seatList(kind){return SEATS[kind]?[...SEATS[kind]]:[]}
export function normalizeCrew(kind,value){
  const result=Object.fromEntries(seatList(kind).map(s=>[s,null]));
  const used=new Set();
  for(const seat of seatList(kind)){
    const id=value?.[seat];
    if(typeof id==="string"&&/^[-a-z0-9]{1,64}$/i.test(id)&&!used.has(id)){
      result[seat]=id;used.add(id);
    }
  }
  return result;
}
export function crewSeat(crew,soldierId){
  if(!soldierId)return null;
  return Object.keys(crew||{}).find(seat=>crew[seat]===soldierId)||null;
}
export function boardCrew(kind,oldCrew,soldierId,requestedSeat){
  const seats=seatList(kind),crew=normalizeCrew(kind,oldCrew);
  if(!seats.length||!soldierId)return {ok:false,reason:"tipo ou soldado inválido",crew};
  const previous=crewSeat(crew,soldierId);
  const seat=requestedSeat||previous||seats.find(s=>!crew[s]);
  if(!seats.includes(seat))return {ok:false,reason:"posto desconhecido",crew};
  if(crew[seat]&&crew[seat]!==soldierId)return {ok:false,reason:"posto ocupado",crew};
  if(previous)crew[previous]=null;
  crew[seat]=soldierId;
  return {ok:true,seat,crew};
}
export function leaveCrew(kind,oldCrew,soldierId){
  const crew=normalizeCrew(kind,oldCrew);
  const seat=crewSeat(crew,soldierId);
  if(seat)crew[seat]=null;
  return {seat,crew};
}
export function nextAvailableSeat(kind,oldCrew,current,soldierId){
  const crew=normalizeCrew(kind,oldCrew),seats=seatList(kind);
  const at=seats.indexOf(current);
  for(let offset=1;offset<=seats.length;offset++){
    const candidate=seats[(at+offset+seats.length)%seats.length];
    if(candidate&&(crew[candidate]==null||crew[candidate]===soldierId))return candidate;
  }
  return null;
}
