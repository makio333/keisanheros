// Art is split into a hinged lid and body so the chest really opens.
export function equipmentChestMarkup(){
 return `<div class="equipment-chest-stage" aria-hidden="true">
 <div class="equipment-chest-shadow"></div><div class="equipment-chest-rays"></div>
 <svg class="equipment-chest" viewBox="0 0 192 160" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
 <defs><linearGradient id="equip-chest-wood" x2="0" y2="1"><stop stop-color="#a55b32"/><stop offset="1" stop-color="#492440"/></linearGradient><linearGradient id="equip-chest-gold" x2="0" y2="1"><stop stop-color="#fff0a0"/><stop offset=".45" stop-color="#eebd4c"/><stop offset="1" stop-color="#a65e2c"/></linearGradient></defs>
 <path d="M24 72H168V134L156 146H36L24 134Z" fill="#19182e" stroke="#111321" stroke-width="8"/>
 <path d="M32 82H160V132L152 138H40L32 132Z" fill="url(#equip-chest-wood)"/>
 <path d="M38 101H154M38 120H154" stroke="#352437" stroke-width="4"/>
 <path d="M42 80H56V138H42ZM136 80H150V138H136Z" fill="url(#equip-chest-gold)"/>
 <path d="M32 132H160V142H32Z" fill="url(#equip-chest-gold)"/>
 <path class="equipment-chest-inner" d="M31 73H161V87H31Z" fill="#fff4b5"/>
 <g class="equipment-chest-lid">
 <path d="M22 82V58L34 38H158L170 58V82Z" fill="url(#equip-chest-wood)" stroke="#111321" stroke-width="8"/>
 <path d="M30 59L40 44H152L162 59Z" fill="#c38048"/>
 <path d="M40 42H56V78H40ZM136 42H152V78H136Z" fill="url(#equip-chest-gold)"/>
 <path d="M24 73H168V85H24Z" fill="url(#equip-chest-gold)" stroke="#6a3e2c" stroke-width="3"/>
 <path d="M84 69H108V99H84Z" fill="url(#equip-chest-gold)" stroke="#241d31" stroke-width="4"/>
 <path d="M96 75L102 82L96 91L90 82Z" fill="#80edff" stroke="#295977" stroke-width="2"/>
 <path d="M65 48H126" stroke="#f3ca7d" stroke-width="3"/>
 </g></svg><div class="equipment-chest-sparkles">✦<i>✦</i><b>✦</b></div></div><div class="equipment-chest-flash" aria-hidden="true"></div>`;
}
