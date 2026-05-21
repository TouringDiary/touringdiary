import{bW as c,bH as p,c5 as l,cD as y,cE as S}from"./index-CEyn7Etq.js";const f=`
- MONUMENTI: chiesa, castello, museo, piazza, archaeology, palazzo, monumento
- CIBO: restaurant, pizzeria, trattoria, street_food, pastry, gelato, bar
- SVAGO: disco, theater, cinema, zoo, spa, stadium
- NATURA: beach_free, beach_club, park, hiking, viewpoint, lake
- SHOPPING: fashion, crafts, jewelry, souvenir
- HOTEL: hotel, bnb, resort
`,b=async(s,e,t=[],n="",o=3)=>c(async()=>{var m;if(e==="people")return[];const r=t.length>0?`ESCLUDI: ${t.join(", ")}`:"",g=y(s,e,o,n,r,f),u=((m=(await p.generateLegacy({model:"gemini-2.0-flash",contents:g,config:{responseMimeType:"application/json"}})).text)==null?void 0:m.trim())||"[]",i=JSON.parse(l(u));return e==="events"&&Array.isArray(i)?i.map(a=>({...a,rating:typeof a.rating=="number"?a.rating:0,visitors:typeof a.visitors=="number"?a.visitors:0})):i}),I=async(s,e)=>c(async()=>{var r;const t=S(s,e),o=((r=(await p.generateLegacy({model:"gemini-2.0-pro",contents:t,config:{responseMimeType:"application/json",tools:[{googleSearch:{}}]}})).text)==null?void 0:r.trim())||"{}";return JSON.parse(l(o))}),v=async(s,e)=>c(async()=>{const t=`Analizza "${s}" a "${e}". RISPONDI SOLO JSON: { "rating": 85, "visitors": 5000, "summary": "..." }`,n=await p.generateLegacy({model:"gemini-2.0-flash",contents:t,config:{responseMimeType:"application/json"}});return JSON.parse(l(n.text||"{}"))});export{v as a,I as r,b as s};
