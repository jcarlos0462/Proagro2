import{j as e,x as d}from"./app-BB8bKlck.js";import{c as n}from"./DashboardLayout-C-OK7Ez3.js";import{c}from"./createLucideIcon-DEBuoE9D.js";/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=c("ChevronLeft",[["path",{d:"m15 18-6-6 6-6",key:"1wnfg3"}]]);/**
 * @license lucide-react v0.400.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const i=c("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);function m({links:a}){return a.length<=3?null:e.jsx("div",{className:"flex flex-wrap justify-center gap-1 mt-6",children:a.map((r,o)=>{let t=r.label,s=null;return r.label.includes("&laquo;")?(s=e.jsx(l,{className:"w-4 h-4"}),t=""):r.label.includes("&raquo;")&&(s=e.jsx(i,{className:"w-4 h-4"}),t=""),t.includes("Previous")&&(t="",s=e.jsx(l,{className:"w-4 h-4"})),t.includes("Next")&&(t="",s=e.jsx(i,{className:"w-4 h-4"})),r.url===null?e.jsx("div",{className:n("flex items-center justify-center px-4 py-2 text-sm text-gray-400 bg-white border border-gray-200 rounded-lg cursor-not-allowed opacity-50"),children:s||e.jsx("span",{dangerouslySetInnerHTML:{__html:r.label}})},o):e.jsx(d,{href:r.url,className:n("flex items-center justify-center px-4 py-2 text-sm border rounded-lg transition-colors duration-200",r.active?"bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700":"bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"),children:s||e.jsx("span",{dangerouslySetInnerHTML:{__html:t}})},o)})})}export{l as C,m as P,i as a};
