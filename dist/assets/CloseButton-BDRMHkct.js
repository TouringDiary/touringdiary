import{r,j as i,X as f}from"./index-CEyn7Etq.js";const p=({onClose:e,className:a="",variant:c="circle",size:n="md",title:d="Chiudi (ESC)"})=>{const o=r.useRef(e);r.useEffect(()=>{o.current=e},[e]),r.useEffect(()=>{const t=s=>{s.key==="Escape"&&(s.preventDefault(),s.stopPropagation(),o.current())};return window.addEventListener("keydown",t),()=>window.removeEventListener("keydown",t)},[]);const l={sm:"p-1.5",md:"p-2",lg:"p-3"},u={sm:"w-4 h-4",md:"w-5 h-5",lg:"w-6 h-6"};return i.jsx("button",{onClick:t=>{t.stopPropagation(),e()},className:`
                flex items-center justify-center
                bg-red-600 hover:bg-red-700 text-white
                shadow-lg transition-transform active:scale-95
                ${c==="circle"?"rounded-full":"rounded-xl"}
                ${l[n]}
                ${a}
            `,title:d,"aria-label":"Chiudi",children:i.jsx(f,{className:u[n]})})};export{p as C};
