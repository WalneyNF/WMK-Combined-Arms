// WMK Combined Arms — formação de esquadrão de bots de solo.
export const FORMATIONS=Object.freeze(["column","line","wedge"]);
export function formationOffset(index,formation="wedge",spacing=7){
  if(!Number.isInteger(index)||index<0||index>64)throw new Error("Índice de formação inválido");
  if(!FORMATIONS.includes(formation))throw new Error("Formação desconhecida");
  if(!Number.isFinite(spacing)||spacing<=0||spacing>50)throw new Error("Espaçamento inválido");
  if(formation==="column")return {right:0,back:(index+1)*spacing};
  if(formation==="line"){
    const side=index%2===0?-1:1;
    return {right:side*Math.ceil((index+1)/2)*spacing,back:spacing};
  }
  const side=index%2===0?-1:1;
  const row=Math.ceil((index+1)/2);
  return {right:side*row*spacing,back:row*spacing};
}
export function formationDestination(leader,memberIndex,formation="wedge",spacing=7){
  const offset=formationOffset(memberIndex,formation,spacing);
  const yaw=Number.isFinite(leader.yaw)?leader.yaw:0;
  if(!Number.isFinite(leader.x)||!Number.isFinite(leader.z))throw new Error("Coordenadas inválidas");
  return {
    x:leader.x+Math.cos(yaw)*offset.right+Math.sin(yaw)*offset.back,
    z:leader.z-Math.sin(yaw)*offset.right+Math.cos(yaw)*offset.back
  };
}
