
(function(){
"use strict";
function D(id,g){var e=document.getElementById(id);if(e)return JSON.parse(e.textContent);return window[g]===undefined?null:window[g];}
var APP=document.querySelector("#app[data-page]"),PAGE=APP?APP.getAttribute("data-page"):"";
function unpack(o){if(!o)return [];if(Array.isArray(o))return o;var S=o.s,C=o.c;return o.r.map(function(r){return r.map(function(v,i){return C[i]?S[v]:v;});});}
var META=D("d-meta","DEQ_META"),RAWD=D("d-docs","DEQ_DOCS")||[],NAMES=D("d-names","DEQ_NAMES")||{},EV=unpack(D("d-events","DEQ_EVENTS")),PT=unpack(D("d-periods","DEQ_PERIODS")),PTCNT=(META.runClean&&META.runClean.ptCounts)||{};
var LOCAL=META.variant==="local", PORTAL=META.portal;
var $=function(s,r){return (r||document).querySelector(s);};
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function fmt(n,d){if(n==null||isNaN(n))return "";return Number(n).toLocaleString("en-US",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});}
function portalDoc(id){return PORTAL+"/documents/"+id;}

/* ---- data model ---- */
var DOCS=RAWD.map(function(r){return {id:r[0],req:r[1],title:r[2],reg:r[3],folder:r[4],sub:r[5],ext:r[6],mib:r[7],date:r[8],lp:r[9]?(META.lpre||"")+r[9]:"",have:LOCAL?!!r[10]:null};});
var DOCBY={};DOCS.forEach(function(d){DOCBY[d.id]=d;});
var EC={};META.evCols.forEach(function(c,i){EC[c]=i;});
var PC={};META.ptCols.forEach(function(c,i){PC[c]=i;});
var HAVE_EV=EV.length>0;
function facLabel(reg){if(!reg)return "(no facility folder)";var n=NAMES[reg];return reg+(n?" – "+n.name:"");}
var REQ_URL={};Object.keys(META.requests).forEach(function(k){REQ_URL[k]=PORTAL+"/requests/"+META.requests[k].request_id;});

var REASONS=["emergency_outage","maintenance","test","other"];
var RCLR={emergency_outage:"var(--rc-emergency)",maintenance:"var(--rc-maintenance)",test:"var(--rc-test)",other:"var(--rc-other)"};
function rcOf(r){return REASONS.indexOf(r)>=0?r:"other";}

/* ---- state ---- */
var TABS=PAGE?[PAGE]:["ov","map","fac","doc","run","out","spa","emi","hea","aq","tax","ele","dem","cap","lar","nei","src","met"];
var PAGEFILE={ov:"index.html",map:"map.html",fac:"facilities.html",doc:"documents.html",run:"runlogs.html",out:"outages.html",spa:"spatial.html",emi:"emissions.html",hea:"health.html",aq:"airquality.html",tax:"taxes.html",ele:"electricity.html",dem:"demographics.html",cap:"capacity.html",lar:"largeloads.html",nei:"nei.html",src:"sources.html",met:"methods.html"};
var PAGENAME={ov:"Overview",map:"Map",fac:"Facilities",doc:"Documents",run:"Run logs",out:"Outages",spa:"Spatial analysis",emi:"Emissions & wind",hea:"Health impacts",aq:"Air quality",tax:"Taxes",ele:"Electricity prices",dem:"People nearby",cap:"Capacity market",lar:"Large loads",nei:"Emissions inventory",src:"Sources",met:"Methods & sources"};
var PAGEORDER=["ov","map","fac","doc","run","out","spa","emi","hea","aq","tax","ele","dem","cap","lar","nei","src","met"];
var S={tab:PAGE||"ov",fac:"",
  doc:{q:"",req:"",ext:"",folder:"",sort:"title",dir:1,page:0},
  run:{eng:"",from:"",to:"",rc:"",sort:"date",dir:1,page:0,ptpage:0},
  facSort:{k:"docs",dir:-1}};
if(!PAGE){try{var t=localStorage.getItem("deq_tab");if(TABS.indexOf(t)>=0)S.tab=t;}catch(e){}}
(function(){var f="";try{f=localStorage.getItem("deq_fac")||"";}catch(e){}var m=/(?:^|[#&])fac=([0-9]+)/.exec(location.hash||"");if(m)f=m[1];S.fac=f;})();

/* ---- facilities ---- */
function buildFacilities(){
  var m={};
  function get(reg){var k=reg||"";if(!m[k])m[k]={reg:k,reqs:{},docs:0,types:{},mib:0,have:0,ev:0,hours:0,pt:0};return m[k];}
  DOCS.forEach(function(d){var f=get(d.reg);f.reqs[d.req]=1;f.docs++;f.types[d.ext||"?"]=(f.types[d.ext||"?"]||0)+1;f.mib+=d.mib||0;if(d.have)f.have++;});
  EV.forEach(function(r){var f=get(r[EC.facility_reg]);f.ev++;f.hours+=+r[EC.hours]||0;});
  Object.keys(PTCNT).forEach(function(k){get(k).pt=PTCNT[k];});
  return Object.keys(m).map(function(k){return m[k];});
}
var FACS=buildFacilities();

/* ---- header ---- */
function renderHeader(){
  var tot=DOCS.length,mib=DOCS.reduce(function(a,d){return a+(d.mib||0);},0);
  var h='<span><b>'+fmt(tot)+'</b> documents ('+Object.keys(META.requests).map(function(k){return esc(k)+': <b>'+fmt(META.requests[k].n)+'</b>';}).join(", ")+')</span>';
  h+='<span><b>'+fmt(FACS.filter(function(f){return f.reg;}).length)+'</b> facilities</span><span><b>'+fmt(mib/1024,1)+'</b> GiB on portal</span>';
  if(LOCAL&&META.localCoverage){var c=META.localCoverage;h+='<span>Downloaded: <b>'+fmt(c.have)+'</b> of <b>'+fmt(c.total)+'</b> ('+fmt(100*c.have/Math.max(1,c.total),1)+'%)</span>';}
  h+='<span>Run-log events: <b>'+fmt(EV.length||(META.runClean&&META.runClean.kept)||0)+'</b></span><span>Built '+esc(META.built)+'</span>';
  $("#stats").innerHTML=h;
  $("#portalLink").href=PORTAL;
}

/* ---- chip ---- */
function renderChip(){
  $("#chipHost").innerHTML=S.fac?'<span class="chip">Facility filter: '+esc(facLabel(S.fac))+' <button type="button" id="chipX" aria-label="Clear facility filter">×</button></span>':"";
  var x=$("#chipX");if(x)x.onclick=function(){setFac("");};
}
function facHash(){return S.fac?"#fac="+S.fac:"";}
function setFac(r){S.fac=r;S.doc.page=0;S.run.page=0;S.run.ptpage=0;S.run.eng="";
  try{localStorage.setItem("deq_fac",r||"");}catch(e){}try{history.replaceState(null,"",(location.pathname||"")+(location.search||"")+facHash());}catch(e){}
  renderNav();renderAll();}
function go(t){if(!PAGE){showTab(t);window.scrollTo(0,0);}else location.href=PAGEFILE[t]+facHash();}
var GROUPS=[["ov"],["Records",["doc","fac","run"]],["Grid",["out","cap","lar","ele"]],["Impacts",["emi","nei","aq","hea","dem","tax"]],["Analysis",["map","spa"]],["About",["met","src"]]];
function closeMenus(){Array.prototype.forEach.call(document.querySelectorAll("#mainnav .mg"),function(m){m.classList.remove("open");var b=m.querySelector("button");if(b)b.setAttribute("aria-expanded","false");});}
function renderNav(){var h="",nav=$("#mainnav");
  if(PAGE){nav.className="multi";
    GROUPS.forEach(function(g){if(g.length===1){h+='<a href="'+PAGEFILE[g[0]]+facHash()+'"'+(g[0]===PAGE?' aria-current="page"':'')+'>'+PAGENAME[g[0]]+'</a>';return;}
      var cur=g[1].indexOf(PAGE)>=0;
      h+='<div class="mg"><button type="button" aria-haspopup="true" aria-expanded="false"'+(cur?' aria-current="true"':'')+'>'+g[0]+' <span aria-hidden="true">▾</span></button><div class="mm" role="menu">'+g[1].map(function(k){return '<a role="menuitem" href="'+PAGEFILE[k]+facHash()+'"'+(k===PAGE?' aria-current="page"':'')+'>'+PAGENAME[k]+'</a>';}).join("")+'</div></div>';});
    nav.innerHTML=h;
    Array.prototype.forEach.call(nav.querySelectorAll(".mg"),function(m){var b=m.querySelector("button"),mm=m.querySelector(".mm");
      function open(){closeMenus();m.classList.add("open");b.setAttribute("aria-expanded","true");var r=b.getBoundingClientRect(),w=mm.offsetWidth;mm.style.top=(r.bottom)+"px";mm.style.left=Math.max(8,Math.min(r.left,window.innerWidth-w-8))+"px";}
      b.onclick=function(e){e.stopPropagation();if(m.classList.contains("open"))closeMenus();else open();};
      b.onkeydown=function(e){if(e.key==="ArrowDown"){e.preventDefault();open();var a=mm.querySelector("a");if(a)a.focus();}else if(e.key==="Escape"){closeMenus();}};
      mm.onkeydown=function(e){var as=Array.prototype.slice.call(mm.querySelectorAll("a")),i=as.indexOf(document.activeElement);
        if(e.key==="ArrowDown"){e.preventDefault();as[Math.min(as.length-1,i+1)].focus();}else if(e.key==="ArrowUp"){e.preventDefault();if(i<=0)b.focus();else as[i-1].focus();}else if(e.key==="Escape"){closeMenus();b.focus();}else if(e.key==="Tab"&&((e.shiftKey&&i===0)||(!e.shiftKey&&i===as.length-1)))closeMenus();};});
    if(!window._menuBound){window._menuBound=1;document.addEventListener("click",closeMenus);window.addEventListener("resize",closeMenus);window.addEventListener("scroll",closeMenus,true);}
  }else{h=TABS.map(function(k){return '<button role="tab" id="tab-'+k+'" data-tab="'+k+'" aria-selected="'+(k===S.tab?"true":"false")+'">'+PAGENAME[k]+'</button>';}).join("");nav.innerHTML=h;
    Array.prototype.forEach.call(nav.querySelectorAll("button"),function(b){b.onclick=function(){showTab(b.getAttribute("data-tab"));};});}}
function showTab(t){
  if(PAGE)return;S.tab=t;try{localStorage.setItem("deq_tab",t);}catch(e){}
  TABS.forEach(function(k){var e=$("#pane-"+k);if(e)e.classList.toggle("hidden",k!==t);var b=$("#tab-"+k);if(b)b.setAttribute("aria-selected",k===t?"true":"false");});
  hideTip();var pn=$("#pane-"+t);if(t==="map"&&$("#mapSvg"))drawMap();else if(pn)drawCharts(pn);
}

/* ---- helpers ---- */
function cmp(a,b){if(a==null||a==="")return b==null||b===""?0:1;if(b==null||b==="")return -1;
  if(typeof a==="number"&&typeof b==="number")return a-b;return String(a).localeCompare(String(b),undefined,{numeric:true,sensitivity:"base"});}
function opts(vals,cur,all,labeler){return '<option value="">'+esc(all)+'</option>'+vals.map(function(v){return '<option value="'+esc(v)+'"'+(v===cur?" selected":"")+'>'+esc(labeler?labeler(v):v)+'</option>';}).join("");}
function uniq(a){var s={};a.forEach(function(x){s[x]=1;});return Object.keys(s).sort(function(x,y){return cmp(x,y);});}
function th(label,key,st,num){return '<th class="'+(num?"n":"")+'" data-sort="'+key+'" tabindex="0" aria-sort="'+(st.sort===key?(st.dir>0?"ascending":"descending"):"none")+'">'+label+'</th>';}
function pager(id,page,total,per){var pages=Math.max(1,Math.ceil(total/per));var a=total?page*per+1:0,b=Math.min(total,(page+1)*per);
  return '<div class="pager"><button class="btn ghost" type="button" data-pg="'+id+'-1"'+(page<=0?" disabled":"")+'>Prev</button><span>'+fmt(a)+'–'+fmt(b)+' of '+fmt(total)+'</span><button class="btn ghost" type="button" data-pg="'+id+'+1"'+(page>=pages-1?" disabled":"")+'>Next</button></div>';}
function bindSort(pane,st,rerender,store){
  Array.prototype.forEach.call(pane.querySelectorAll("th[data-sort]"),function(h){
    function go(){var k=h.getAttribute("data-sort");if(st.sort===k)st.dir=-st.dir;else{st.sort=k;st.dir=1;}if(st.page!=null)st.page=0;rerender();}
    h.onclick=go;h.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}};});
}
function keepFocus(fn){var id=document.activeElement&&document.activeElement.id,pos=null;
  try{pos=document.activeElement.selectionStart;}catch(e){}
  fn();if(id){var el=document.getElementById(id);if(el){el.focus();try{if(pos!=null)el.setSelectionRange(pos,pos);}catch(e){}}}}

/* ---- Facilities pane ---- */
function renderFac(){
  var st=S.facSort,rows=FACS.slice().sort(function(a,b){var k=st.k,va,vb;
    if(k==="name"){va=facLabel(a.reg);vb=facLabel(b.reg);}else if(k==="reg"){va=a.reg;vb=b.reg;}else if(k==="runlogs"){va=a.ev;vb=b.ev;}
    else if(k==="county"){va=(GEOBY[a.reg]||{}).county||"";vb=(GEOBY[b.reg]||{}).county||"";}else if(k==="gens"||k==="rate"){va=+(GEOBY[a.reg]||{})[k]||0;vb=+(GEOBY[b.reg]||{})[k]||0;}else{va=a[k];vb=b[k];}
    return st.dir*cmp(va,vb);});
  var h='<p class="sub">Click a facility to filter the Documents and Run logs pages. Registration numbers come from DEQ folder names; names appear only where a source lists that registration number. County, generator count and rated kW (kilowatts, summed over the permitted generators) come from the permit layer; blank where the layer has no coordinates for that registration. "Run logs" = Y where the extraction produced dated events or period totals ('+fmt(FACS.filter(function(f){return f.reg&&(f.ev||f.pt);}).length)+' facilities).</p><div class="tw"><table><thead><tr>';
  function fh(l,k,n){return '<th class="'+(n?"n":"")+'" data-fs="'+k+'" tabindex="0" aria-sort="'+(st.k===k?(st.dir>0?"ascending":"descending"):"none")+'">'+l+'</th>';}
  h+=fh("Reg. no.","reg")+fh("Facility","name")+fh("County","county")+fh("Generators","gens",1)+fh("Rated kW","rate",1)+'<th>Request(s)</th>'+fh("Docs","docs",1)+'<th>By type</th>'+fh("MiB","mib",1)+(LOCAL?fh("Downloaded","have",1):"")+fh("Run logs","runlogs")+fh("Events","ev",1)+fh("Hours","hours",1)+'</tr></thead><tbody>';
  rows.forEach(function(f){
    var n=NAMES[f.reg],types=Object.keys(f.types).sort(function(a,b){return f.types[b]-f.types[a];}).map(function(k){return esc(k)+" "+f.types[k];}).join(", ");
    h+='<tr class="click" tabindex="0" data-reg="'+esc(f.reg)+'"><td class="mono">'+esc(f.reg||"—")+'</td><td>'+(f.reg?(n?esc(n.name)+(n.alt&&n.alt.length?'<div class="muted">also: '+esc(n.alt.join("; "))+'</div>':"")+'<div class="muted" title="'+esc(n.src)+'">name source: '+esc(n.src.replace(/ \(.*$/,""))+'</div>':'<span class="muted">name not in any source</span>'):'<span class="muted">documents not in a facility folder</span>')+'</td><td>'+(GEOBY[f.reg]?esc(GEOBY[f.reg].countyLabel||GEOBY[f.reg].county):'<span class="muted">no coordinates</span>')+'</td><td class="n">'+(GEOBY[f.reg]?fmt(GEOBY[f.reg].gens):"")+'</td><td class="n">'+(GEOBY[f.reg]?fmt(GEOBY[f.reg].rate):"")+'</td><td>'+Object.keys(f.reqs).sort().map(esc).join(", ")+'</td><td class="n">'+fmt(f.docs)+'</td><td>'+types+'</td><td class="n">'+fmt(f.mib,1)+'</td>'+(LOCAL?'<td class="n">'+fmt(f.have)+'/'+fmt(f.docs)+'</td>':"")+'<td>'+(f.ev||f.pt?'<span class="pill">Y</span>':'<span class="pill no">N</span>')+'</td><td class="n">'+fmt(f.ev)+'</td><td class="n">'+(f.ev?fmt(f.hours,1):"")+'</td></tr>';});
  h+='</tbody></table></div>';
  var p=$("#pane-fac");p.innerHTML=h;
  Array.prototype.forEach.call(p.querySelectorAll("th[data-fs]"),function(x){function go(){var k=x.getAttribute("data-fs");if(st.k===k)st.dir=-st.dir;else{st.k=k;st.dir=(k==="name"||k==="reg")?1:-1;}renderFac();}x.onclick=go;x.onkeydown=function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();go();}};});
  Array.prototype.forEach.call(p.querySelectorAll("tr.click"),function(r){function pick(){var reg=r.getAttribute("data-reg");setFac(reg);if(reg)go("doc");}r.onclick=pick;r.onkeydown=function(e){if(e.key==="Enter"){pick();}};});
}

/* ---- Documents pane ---- */
var PER=100;
function docFiltered(){var d=S.doc,q=d.q.toLowerCase();
  return DOCS.filter(function(x){
    if(S.fac&&x.reg!==S.fac)return false;if(d.req&&x.req!==d.req)return false;if(d.ext&&x.ext!==d.ext)return false;
    if(d.folder&&(x.folder||"(none)")!==d.folder)return false;
    if(q&&(x.title+" "+x.folder+" "+x.sub+" "+x.reg).toLowerCase().indexOf(q)<0)return false;return true;});}
function renderDoc(){
  var d=S.doc,all=docFiltered(),k=d.sort;
  all.sort(function(a,b){var va=k==="fac"?a.reg:a[k],vb=k==="fac"?b.reg:b[k];return d.dir*cmp(va,vb)||cmp(a.id,b.id);});
  var maxp=Math.max(0,Math.ceil(all.length/PER)-1);if(d.page>maxp)d.page=maxp;
  var rows=all.slice(d.page*PER,(d.page+1)*PER);
  var h='<div class="bar"><label>Search title / folder<input type="search" id="dq" value="'+esc(d.q)+'"></label>'+
   '<label>Request<select id="dreq">'+opts(Object.keys(META.requests),d.req,"All")+'</select></label>'+
   '<label>Facility<select id="dfac">'+opts(uniq(DOCS.map(function(x){return x.reg;}).filter(Boolean)),S.fac,"All",facLabel)+'</select></label>'+
   '<label>File type<select id="dext">'+opts(uniq(DOCS.map(function(x){return x.ext;})),d.ext,"All")+'</select></label>'+
   '<label>Folder<select id="dfolder">'+opts(uniq(DOCS.filter(function(x){return !S.fac||x.reg===S.fac;}).map(function(x){return x.folder||"(none)";})),d.folder,"All")+'</select></label></div>';
  h+=pager("d",d.page,all.length,PER)+'<div class="tw"><table><thead><tr>'+th("Title","title",d)+th("Facility","fac",d)+th("Req.","req",d)+th("Type","ext",d)+th("MiB","mib",d,1)+th("Uploaded","date",d)+'<th>Link</th></tr></thead><tbody>';
  rows.forEach(function(x){
    var links="";
    if(LOCAL){links+=x.have?'<a href="'+esc(x.lp)+'" target="_blank" rel="noopener">local file</a> · ':'<span class="pill no">not downloaded yet</span> ';}
    links+='<a href="'+esc(portalDoc(x.id))+'" target="_blank" rel="noopener">portal</a>';
    h+='<tr><td class="t">'+esc(x.title)+(x.sub?'<div class="muted">'+esc(x.folder)+' / '+esc(x.sub)+'</div>':"")+'</td><td>'+(x.reg?'<a href="#" data-fac="'+esc(x.reg)+'" class="mono">'+esc(x.reg)+'</a>'+(NAMES[x.reg]?'<div class="muted">'+esc(NAMES[x.reg].name)+'</div>':""):'<span class="muted">—</span>')+'</td><td>'+esc(x.req)+'</td><td>'+esc(x.ext)+'</td><td class="n">'+fmt(x.mib,2)+'</td><td class="mono">'+esc(x.date)+'</td><td style="white-space:nowrap">'+links+'</td></tr>';});
  if(!rows.length)h+='<tr><td colspan="7" class="muted">No documents match.</td></tr>';
  h+='</tbody></table></div>'+pager("d",d.page,all.length,PER);
  var p=$("#pane-doc");keepFocus(function(){p.innerHTML=h;});
  $("#dq").oninput=function(){d.q=this.value;d.page=0;renderDoc();};
  $("#dreq").onchange=function(){d.req=this.value;d.page=0;renderDoc();};
  $("#dfac").onchange=function(){setFac(this.value);};
  $("#dext").onchange=function(){d.ext=this.value;d.page=0;renderDoc();};
  $("#dfolder").onchange=function(){d.folder=this.value;d.page=0;renderDoc();};
  bindSort(p,d,renderDoc);
  Array.prototype.forEach.call(p.querySelectorAll("[data-pg]"),function(b){b.onclick=function(){d.page+=b.getAttribute("data-pg").slice(-2)==="+1"?1:-1;renderDoc();window.scrollTo(0,0);};});
  Array.prototype.forEach.call(p.querySelectorAll("a[data-fac]"),function(a){a.onclick=function(e){e.preventDefault();setFac(a.getAttribute("data-fac"));};});
}

/* ---- Run logs pane ---- */
function cleanNote(){var c=META.runClean;if(!c)return "";return fmt(c.raw)+" raw event rows, "+fmt(c.duplicate)+" duplicates dropped, "+fmt(c.date_implausible+c.date_out_of_range+c.date_after_file)+" with an implausible or out-of-range date, "+fmt(c.hours_gt_24)+" single events over 24 hours, "+fmt(c.negative_hours)+" with negative hours; "+fmt(c.kept)+" kept.";}
function validDate(s){return /^(19|20)\d\d-\d\d-\d\d/.test(s)&&s.slice(0,4)>="2000";}
function evFiltered(){var r=S.run;
  return EV.filter(function(x){
    if(S.fac&&x[EC.facility_reg]!==S.fac)return false;if(r.eng&&x[EC.engine_id]!==r.eng)return false;
    if(r.rc&&rcOf(x[EC.reason_class])!==r.rc)return false;
    var d=x[EC.date];if(r.from&&(!d||d<r.from))return false;if(r.to&&(!d||d>r.to+"~"))return false;return true;});}
function niceMax(v){if(v<=0)return 1;var p=Math.pow(10,Math.floor(Math.log10(v))),f=v/p;var n=f<=1?1:f<=2?2:f<=4?4:f<=8?8:10;return n*p;}
function chartMonths(ev){
  var m={};ev.forEach(function(x){var d=x[EC.date],h=+x[EC.hours];if(!validDate(d)||!h)return;var k=d.slice(0,7);var o=m[k]||(m[k]={});var c=rcOf(x[EC.reason_class]);o[c]=(o[c]||0)+h;});
  var keys=Object.keys(m).sort();if(!keys.length)return '<p class="muted">No dated events with hours in the current filter.</p>';
  // continuous month axis
  var y0=+keys[0].slice(0,4),m0=+keys[0].slice(5),y1=+keys[keys.length-1].slice(0,4),m1=+keys[keys.length-1].slice(5);
  var months=[];for(var y=y0,mo=m0;y<y1||(y===y1&&mo<=m1);){months.push(y+"-"+(mo<10?"0":"")+mo);mo++;if(mo>12){mo=1;y++;}}
  var tot=months.map(function(k){var o=m[k]||{};return REASONS.reduce(function(a,r){return a+(o[r]||0);},0);});
  var mx=niceMax(Math.max.apply(null,tot)),W=Math.max(640,months.length*6+80),H=250,L=52,R=10,T=10,B=44,iw=W-L-R,ih=H-T-B,bw=iw/months.length;
  var s='<svg class="rs" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Run-log hours per month, stacked by reason class">';
  for(var i=0;i<=4;i++){var v=mx*i/4,y=T+ih-ih*i/4;s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-6)+'" y="'+(y+3)+'" text-anchor="end">'+fmt(v,v<10&&v%1?1:0)+'</text>';}
  months.forEach(function(k,i){var o=m[k]||{},yb=T+ih,x=L+i*bw;
    ["maintenance","test","other","emergency_outage"].forEach(function(r){var v=o[r]||0;if(!v)return;var hh=ih*v/mx;yb-=hh;s+='<rect x="'+(x+bw*0.12)+'" y="'+yb+'" width="'+Math.max(1,bw*0.76)+'" height="'+hh+'" fill="'+RCLR[r]+'"><title>'+k+" "+r+": "+fmt(v,1)+' h</title></rect>';});
    if(k.slice(5)==="01"||i===0){s+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="'+(T+ih)+'" y2="'+(T+ih+4)+'"/><text x="'+x+'" y="'+(T+ih+16)+'" text-anchor="middle">'+k.slice(0,4)+'</text>';}});
  s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T+ih)+'" y2="'+(T+ih)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(T+ih)+'"/>';
  s+='<text x="'+(L+iw/2)+'" y="'+(H-6)+'" text-anchor="middle">Month of operation (calendar year ticks at January)</text><text transform="translate(12,'+(T+ih/2)+') rotate(-90)" text-anchor="middle">Hours per month</text></svg>';
  return '<div class="cs">'+s+'</div>';
}
function chartFacs(ev){
  var m={};ev.forEach(function(x){var h=+x[EC.hours];if(!h)return;var k=x[EC.facility_reg]||"?";m[k]=(m[k]||0)+h;});
  var ks=Object.keys(m).sort(function(a,b){return m[b]-m[a];}).slice(0,15);if(!ks.length)return '<p class="muted">No hours in the current filter.</p>';
  var mx=niceMax(m[ks[0]]),W=520,rh=26,L=150,R=66,T=8,B=40,H=T+ks.length*rh+B,iw=W-L-R;
  var s='<svg class="rs" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Run-log hours by facility">';
  for(var i=0;i<=4;i++){var x=L+iw*i/4;s+='<line class="gl" x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(T+ks.length*rh)+'"/><text x="'+x+'" y="'+(T+ks.length*rh+14)+'" text-anchor="middle">'+fmt(mx*i/4,mx<10?1:0)+'</text>';}
  ks.forEach(function(k,i){var y=T+i*rh,w=iw*m[k]/mx,lab=NAMES[k]?k+" "+NAMES[k].name:k;if(lab.length>24)lab=lab.slice(0,23)+"…";
    s+='<text x="'+(L-6)+'" y="'+(y+rh/2+3)+'" text-anchor="end">'+esc(lab)+'</text><rect x="'+L+'" y="'+(y+4)+'" width="'+Math.max(1,w)+'" height="'+(rh-8)+'" fill="var(--accent)"><title>'+esc(facLabel(k))+": "+fmt(m[k],1)+' h</title></rect><text x="'+(L+w+4)+'" y="'+(y+rh/2+3)+'">'+fmt(m[k],1)+'</text>';});
  s+='<line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(T+ks.length*rh)+'"/><text x="'+(L+iw/2)+'" y="'+(H-6)+'" text-anchor="middle">Total hours in filtered events</text></svg>';
  return '<div class="cs">'+s+'</div>';
}
function csvCell(v){v=v==null?"":String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
function eventsCsv(ev){
  var cols=["request","doc_id","facility_reg","engine_id","date","start_time","end_time","hours","hours_source","reason_class","reason_raw","source_file","zip_member","sheet","source_row","portal_url","notes"];
  var out=[cols.join(",")];
  ev.forEach(function(x){out.push(cols.map(function(c){return csvCell(c==="portal_url"?portalDoc(x[EC.doc_id]):x[EC[c]]);}).join(","));});
  return out.join("\n")+"\n";
}
function renderRun(){
  var p=$("#pane-run");
  if(!HAVE_EV){p.innerHTML='<div class="note"><b>Run logs not available.</b> No run-log events were found when this page was built.</div>'+(PT.length?"":"");return;}
  var r=S.run;
  var evF0=EV.filter(function(x){return !S.fac||x[EC.facility_reg]===S.fac;});
  var engines=uniq(evF0.map(function(x){return x[EC.engine_id];}).filter(Boolean));
  var ev=evFiltered(),k=r.sort;
  var sorted=ev.slice().sort(function(a,b){var va=a[EC[k]],vb=b[EC[k]];if(k==="hours")return r.dir*cmp(+va||null,+vb||null);return r.dir*cmp(va,vb);});
  var maxp=Math.max(0,Math.ceil(sorted.length/PER)-1);if(r.page>maxp)r.page=maxp;
  var rows=sorted.slice(r.page*PER,(r.page+1)*PER);
  var hrs=ev.reduce(function(a,x){return a+(+x[EC.hours]||0);},0),nh=ev.filter(function(x){return x[EC.hours]!==""&&x[EC.hours]!=null;}).length;
  var h='<div class="bar"><label>Facility<select id="rfac">'+opts(uniq(EV.map(function(x){return x[EC.facility_reg];}).filter(Boolean)),S.fac,"All",facLabel)+'</select></label>'+
   '<label>Engine<select id="reng">'+opts(engines,r.eng,"All")+'</select></label>'+
   '<label>From<input type="date" id="rfrom" value="'+esc(r.from)+'"></label><label>To<input type="date" id="rto" value="'+esc(r.to)+'"></label>'+
   '<label>Reason class<select id="rrc">'+opts(REASONS,r.rc,"All")+'</select></label>'+
   '<button class="btn" type="button" id="rcopy">Copy filtered rows as CSV</button>'+
   '</div>';
  h+='<p class="sub"><b>'+fmt(ev.length)+'</b> events, <b>'+fmt(nh)+'</b> with recorded hours, <b>'+fmt(hrs,1)+'</b> hours total. Events without hours are listed but add nothing to the charts. Duplicate copies of the same event are counted once (rows marked as duplicates in the extraction are dropped), and rows flagged as implausible are excluded: '+esc(cleanNote())+'</p><div id="csvOut"></div>';
  h+=runSummary();
  h+='<div class="legend">'+REASONS.map(function(x){return '<span><i class="sw" style="background:'+RCLR[x]+'"></i>'+x+'</span>';}).join("")+'</div>';
  h+='<div class="grid"><div class="card"><h3>Hours by month, stacked by reason class</h3>'+chartMonths(ev)+'</div><div class="card"><h3>Hours by facility</h3>'+chartFacs(ev)+'</div></div>';
  h+=runViz();
  h+='<h2>Events</h2>'+pager("r",r.page,sorted.length,PER)+'<div class="tw"><table><thead><tr>'+th("Date","date",r)+th("Facility","facility_reg",r)+th("Engine","engine_id",r)+th("Hours","hours",r,1)+th("Reason class","reason_class",r)+th("Reason (as written)","reason_raw",r)+'<th>Provenance</th></tr></thead><tbody>';
  rows.forEach(function(x){
    var did=x[EC.doc_id],doc=DOCBY[did],link="";
    if(LOCAL&&doc&&doc.have)link+='<a href="'+esc(doc.lp)+'" target="_blank" rel="noopener">local</a> · ';
    link+='<a href="'+esc(portalDoc(did))+'" target="_blank" rel="noopener">portal</a>';
    var rc=rcOf(x[EC.reason_class]);
    h+='<tr><td class="mono">'+esc(x[EC.date])+(x[EC.start_time]?'<div class="muted">'+esc(x[EC.start_time])+(x[EC.end_time]?"–"+esc(x[EC.end_time]):"")+'</div>':"")+'</td><td class="mono">'+esc(x[EC.facility_reg])+'</td><td>'+esc(x[EC.engine_id])+'</td><td class="n">'+(x[EC.hours]===""||x[EC.hours]==null?'<span class="muted">—</span>':fmt(x[EC.hours],2))+'</td><td><span class="pill rc" style="border-left:6px solid '+RCLR[rc]+'">'+esc(x[EC.reason_class]||"other")+'</span></td><td>'+esc(x[EC.reason_raw])+'</td><td class="t"><div>'+esc(x[EC.source_file])+(x[EC.zip_member]?" › "+esc(x[EC.zip_member]):"")+'</div><div class="muted">sheet '+esc(x[EC.sheet])+', row '+esc(x[EC.source_row])+' · doc '+esc(did)+' · '+link+'</div></td></tr>';});
  if(!rows.length)h+='<tr><td colspan="7" class="muted">No events match.</td></tr>';
  h+='</tbody></table></div>'+pager("r",r.page,sorted.length,PER);
  // period totals
  var pt=PT.filter(function(x){return (!S.fac||x[PC.facility_reg]===S.fac)&&(!r.eng||x[PC.engine_id]===r.eng);});
  var ppp=50,pmax=Math.max(0,Math.ceil(pt.length/ppp)-1);if(r.ptpage>pmax)r.ptpage=pmax;
  h+='<h2>Period totals ('+fmt(pt.length)+')</h2><p class="sub">Totals as written in the source workbooks (monthly, annual, rolling). Rolling totals overlap, so do not add them together.</p>';
  if(!pt.length)h+='<p class="muted">No period totals extracted.</p>';else{
  h+=pager("p",r.ptpage,pt.length,ppp)+'<div class="tw"><table><thead><tr><th>Facility</th><th>Engine</th><th>Type</th><th>Period</th><th class="n">Hours</th><th>Kind</th><th>Provenance</th></tr></thead><tbody>';
  pt.slice(r.ptpage*ppp,(r.ptpage+1)*ppp).forEach(function(x){var did=x[PC.doc_id];
    h+='<tr><td class="mono">'+esc(x[PC.facility_reg])+'</td><td>'+esc(x[PC.engine_id])+'</td><td>'+esc(x[PC.period_type])+'</td><td class="mono">'+esc(x[PC.period_start])+(x[PC.period_end]?" → "+esc(x[PC.period_end]):"")+'</td><td class="n">'+(x[PC.hours]==null||x[PC.hours]===""?"":fmt(x[PC.hours],2))+'</td><td>'+esc(x[PC.hours_kind])+'</td><td class="t"><div>'+esc(x[PC.source_file])+'</div><div class="muted">sheet '+esc(x[PC.sheet])+', row '+esc(x[PC.source_row])+' · <a href="'+esc(portalDoc(did))+'" target="_blank" rel="noopener">portal</a></div></td></tr>';});
  h+='</tbody></table></div>';}
  keepFocus(function(){p.innerHTML=h;});
  $("#rfac").onchange=function(){setFac(this.value);};
  $("#reng").onchange=function(){r.eng=this.value;r.page=0;r.ptpage=0;renderRun();};
  $("#rfrom").onchange=function(){r.from=this.value;r.page=0;renderRun();};
  $("#rto").onchange=function(){r.to=this.value;r.page=0;renderRun();};
  $("#rrc").onchange=function(){r.rc=this.value;r.page=0;renderRun();};
  $("#mixsel").onchange=function(){MIX=this.value;renderRun();};
  drawCharts(p);
  bindSort(p,r,renderRun);
  Array.prototype.forEach.call(p.querySelectorAll("[data-pg]"),function(b){b.onclick=function(){var id=b.getAttribute("data-pg"),d=id.slice(-2)==="+1"?1:-1;if(id.charAt(0)==="p")r.ptpage+=d;else r.page+=d;renderRun();};});
  $("#rcopy").onclick=function(){
    var csv=eventsCsv(evFiltered()),host=$("#csvOut");
    function fallback(msg){host.innerHTML='<div class="note">'+esc(msg)+'</div><textarea class="csv" id="csvTa" readonly aria-label="CSV rows"></textarea>';var ta=$("#csvTa");ta.value=csv;ta.focus();ta.select();}
    if(navigator.clipboard&&navigator.clipboard.writeText){
      navigator.clipboard.writeText(csv).then(function(){host.innerHTML='<div class="note">Copied '+fmt(evFiltered().length)+' rows to the clipboard.</div>';},function(){fallback("Clipboard access was refused. The CSV is below; select all and copy.");});
    }else fallback("Clipboard is not available here. The CSV is below; select all and copy.");
  };
}

/*VIZ*/
/* =====================================================================
   Visualizations (hand-written SVG, sized to the container, themed by CSS tokens)
   ===================================================================== */
var GEO=D("d-geo","DEQ_GEO")||[],LAY=D("d-layers","DEQ_LAYERS")||{lines:[],subs:[],dcs:[],notes:{lines:"",subsHIFLD:"",subsOSM:"",dcs:""}},OUTD=D("d-outages","DEQ_OUTAGES")||{},GS=D("d-geostats","DEQ_GEOSTATS"),EMI=D("d-emissions","DEQ_EMISSIONS"),HEA=D("d-health","DEQ_HEALTH"),OZ=D("d-ozone","DEQ_OZONE"),TAX=D("d-tax","DEQ_TAX"),ELE=D("d-electricity","DEQ_ELECTRICITY"),DEM=D("d-demographics","DEQ_DEMOGRAPHICS"),CAP=D("d-capacity","DEQ_CAPACITY"),LAR=D("d-large_load","DEQ_LARGE_LOAD"),NEI=D("d-nei","DEQ_NEI"),GRID=D("d-grid","DEQ_GRID"),SRC=D("d-sources","DEQ_SOURCES");
function overlays(){var o={kde:[],links:[],points:[],plumes:[],choro:[]};
  [[GS,"Spatial analysis"],[EMI,"Emissions"],[HEA,"Health"],[OZ,"Air quality"],[TAX,"Taxes"],[ELE,"Electricity"],[DEM,"People nearby"],[CAP,"Capacity market"],[LAR,"Large loads"],[NEI,"Emissions inventory"]].forEach(function(p){var d=p[0],mo=d&&d.map_overlays;
    if(mo){if(mo.kde){var k=mo.kde;k.src=p[1];o.kde.push(k);}(mo.links||[]).forEach(function(l){o.links.push(l);});(mo.points||[]).forEach(function(q){o.points.push(q);});if(mo.choropleth){var c=mo.choropleth;c.src=p[1];o.choro.push(c);}}
    ((d&&d.plumes)||[]).forEach(function(pl){o.plumes.push(pl);});});return o;}
var KINDS=[];
var GEOBY={};GEO.forEach(function(g){GEOBY[g.reg]=g;});
var CH={};   // chart name -> function(el,W)
function nowrap(s,n){s=String(s==null?"":s);return s.length>n?s.slice(0,n-1)+"…":s;}
function dayNum(s){return Date.UTC(+s.slice(0,4),+s.slice(5,7)-1,+s.slice(8,10))/864e5;}
function dayStr(n){return new Date(n*864e5).toISOString().slice(0,10);}
function ticksLin(mx,n){var a=[];for(var i=0;i<=n;i++)a.push(mx*i/n);return a;}
function head(W,H,label){return '<svg class="rs" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="'+esc(label)+'">';}
function noData(msg){return '<p class="muted">'+esc(msg)+'</p>';}
function facShort(reg){var n=(NAMES[reg]&&NAMES[reg].name)||(GEOBY[reg]&&GEOBY[reg].name)||"";return reg+(n?" "+n:"");}
var DOC_BY_REG={};DOCS.forEach(function(d){if(d.reg)DOC_BY_REG[d.reg]=(DOC_BY_REG[d.reg]||0)+1;});
var EV_BY_REG={},EV_HRS_REG={};
EV.forEach(function(r){var k=r[EC.facility_reg];if(!k)return;EV_BY_REG[k]=(EV_BY_REG[k]||0)+1;EV_HRS_REG[k]=(EV_HRS_REG[k]||0)+(+r[EC.hours]||0);});
var PT_BY_REG=PTCNT;
function hasLogs(reg){return !!(EV_BY_REG[reg]||PT_BY_REG[reg]);}

/* ---- tooltip (delegated; any element with data-tip) ---- */
var TIP=document.createElement("div");TIP.id="tip";TIP.setAttribute("role","tooltip");document.body.appendChild(TIP);
function showTip(html,x,y){TIP.innerHTML=html;TIP.style.display="block";var w=TIP.offsetWidth,h=TIP.offsetHeight,vw=window.innerWidth,vh=window.innerHeight;
  var l=x+14;if(l+w>vw-8)l=Math.max(8,x-w-14);var t=y+14;if(t+h>vh-8)t=Math.max(8,y-h-14);TIP.style.left=l+"px";TIP.style.top=t+"px";}
function hideTip(){TIP.style.display="none";}
function tipHtml(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\n/g,"<br>");}
document.addEventListener("pointermove",function(e){var el=e.target&&e.target.closest?e.target.closest("[data-hover],[data-tip]"):null;
  if(!el||el.hasAttribute("data-hover")){if(!el)hideTip();return;}showTip(tipHtml(el.getAttribute("data-tip")),e.clientX,e.clientY);});
document.addEventListener("pointerdown",function(e){var el=e.target&&e.target.closest?e.target.closest("[data-hover],[data-tip]"):null;
  if(!el)hideTip();else if(e.pointerType==="touch"&&!el.hasAttribute("data-hover"))showTip(tipHtml(el.getAttribute("data-tip")),e.clientX,e.clientY);});
document.addEventListener("scroll",hideTip,true);

/* ---- chart host drawing / resize ---- */
function drawCharts(root){
  Array.prototype.forEach.call((root||document).querySelectorAll(".ch[data-ch]"),function(el){
    var W=Math.floor(el.clientWidth);if(W<120)return;var f=CH[el.getAttribute("data-ch")];if(f)f(el,W);});
  Array.prototype.forEach.call((root||document).querySelectorAll("[data-setfac]"),function(a){a.style.cursor="pointer";a.onclick=function(){setFac(a.getAttribute("data-setfac"));};});
}
var rzT=null,lastW=0;
window.addEventListener("resize",function(){if(Math.abs(window.innerWidth-lastW)<2)return;lastW=window.innerWidth;clearTimeout(rzT);rzT=setTimeout(function(){drawCharts($("#pane-"+S.tab));},120);});
lastW=window.innerWidth;

/* ---- generic horizontal bar chart ---- */
function hbars(W,items,o){ // items:[{label,val,tip,fac,color,val2,color2}]
  o=o||{};var rh=o.rh||22,Lw=Math.min(o.lw||170,Math.round(W*0.4)),R=44,T=6,B=38,n=items.length,iw=W-Lw-R;
  var mx=niceMax(Math.max.apply(null,items.map(function(i){return (i.val||0)+(i.val2||0);}).concat([1]))),H=T+n*rh+B;
  var s=head(W,H,o.aria||"bar chart");
  for(var i=0;i<=4;i++){var x=Lw+iw*i/4;s+='<line class="gl" x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(T+n*rh)+'"/><text x="'+x+'" y="'+(T+n*rh+13)+'" text-anchor="middle">'+fmt(mx*i/4,mx<8&&mx%4?1:0)+'</text>';}
  items.forEach(function(it,i){var y=T+i*rh,w=iw*(it.val||0)/mx,w2=iw*(it.val2||0)/mx;
    var lab=nowrap(it.label,Math.max(8,Math.floor(Lw/5.6)));
    s+='<g'+(it.fac?' data-setfac="'+esc(it.fac)+'"':'')+' data-tip="'+esc(it.tip||it.label)+'"><rect x="0" y="'+y+'" width="'+W+'" height="'+rh+'" fill="transparent"/>'+
      '<text x="'+(Lw-6)+'" y="'+(y+rh/2+3.5)+'" text-anchor="end"'+(it.sel?' class="t1"':'')+'>'+esc(lab)+'</text>'+
      '<rect x="'+Lw+'" y="'+(y+3)+'" width="'+Math.max(1,w)+'" height="'+(rh-6)+'" fill="'+(it.color||"var(--accent)")+'" rx="1"/>'+
      (w2?'<rect x="'+(Lw+w)+'" y="'+(y+3)+'" width="'+Math.max(1,w2)+'" height="'+(rh-6)+'" fill="'+(it.color2||"var(--cat2)")+'" rx="1"/>':'')+
      '<text x="'+(Lw+w+w2+4)+'" y="'+(y+rh/2+3.5)+'">'+fmt((it.val||0)+(it.val2||0),it.dec||0)+'</text></g>';});
  s+='<line class="ax" x1="'+Lw+'" x2="'+Lw+'" y1="'+T+'" y2="'+(T+n*rh)+'"/><text x="'+(Lw+iw/2)+'" y="'+(H-4)+'" text-anchor="middle">'+esc(o.xlabel||"")+'</text></svg>';
  return s;
}
function legendHtml(items){return '<div class="legend">'+items.map(function(i){return '<span><i class="sw" style="background:'+i[1]+'"></i>'+esc(i[0])+'</span>';}).join("")+'</div>';}

/* ======================= OVERVIEW ======================= */
function ovDocs(){return DOCS.filter(function(d){return !S.fac||d.reg===S.fac;});}
CH.ovTypes=function(el,W){
  var m={};ovDocs().forEach(function(d){var k=d.ext||"(none)";var o=m[k]||(m[k]={});o[d.req]=(o[d.req]||0)+1;});
  var reqs=Object.keys(META.requests).sort();
  var ks=Object.keys(m).sort(function(a,b){return tot(m[b])-tot(m[a]);});function tot(o){return Object.keys(o).reduce(function(a,k){return a+o[k];},0);}
  if(!ks.length){el.innerHTML=noData("No documents.");return;}
  var items=ks.map(function(k){var a=m[k];return {label:k,val:a[reqs[0]]||0,val2:a[reqs[1]]||0,tip:"**"+k+"**\n"+reqs.map(function(r){return r+": "+fmt(a[r]||0);}).join("\n")+"\nTotal: "+fmt(tot(a))};});
  el.innerHTML=hbars(W,items,{xlabel:"Documents (count)",lw:60,aria:"Documents by file type"})+legendHtml([[reqs[0],"var(--accent)"],[reqs[1]||"",  "var(--cat2)"]].filter(function(x){return x[0];}));
};
CH.ovFacs=function(el,W){
  var m={};DOCS.forEach(function(d){var k=d.reg||"";m[k]=(m[k]||0)+1;});
  var ks=Object.keys(m).sort(function(a,b){return m[b]-m[a];}),top=ks.slice(0,14),rest=ks.slice(14);
  var items=top.map(function(k){return {label:k?facShort(k):"(not in a facility folder)",val:m[k],fac:k||null,sel:k&&k===S.fac,color:hasLogs(k)?"var(--rc-emergency)":"var(--accent)",
    tip:"**"+(k?facLabel(k):"Not in a facility folder")+"**\n"+fmt(m[k])+" documents"+(hasLogs(k)?"\nRun logs extracted (red bar)":"")+(k?"\nClick to filter all tabs":"")};});
  if(rest.length){var r=rest.reduce(function(a,k){return a+m[k];},0);items.push({label:"+"+rest.length+" more facilities",val:r,color:"var(--ink-3)",tip:rest.length+" more facilities, "+fmt(r)+" documents"});}
  el.innerHTML=hbars(W,items,{xlabel:"Documents (count)",lw:190,aria:"Documents by facility"})+legendHtml([["facility has extracted run logs","var(--rc-emergency)"],["no run logs","var(--accent)"]]);
};
CH.ovTime=function(el,W){
  var m={};ovDocs().forEach(function(d){if(!d.date)return;var o=m[d.date]||(m[d.date]={});o[d.req]=(o[d.req]||0)+1;});
  var ks=Object.keys(m).sort();if(!ks.length){el.innerHTML=noData("No upload dates.");return;}
  var d0=dayNum(ks[0])-1,d1=dayNum(ks[ks.length-1])+1,n=d1-d0+1,reqs=Object.keys(META.requests).sort();
  var L=44,R=8,T=8,B=44,H=230,iw=W-L-R,ih=H-T-B,bw=iw/n,mx=0;
  ks.forEach(function(k){var o=m[k],t=0;reqs.forEach(function(r){t+=o[r]||0;});mx=Math.max(mx,t);});mx=niceMax(mx);
  var s=head(W,H,"Documents by portal upload date");
  ticksLin(mx,4).forEach(function(v){var y=T+ih-ih*v/mx;s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-5)+'" y="'+(y+3)+'" text-anchor="end">'+fmt(v)+'</text>';});
  var cols=["var(--accent)","var(--cat2)"];
  ks.forEach(function(k){var o=m[k],x=L+(dayNum(k)-d0)*bw,yb=T+ih,tipS="**"+k+"**";reqs.forEach(function(r){tipS+="\n"+r+": "+fmt(o[r]||0);});
    reqs.forEach(function(r,i){var v=o[r]||0;if(!v)return;var h=ih*v/mx;yb-=h;s+='<rect x="'+x+'" y="'+yb+'" width="'+Math.max(2,bw*0.8)+'" height="'+h+'" fill="'+cols[i%2]+'" data-tip="'+esc(tipS)+'"/>';});});
  var step=Math.max(1,Math.ceil(n/(iw/58)));for(var d=0;d<n;d+=step){var x=L+d*bw+bw*0.4;s+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="'+(T+ih)+'" y2="'+(T+ih+4)+'"/><text x="'+x+'" y="'+(T+ih+16)+'" text-anchor="middle">'+dayStr(d0+d).slice(5)+'</text>';}
  s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T+ih)+'" y2="'+(T+ih)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(T+ih)+'"/>'+
    '<text x="'+(L+iw/2)+'" y="'+(H-4)+'" text-anchor="middle">Portal upload date, '+dayStr(d0+1).slice(0,4)+' (month-day)</text><text transform="translate(11,'+(T+ih/2)+') rotate(-90)" text-anchor="middle">Documents per day</text></svg>';
  el.innerHTML=s+legendHtml(reqs.map(function(r,i){return [r,cols[i%2]];}));
};
function monthIdx(s){return (+s.slice(0,4))*12+(+s.slice(5,7))-1;}
function monthStr(i){var y=Math.floor(i/12),m=i%12+1;return y+"-"+(m<10?"0":"")+m;}
function srcRows(){ // coverage rows: one per facility (all of its source workbooks merged)
  var m={};EV.forEach(function(r){var d=r[EC.date];if(!validDate(d))return;var reg=r[EC.facility_reg];if(S.fac&&reg!==S.fac)return;
    var o=m[reg]||(m[reg]={reg:reg,docs:{},months:{},min:d,max:d,n:0});o.docs[r[EC.doc_id]]=1;
    o.n++;if(d<o.min)o.min=d;if(d>o.max)o.max=d;var mo=d.slice(0,7),c=o.months[mo]||(o.months[mo]={h:0,em:0,n:0});c.n++;c.h+=+r[EC.hours]||0;if(rcOf(r[EC.reason_class])==="emergency_outage")c.em+=+r[EC.hours]||0;});
  return Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){return a.reg<b.reg?-1:a.reg>b.reg?1:0;});
}
function shortFile(f){return f.replace(/\.[a-z]{3,4}$/i,"").replace(/_\d{6,}$/,"").replace(/ EG Operations Run Log/i," run log").replace(/\s*\d{8}$/,"");}
CH.ovCover=function(el,W){
  var rows=srcRows();if(!rows.length){el.innerHTML=noData("No dated run-log events for this filter.");return;}
  var m0=Math.min.apply(null,rows.map(function(r){return monthIdx(r.min);})),m1=Math.max.apply(null,rows.map(function(r){return monthIdx(r.max);})),n=m1-m0+1;
  var Lw=Math.min(190,Math.round(W*0.4)),R=10,T=6,B=40,rh=22,iw=W-Lw-R,H=T+rows.length*rh+B,cw=iw/n,mxh=1;
  rows.forEach(function(r){Object.keys(r.months).forEach(function(k){mxh=Math.max(mxh,r.months[k].h);});});
  var s=head(W,H,"Run-log coverage: months with logged events, by facility");
  var y0=Math.ceil(m0/12),y1=Math.floor(m1/12),ys=Math.max(1,Math.ceil((y1-y0+1)/Math.max(2,Math.floor(iw/46))));for(var y=y0;y<=y1;y+=ys){var x=Lw+(y*12-m0)*cw;s+='<line class="gl" x1="'+x+'" x2="'+x+'" y1="'+T+'" y2="'+(T+rows.length*rh)+'"/><text x="'+x+'" y="'+(T+rows.length*rh+13)+'" text-anchor="middle">'+y+'</text>';}
  rows.forEach(function(r,i){var y=T+i*rh,nd=Object.keys(r.docs).length;
    s+='<text x="'+(Lw-6)+'" y="'+(y+rh/2+3)+'" text-anchor="end" data-setfac="'+esc(r.reg)+'" data-tip="'+esc("**"+facLabel(r.reg)+"**\n"+fmt(r.n)+" dated events in "+nd+" source workbook"+(nd===1?"":"s")+"\n"+r.min+" to "+r.max+"\nClick to filter all pages")+'">'+esc(nowrap(facShort(r.reg),Math.floor(Lw/5.6)))+'</text>';
    s+='<rect x="'+Lw+'" y="'+(y+rh/2-0.5)+'" width="'+iw+'" height="1" fill="var(--rule)"/>';
    var x0=Lw+(monthIdx(r.min)-m0)*cw,x1=Lw+(monthIdx(r.max)+1-m0)*cw;s+='<rect x="'+x0+'" y="'+(y+4)+'" width="'+(x1-x0)+'" height="'+(rh-8)+'" fill="var(--surface-2)" stroke="var(--ink-3)" stroke-width="1" rx="2"/>';
    Object.keys(r.months).sort().forEach(function(mo){var c=r.months[mo],x=Lw+(monthIdx(mo)-m0)*cw,op=0.25+0.75*Math.sqrt(Math.min(1,c.h/mxh));
      s+='<rect x="'+x+'" y="'+(y+5)+'" width="'+Math.max(1.5,cw)+'" height="'+(rh-10)+'" fill="var(--accent)" fill-opacity="'+op+'" data-tip="'+esc("**"+mo+"**\n"+facLabel(r.reg)+"\n"+fmt(c.n)+" events, "+fmt(c.h,1)+" h"+(c.em?"\nEmergency: "+fmt(c.em,1)+" h":""))+'"/>';
      if(c.em)s+='<rect x="'+x+'" y="'+(y+2)+'" width="'+Math.max(2,cw)+'" height="3" fill="var(--rc-emergency)"/>';});});
  s+='<line class="ax" x1="'+Lw+'" x2="'+(W-R)+'" y1="'+(T+rows.length*rh)+'" y2="'+(T+rows.length*rh)+'"/><text x="'+(Lw+iw/2)+'" y="'+(H-4)+'" text-anchor="middle">Month of logged operation (ticks at January)</text></svg>';
  el.innerHTML=s+legendHtml([["month with logged events (darker = more hours)","var(--accent)"],["month with emergency-class events (red cap)","var(--rc-emergency)"],["span between first and last event","var(--surface-2)"]]);
};
function emergencyDays(ev){var m={};ev.forEach(function(x){var d=x[EC.date],h=+x[EC.hours];if(!validDate(d)||!h||rcOf(x[EC.reason_class])!=="emergency_outage")return;m[d]=1;});return Object.keys(m).length;}
function renderOv(){
  var p=$("#pane-ov"),docs=ovDocs(),regsDocs={};docs.forEach(function(d){if(d.reg)regsDocs[d.reg]=1;});
  var evF=EV.filter(function(x){return !S.fac||x[EC.facility_reg]===S.fac;}),hrs=evF.reduce(function(a,x){return a+(+x[EC.hours]||0);},0);
  var emH=evF.reduce(function(a,x){return a+(rcOf(x[EC.reason_class])==="emergency_outage"?(+x[EC.hours]||0):0);},0);
  var logRegs={};evF.forEach(function(x){logRegs[x[EC.facility_reg]]=1;});Object.keys(PTCNT).forEach(function(k){if(!S.fac||k===S.fac)logRegs[k]=1;});
  var mib=docs.reduce(function(a,d){return a+(d.mib||0);},0);
  function tile(v,l,hot){return '<div class="tile'+(hot?" hot":"")+'"><b>'+v+'</b><span>'+l+'</span></div>';}
  var h='<p class="sub">Overview of everything in the two DEQ releases'+(S.fac?' for <b>'+esc(facLabel(S.fac))+'</b> (facility filter on)':'')+'. Click a facility bar to filter every tab.</p><div class="tiles">'+
   tile(fmt(docs.length),"documents"+(S.fac?"":" ("+Object.keys(META.requests).sort().map(function(k){return esc(k)+": "+fmt(docs.filter(function(d){return d.req===k;}).length);}).join(", ")+")"))+
   tile(fmt(Object.keys(regsDocs).length),"facilities with documents")+
   tile(fmt(mib/1024,1)+" GiB","size on the portal")+
   tile(fmt(Object.keys(logRegs).length),"facilities with extracted run logs")+
   tile(fmt(evF.length),"run-log events ("+fmt(evF.filter(function(x){return x[EC.hours]!==""&&x[EC.hours]!=null;}).length)+" with hours)")+
   tile(fmt(hrs,0)+" h","engine-hours in logged events")+
   tile(fmt(emH,0)+" h","emergency-class engine-hours in "+fmt(emergencyDays(evF))+" days",1)+
   (LOCAL&&META.localCoverage?tile(fmt(100*META.localCoverage.have/Math.max(1,META.localCoverage.total),1)+"%","downloaded locally ("+fmt(META.localCoverage.have)+" of "+fmt(META.localCoverage.total)+")"):"")+'</div>';
  h+='<div class="cols2"><div class="card"><h3>Documents by file type</h3><div class="ch" data-ch="ovTypes"></div></div><div class="card"><h3>Documents by facility</h3><div class="ch" data-ch="ovFacs"></div></div></div>';
  h+='<div class="card"><h3>Documents by portal upload date</h3><div class="ch" data-ch="ovTime"></div><p class="cap">Upload date is when DEQ posted the document to the NextRequest portal, not the date of the records inside it. The record dates inside the run logs are shown below.</p></div>';
  h+='<div class="card" style="margin-top:14px"><h3>Run-log coverage: which facilities have logs, and for which months</h3><div class="ch" data-ch="ovCover"></div><p class="cap">One row per facility (all of its workbooks merged). Only facilities whose workbooks contained a parseable run log appear ('+fmt(Object.keys(EV_BY_REG).length)+' with dated events; '+fmt(Object.keys(PT_BY_REG).filter(function(k){return !EV_BY_REG[k];}).length)+' more have period totals only and are not drawn here). Duplicate copies of the same event are counted once and rows flagged as implausible are excluded: '+cleanNote()+'</p></div>';
  p.innerHTML=h;drawCharts(p);
}

/* ======================= MAP ======================= */
var MAP={view:null,W:0,ext:"nova",show:{counties:true,lines:true,hifld:true,osm:false,dcs:true,labels:true,kde:false,links:false,plume:false,choro:false,"k:nei_point":true},size:"gens",only:"",plume:0,choro:0};
var KLAB={nei_point:"EPA NEI data-center point sources (2023)"};function klab(k){return KLAB[k]||k;}
var PLACES=[["Leesburg",39.1157,-77.5636,1],["Ashburn",39.0438,-77.4874,1],["Sterling",39.0062,-77.4286,1],["Herndon",38.9696,-77.3861,1],["Reston",38.9586,-77.3570,1],["Dulles Airport",38.9531,-77.4565,1],["Chantilly",38.8943,-77.4311,1],["Aldie",38.9768,-77.6428,1],["Manassas",38.7509,-77.4753,1],["Gainesville",38.7957,-77.6142,1],["Haymarket",38.8120,-77.6364,1],["Warrenton",38.7135,-77.7953,1],["Fort Belvoir",38.7160,-77.1470,1],
 ["Washington",38.9072,-77.0369,2],["Richmond",37.5407,-77.4360,2],["Fredericksburg",38.3032,-77.4605,2],["Culpeper",38.4732,-77.9966,2],["Winchester",39.1857,-78.1633,2],["Charlottesville",38.0293,-78.4767,2],["Lynchburg",37.4138,-79.1423,2],["Roanoke",37.2710,-79.9414,2],["Norfolk",36.8508,-76.2859,2],["Boydton",36.6676,-78.3875,2],["Petersburg",37.2279,-77.4019,2],["Harrisonburg",38.4496,-78.8689,2],["Bristol",36.5951,-82.1887,2],["Danville",36.5860,-79.3950,2]];
function mer(lon,lat){var x=lon*Math.PI/180,y=Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));return [x,-y];}
function mapRadius(g){if(MAP.size==="rate"){var v=+g.rate||0;return 2.5+0.75*Math.sqrt(v/1000);}var n=+g.gens||0;return 2.5+1.0*Math.sqrt(n);}
function mapKvClass(kv){return kv>=450?"500":kv>=200?"230":kv>0?"low":"na";}
function renderMap(){
  var p=$("#pane-map");
  if(!GEO.length){p.innerHTML='<div class="note">No facility coordinates were found when this page was built.</div>';return;}
  var inMap={};GEO.forEach(function(g){inMap[g.reg]=1;});
  var docRegs=Object.keys(DOC_BY_REG),missing=docRegs.filter(function(r){return !inMap[r];});
  var toggles=[["counties","County outlines"],["lines","Transmission lines"],["hifld","Substations (HIFLD copy)"],["osm","Substations (OpenStreetMap)"],["dcs","Data-center buildings, Loudoun only (OSM)"],["labels","Place labels"]];
  var OV=overlays();
  if(OV.kde.length)toggles.push(["kde",OV.kde.map(function(k){return k.label||"Density";}).join(" / ")]);
  if(OV.links.length)toggles.push(["links","Links ("+OV.links.length+")"]);
  var kc={};OV.points.forEach(function(q){var k=q.kind||"point";kc[k]=(kc[k]||0)+1;});Object.keys(kc).forEach(function(k){toggles.push(["k:"+k,esc(klab(k))+" ("+kc[k]+")"]);});
  if(OV.choro.length)toggles.push(["choro",OV.choro.map(function(c){return c.title||"Choropleth";}).join(" / ")]);
  if(OV.plumes.length)toggles.push(["plume","Plume raster"]);
  var h='<p class="sub">Backup-generator permits across Virginia from the Piedmont Environmental Council layer of DEQ air permits, over statewide transmission lines and substations and Census county outlines. No map tiles are used. Drag to pan, wheel or pinch to zoom, click a facility to filter the other pages.</p>';
  h+='<div class="tg"><label>View <select id="mext"><option value="nova"'+(MAP.ext==="nova"?" selected":"")+'>Northern Virginia</option><option value="state"'+(MAP.ext==="state"?" selected":"")+'>All Virginia sites</option></select></label>'+toggles.map(function(t){return '<label><input type="checkbox" data-mt="'+t[0]+'"'+(MAP.show[t[0]]===false||MAP.show[t[0]]===undefined&&/^k:/.test(t[0])?"":" checked")+'>'+t[1]+'</label>';}).join("")+
    (OV.choro.length>1?'<label>Shading <select id="mchoro">'+OV.choro.map(function(c,i){return '<option value="'+i+'"'+(i===MAP.choro?" selected":"")+'>'+esc(c.title||("Layer "+(i+1)))+'</option>';}).join("")+'</select></label>':"")+(OV.plumes.length>1?'<label>Plume <select id="mplume">'+OV.plumes.map(function(pl,i){return '<option value="'+i+'"'+(i===MAP.plume?" selected":"")+'>'+esc(pl.title||("Plume "+(i+1)))+'</option>';}).join("")+'</select></label>':"")+'<label>Point size = <select id="msize"><option value="gens"'+(MAP.size==="gens"?" selected":"")+'>number of generators</option><option value="rate"'+(MAP.size==="rate"?" selected":"")+'>permitted capacity (kW)</option></select></label>'+
    '<label>Show <select id="monly"><option value="">all permitted facilities</option><option value="docs"'+(MAP.only==="docs"?" selected":"")+'>facilities with documents in the releases</option><option value="logs"'+(MAP.only==="logs"?" selected":"")+'>facilities with run logs</option></select></label></div>';
  h+='<div class="mapbox"><div id="mapSvg"></div><div class="mapctl"><button type="button" id="mz-in" aria-label="Zoom in">+</button><button type="button" id="mz-out" aria-label="Zoom out">−</button><button type="button" id="mz-rs" aria-label="Reset view" style="font-size:13px">⟲</button></div></div>';
  h+='<div class="lg" id="mapLegend"></div><div id="mapSel"></div>';
  var nn=GEO.filter(function(g){return g.nova;}).length;
  h+='<p class="cap"><b>Capacity:</b> the permit-layer field <span class="mono">Total_Rate</span> is kilowatts (kW) of rated generator capacity, checked against run-log headers: CloudHQ 74155 is 345,048 Tier 2 plus 225,000 Tier 4 = 190 generators x 3,000 kW plus a 48 kW fire pump = 570,048, and Equinix 73199 is 7 x 2,000 kW = 14,000. <b>County outlines:</b> '+esc(LAY.notes.counties||"")+' <b>Grid layers:</b> '+esc(LAY.notes.lines)+' '+esc(LAY.notes.subsHIFLD)+' '+esc(LAY.notes.subsOSM)+' <b>Data-center buildings:</b> '+esc(LAY.notes.dcs)+' Place labels are hand-placed. <b>Facilities:</b> '+fmt(GEO.length)+' registrations with coordinates statewide ('+fmt(nn)+' in the Northern Virginia box; latest permit row per registration)'+(missing.length?'; '+fmt(missing.length)+' facility folders in the releases have no coordinates in that layer and are not shown ('+esc(missing.slice(0,8).join(", "))+(missing.length>8?", …":"")+').':'.')+'</p>';
  p.innerHTML=h;
  Array.prototype.forEach.call(p.querySelectorAll("input[data-mt]"),function(c){c.onchange=function(){MAP.show[c.getAttribute("data-mt")]=c.checked;drawMap();};});
  $("#mext").onchange=function(){MAP.ext=this.value;MAP.view=null;drawMap();};
  if($("#mchoro"))$("#mchoro").onchange=function(){MAP.choro=+this.value;drawMap();};
  if($("#mplume"))$("#mplume").onchange=function(){MAP.plume=+this.value;drawMap();};
  $("#msize").onchange=function(){MAP.size=this.value;drawMap();};$("#monly").onchange=function(){MAP.only=this.value;drawMap();};
  drawMap();
}
var COUNTYLAB=null;
function countyLabels(){if(COUNTYLAB)return COUNTYLAB;COUNTYLAB=[];var has={};GEO.forEach(function(g){if(g.fips)has[g.fips]=1;});
  (LAY.counties||[]).forEach(function(c){if(!has[c.f])return;var best=c.r.reduce(function(a,r){return r.length>a.length?r:a;},c.r[0]),xs=best.map(function(q){return q[0];}),ys=best.map(function(q){return q[1];});
    COUNTYLAB.push([c.n.replace(/ County$/,""),(Math.min.apply(null,xs)+Math.max.apply(null,xs))/2,(Math.min.apply(null,ys)+Math.max.apply(null,ys))/2]);});return COUNTYLAB;}
function drawMap(){
  var host=$("#mapSvg");countyLabels();if(!host)return;var W=Math.floor(host.clientWidth)||320;
  var H=Math.round(Math.max(360,Math.min(W*0.78,620)));
  var STATE=MAP.ext==="state",base=STATE?GEO:GEO.filter(function(g){return g.nova;});if(base.length<3)base=GEO;
  var pts=base.map(function(g){return mer(g.lon,g.lat);});
  function qr(i,lo,hi){var a=pts.map(function(q){return q[i];}).sort(function(u,v){return u-v;}),n=a.length;return [a[Math.floor(lo*(n-1))],a[Math.ceil(hi*(n-1))]];}
  var qlo=STATE?0:0.04,qhi=STATE?1:0.96,qx=qr(0,qlo,qhi),qy=qr(1,qlo,qhi),x0=qx[0],x1=qx[1],y0=qy[0],y1=qy[1]; // Northern Virginia view trims outlying facilities so the Ashburn-Manassas core fills the frame
  var padX=(x1-x0)*0.12,padY=(y1-y0)*0.12;x0-=padX;x1+=padX;y0-=padY;y1+=padY;
  var sc=Math.min(W/(x1-x0),H/(y1-y0)),offx=(W-(x1-x0)*sc)/2,offy=(H-(y1-y0)*sc)/2;
  function P(lon,lat){var m=mer(lon,lat);return [(m[0]-x0)*sc+offx,(m[1]-y0)*sc+offy];}
  function invLon(px){return ((px-offx)/sc+x0)*180/Math.PI;}
  function invLat(py){var y=-((py-offy)/sc+y0);return (2*Math.atan(Math.exp(y))-Math.PI/2)*180/Math.PI;}
  if(!MAP.view||MAP.W!==W||MAP.vext!==MAP.ext){MAP.vext=MAP.ext;MAP.view={k:1,x:0,y:0};MAP.W=W;}
  var V=MAP.view,kmPerPx0=(1/sc)*6371*Math.cos(39*Math.PI/180);
  var s='<svg id="msvg" viewBox="0 0 '+W+' '+H+'" width="'+W+'" height="'+H+'" role="img" aria-label="Map of Northern Virginia backup-generator facilities, transmission lines and substations"><rect width="'+W+'" height="'+H+'" fill="var(--surface-2)" fill-opacity=".55"/>';
  s+='<g id="mworld">';
  // graticule: every 0.25 degree in the Northern Virginia view, every degree statewide
  var GSTEP=STATE?1:0.25,gl='';
  for(var lo=Math.ceil(-84/GSTEP)*GSTEP;lo<=-74;lo+=GSTEP){var a=P(lo,35),b=P(lo,40.5);gl+='M'+a[0].toFixed(1)+' '+a[1].toFixed(1)+'L'+b[0].toFixed(1)+' '+b[1].toFixed(1);}
  for(var la=Math.ceil(35/GSTEP)*GSTEP;la<=40.5;la+=GSTEP){var c=P(-84,la),d=P(-74,la);gl+='M'+c[0].toFixed(1)+' '+c[1].toFixed(1)+'L'+d[0].toFixed(1)+' '+d[1].toFixed(1);}
  s+='<path d="'+gl+'" fill="none" stroke="var(--rule)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".8"/>';
  if(MAP.show.counties&&LAY.counties)LAY.counties.forEach(function(c){var d='';c.r.forEach(function(r){d+='M'+r.map(function(q){var a=P(q[0],q[1]);return a[0].toFixed(1)+' '+a[1].toFixed(1);}).join('L')+'Z';});
    s+='<path d="'+d+'" fill="transparent" stroke="var(--ink-3)" stroke-width="'+(c.va?0.9:0.5)+'" stroke-opacity="'+(c.va?0.8:0.4)+'" stroke-linejoin="round" vector-effect="non-scaling-stroke" data-tip="'+esc("**"+c.n+"**")+'"/>';});
  if(MAP.show.lines){["na","low","230","500"].forEach(function(cls){
    var d='';LAY.lines.forEach(function(l){if(mapKvClass(l.kv)!==cls)return;var q=l.c.map(function(c){var a=P(c[0],c[1]);return a[0].toFixed(1)+' '+a[1].toFixed(1);});d+='M'+q.join('L');});
    if(!d)return;var col=cls==="500"?"var(--grid-500)":cls==="230"?"var(--grid-230)":"var(--grid-low)",w=cls==="500"?2.4:cls==="230"?1.6:1.1;
    s+='<path d="'+d+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round"'+(cls==="na"?' stroke-dasharray="3 3"':'')+' opacity=".9"/>';});}
  var OV=overlays(),rgbK=cssRGB("--cat2",[176,122,18]),rgbP=cssRGB("--grid-500",[106,61,154]);
  function rast(g,rgb){var r=rasterURL(g,rgb),a=P(g.bbox[0],g.bbox[3]),b=P(g.bbox[2],g.bbox[1]);return '<image href="'+r.url+'" x="'+a[0].toFixed(1)+'" y="'+a[1].toFixed(1)+'" width="'+(b[0]-a[0]).toFixed(1)+'" height="'+(b[1]-a[1]).toFixed(1)+'" preserveAspectRatio="none" pointer-events="none"/>';}
  var CH0=null,chMin=0,chMax=1;
  if(MAP.show.choro&&OV.choro.length){CH0=OV.choro[Math.min(MAP.choro,OV.choro.length-1)];var vv=CH0.features.map(function(f){return +f.value;}).filter(function(v){return !isNaN(v);});chMin=Math.min.apply(null,vv);chMax=Math.max.apply(null,vv);
    CH0.features.forEach(function(f){var rings=(f.polygon&&typeof f.polygon[0][0]==="number")?[f.polygon]:(f.polygon||[]),d="";rings.forEach(function(r){d+="M"+r.map(function(c){var a=P(c[0],c[1]);return a[0].toFixed(1)+" "+a[1].toFixed(1);}).join("L")+"Z";});
      var fr=chMax>chMin?(f.value-chMin)/(chMax-chMin):0.5;s+='<path d="'+d+'" fill="var(--accent)" fill-opacity="'+(0.06+0.74*fr).toFixed(2)+'" stroke="var(--ink-3)" stroke-width=".6" vector-effect="non-scaling-stroke" data-tip="'+esc("**"+(f.geoid||"area")+"**\n"+fmt(f.value,Math.abs(f.value)<10&&f.value%1?2:0)+" "+(CH0.units||""))+'"/>';});}
  if(MAP.show.kde)OV.kde.forEach(function(k){s+=rast(k,rgbK);});
  if(MAP.show.plume&&OV.plumes.length)s+=rast(OV.plumes[Math.min(MAP.plume,OV.plumes.length-1)],rgbP);
  if(MAP.show.links)OV.links.forEach(function(l){var a=P(l.from[0],l.from[1]),b=P(l.to[0],l.to[1]),d='M'+a[0].toFixed(1)+' '+a[1].toFixed(1)+'L'+b[0].toFixed(1)+' '+b[1].toFixed(1);
    s+='<path d="'+d+'" stroke="var(--rc-other)" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7" fill="none"/><path d="'+d+'" stroke="transparent" stroke-width="9" vector-effect="non-scaling-stroke" fill="none" data-tip="'+esc(l.label||"link")+'"/>';});
  s+='</g><g id="mpts">';
  var items=[]; // {x,y,html builder}
  if(MAP.show.dcs)LAY.dcs.forEach(function(d){var a=P(d.x,d.y);items.push({x:a[0],y:a[1],t:'dc',tip:"**"+(d.name||"Data-center building")+"**\n"+(d.op?d.op+"\n":"")+"OpenStreetMap telecom=data_center"});});
  if(MAP.show.hifld||MAP.show.osm)LAY.subs.forEach(function(u){if(u.src==="HIFLD"&&!MAP.show.hifld)return;if(u.src==="OSM"&&!MAP.show.osm)return;var a=P(u.x,u.y);
    items.push({x:a[0],y:a[1],t:u.src==="HIFLD"?'sub':'subo',tip:"**"+(u.name||"Unnamed substation")+"**\n"+(u.kv?fmt(u.kv)+" kV\n":"")+(u.op?u.op+"\n":"")+(u.src==="HIFLD"?"HIFLD copy (third-party mirror)":"OpenStreetMap")});});
  KINDS=[];OV.points.forEach(function(q){var k=q.kind||"point";if(KINDS.indexOf(k)<0)KINDS.push(k);});
  OV.points.forEach(function(q){if(MAP.show["k:"+(q.kind||"point")]!==true)return;var a=P(q.lon,q.lat);items.push({x:a[0],y:a[1],t:'ovp',ki:KINDS.indexOf(q.kind||"point"),tip:(function(){var p=String(q.label||q.kind||"point").split(" | ");return "**"+p[0]+"**\n"+p.slice(1).join("\n")+(p.length>1?"\n":"")+klab(q.kind||"point");})()});});
  var gl2=GEO.filter(function(g){return MAP.only==="docs"?!!DOC_BY_REG[g.reg]:MAP.only==="logs"?hasLogs(g.reg):true;}).sort(function(a,b){return mapRadius(b)-mapRadius(a);});
  gl2.forEach(function(g){var a=P(g.lon,g.lat),lg=hasLogs(g.reg),dc=DOC_BY_REG[g.reg]||0;
    items.push({x:a[0],y:a[1],t:'fac',g:g,r:mapRadius(g),cls:lg?"log":dc?"doc":"none",tip:"**"+g.name+"**\nReg. "+g.reg+" · "+(g.city||"")+(g.county?", "+(g.countyLabel||g.county):"")+"\n"+fmt(g.gens)+" generators; rated total "+fmt(g.rate)+" kW\nPermit row year "+(g.year||"?")+"\n"+(dc?fmt(dc)+" documents in the releases":"No documents in the releases")+(lg?"\nRun logs: "+fmt(EV_BY_REG[g.reg]||0)+" events, "+fmt(EV_HRS_REG[g.reg]||0,0)+" h":"")+"\nClick to filter the other pages"});});
  items.forEach(function(it,i){
    if(it.t==='dc')s+='<circle data-i="'+i+'" r="1.8" fill="var(--ink-3)" fill-opacity=".55" data-tip="'+esc(it.tip)+'"/>';
    else if(it.t==='sub')s+='<rect data-i="'+i+'" width="7" height="7" x="-3.5" y="-3.5" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6" data-tip="'+esc(it.tip)+'"/>';
    else if(it.t==='ovp'){var sh=["M0 -6L6 5H-6Z","M-5 -5H5V5H-5Z","M-6 -2H-2V-6H2V-2H6V2H2V6H-2V2H-6Z","M0 -6L6 0L0 6L-6 0Z"][it.ki%4];s+='<path data-i="'+i+'" d="'+sh+'" fill="'+GC[(it.ki+2)%GC.length]+'" fill-opacity=".85" stroke="var(--surface)" stroke-width="1.2" data-tip="'+esc(it.tip)+'"/>';}
    else if(it.t==='subo')s+='<path data-i="'+i+'" d="M0 -4.5L4.5 0L0 4.5L-4.5 0Z" fill="none" stroke="var(--ink-2)" stroke-width="1.3" data-tip="'+esc(it.tip)+'"/>';
    else{var sel=it.g.reg===S.fac,fill=it.cls==="log"?"var(--accent)":it.cls==="doc"?"var(--accent-soft)":"var(--surface)",stroke=it.cls==="none"?"var(--ink-3)":"var(--accent)";
      s+='<g data-i="'+i+'" data-reg="'+esc(it.g.reg)+'" class="mf" tabindex="0" role="button" aria-label="'+esc(it.g.name+", registration "+it.g.reg)+'" data-tip="'+esc(it.tip)+'" style="cursor:pointer">'+(sel?'<circle r="'+(it.r+5)+'" fill="none" stroke="var(--focus)" stroke-width="3"/>':'')+
        '<circle r="'+it.r+'" fill="'+fill+'" fill-opacity="'+(it.cls==="none"?0.55:0.9)+'" stroke="'+stroke+'" stroke-width="'+(it.cls==="log"?2:1.5)+'"/>'+(it.cls==="log"?'<circle r="'+Math.max(1.5,it.r*0.35)+'" fill="var(--rc-emergency)"/>':'')+'</g>';}});
  s+='</g><g id="mlab"></g>';
  s+='<g id="mscale"></g></svg>';
  host.innerHTML=s;
  var svg=$("#msvg"),world=$("#mworld"),ptsG=$("#mpts"),lab=$("#mlab"),sg=$("#mscale");
  var nodes=Array.prototype.slice.call(ptsG.children);
  function apply(){
    world.setAttribute("transform","translate("+V.x+" "+V.y+") scale("+V.k+")");
    nodes.forEach(function(n){var it=items[+n.getAttribute("data-i")];n.setAttribute("transform","translate("+(it.x*V.k+V.x).toFixed(1)+" "+(it.y*V.k+V.y).toFixed(1)+")");});
    var L='';
    var boxes=[];function put(txt,x,y,st){var w=txt.length*5.4+4,bx=[x-w/2,y-10,x+w/2,y+3];if(x-w/2<2||x+w/2>W-2||y<11||y>H-14)return;for(var i=0;i<boxes.length;i++){var o=boxes[i];if(bx[0]<o[2]&&bx[2]>o[0]&&bx[1]<o[3]&&bx[3]>o[1])return;}boxes.push(bx);
      L+='<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" class="tm" style="font-size:10.5px;'+st+';paint-order:stroke;stroke:var(--surface);stroke-width:3px" pointer-events="none">'+esc(txt)+'</text>';}
    if(MAP.show.labels){PLACES.forEach(function(pl){if(pl[3]===1&&STATE&&V.k<3)return;if(pl[3]===2&&!STATE&&V.k<1.5&&pl[1]>38.5&&pl[2]>-78.3)return;var a=P(pl[2],pl[1]);put(pl[0],a[0]*V.k+V.x,a[1]*V.k+V.y,"font-style:italic");});}
    if(MAP.show.counties&&LAY.counties&&(!STATE||V.k>=2)){COUNTYLAB.forEach(function(c){var a=P(c[1],c[2]);put(c[0],a[0]*V.k+V.x,a[1]*V.k+V.y,"font-weight:600;letter-spacing:.04em;text-transform:uppercase;font-size:9px");});}
    // graticule labels
    for(var lo=-78.25;lo<=-76.75;lo+=0.25){var xx=P(lo,39)[0]*V.k+V.x;if(xx>24&&xx<W-24)L+='<text x="'+xx.toFixed(1)+'" y="'+(H-5)+'" text-anchor="middle" class="tm" pointer-events="none">'+Math.abs(lo).toFixed(2)+'°W</text>';}
    for(var la=38.75;la<=39.25;la+=0.25){var yy=P(-77.5,la)[1]*V.k+V.y;if(yy>14&&yy<H-14)L+='<text x="4" y="'+(yy-3).toFixed(1)+'" class="tm" pointer-events="none">'+la.toFixed(2)+'°N</text>';}
    lab.innerHTML=L;
    var kmpp=kmPerPx0/V.k,cand=[1,2,5,10,20,50],km=cand[0];cand.forEach(function(c){if(c/kmpp<=W*0.28)km=c;});var wpx=km/kmpp;
    sg.innerHTML='<g transform="translate(10 '+(H-26)+')" pointer-events="none"><rect x="-4" y="-12" width="'+(wpx+34)+'" height="22" fill="var(--surface)" fill-opacity=".8" rx="3"/><line x1="0" x2="'+wpx+'" y1="0" y2="0" stroke="var(--ink)" stroke-width="2"/><line x1="0" x2="0" y1="-4" y2="4" stroke="var(--ink)"/><line x1="'+wpx+'" x2="'+wpx+'" y1="-4" y2="4" stroke="var(--ink)"/><text x="'+(wpx+4)+'" y="3" style="fill:var(--ink)">'+km+' km</text></g>';
  }
  function zoomAt(f,cx,cy){var nk=Math.max(1,Math.min(40,V.k*f));f=nk/V.k;V.x=cx-(cx-V.x)*f;V.y=cy-(cy-V.y)*f;V.k=nk;clamp();apply();}
  function clamp(){var m=60;V.x=Math.min(W-m,Math.max(m-W*V.k,V.x));V.y=Math.min(H-m,Math.max(m-H*V.k,V.y));}
  function localXY(e){var r=svg.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];}
  svg.addEventListener("wheel",function(e){e.preventDefault();var q=localXY(e);zoomAt(Math.exp(-e.deltaY*(e.deltaMode?0.05:0.0016)),q[0],q[1]);},{passive:false});
  var ptr={},drag=null,pinch=null,moved=0;
  var downFac=null;
  svg.addEventListener("pointerdown",function(e){downFac=e.target.closest?e.target.closest(".mf"):null;
    ptr[e.pointerId]=localXY(e);moved=0;try{svg.setPointerCapture(e.pointerId);}catch(x){}
    var ids=Object.keys(ptr);if(ids.length===1){drag={x:ptr[e.pointerId][0],y:ptr[e.pointerId][1],vx:V.x,vy:V.y};svg.classList.add("drag");}
    else if(ids.length===2){var a=ptr[ids[0]],b=ptr[ids[1]];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),k:V.k,cx:(a[0]+b[0])/2,cy:(a[1]+b[1])/2,vx:V.x,vy:V.y};drag=null;}});
  svg.addEventListener("pointermove",function(e){if(!ptr[e.pointerId])return;var q=localXY(e);ptr[e.pointerId]=q;var ids=Object.keys(ptr);
    if(ids.length>=2&&pinch){var a=ptr[ids[0]],b=ptr[ids[1]],d=Math.hypot(a[0]-b[0],a[1]-b[1]),nk=Math.max(1,Math.min(40,pinch.k*d/Math.max(1,pinch.d))),f=nk/pinch.k,cx=(a[0]+b[0])/2,cy=(a[1]+b[1])/2;
      V.x=cx-(pinch.cx-pinch.vx)*f-(pinch.cx-cx)*0;V.x=cx-(pinch.cx-pinch.vx)*f;V.y=cy-(pinch.cy-pinch.vy)*f;V.k=nk;moved=99;clamp();apply();hideTip();}
    else if(drag){var dx=q[0]-drag.x,dy=q[1]-drag.y;moved=Math.max(moved,Math.abs(dx)+Math.abs(dy));if(moved>4){V.x=drag.vx+dx;V.y=drag.vy+dy;clamp();apply();hideTip();}}});
  function up(e){delete ptr[e.pointerId];var ids=Object.keys(ptr);if(ids.length<2)pinch=null;if(!ids.length){drag=null;svg.classList.remove("drag");}
    else if(ids.length===1){var q=ptr[ids[0]];drag={x:q[0],y:q[1],vx:V.x,vy:V.y};moved=99;}}
  svg.addEventListener("pointerup",function(e){var wasClick=moved<=4&&Object.keys(ptr).length===1;var t=downFac;downFac=null;up(e);if(wasClick&&t){e.stopPropagation();pickFac(t.getAttribute("data-reg"));}});
  svg.addEventListener("pointercancel",up);
  svg.addEventListener("keydown",function(e){var t=e.target.closest&&e.target.closest(".mf");if(t&&(e.key==="Enter"||e.key===" ")){e.preventDefault();pickFac(t.getAttribute("data-reg"));}});
  $("#mz-in").onclick=function(){zoomAt(1.6,W/2,H/2);};$("#mz-out").onclick=function(){zoomAt(1/1.6,W/2,H/2);};$("#mz-rs").onclick=function(){V.k=1;V.x=0;V.y=0;apply();};
  apply();
  // legend
  var nlog=GEO.filter(function(g){return hasLogs(g.reg);}).length,ndoc=GEO.filter(function(g){return !hasLogs(g.reg)&&DOC_BY_REG[g.reg];}).length,nnone=GEO.length-nlog-ndoc;
  function dot(f,st,sw,fo,extra){return '<svg width="18" height="18" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6" fill="'+f+'" fill-opacity="'+fo+'" stroke="'+st+'" stroke-width="'+sw+'"/>'+(extra||"")+'</svg>';}
  var lg=dot("var(--accent)","var(--accent)",2,.9,'<circle r="2.2" fill="var(--rc-emergency)"/>')+'run logs extracted ('+nlog+')';
  lg='<span>'+lg+'</span><span>'+dot("var(--accent-soft)","var(--accent)",1.5,.9)+'documents in the releases, no run logs ('+ndoc+')</span><span>'+dot("var(--surface)","var(--ink-3)",1.5,.55)+'permit listed, nothing in these releases ('+nnone+')</span>';
  var szs=MAP.size==="rate"?[[20000,"20 MW"],[100000,"100 MW"],[400000,"400 MW"],[1300000,"1.3 GW"]]:[[10,"10"],[50,"50"],[200,"200"]];
  lg+='<span>size ('+(MAP.size==="rate"?"permitted capacity, kW":"generators")+'): '+szs.map(function(z){var r=MAP.size==="rate"?2.5+0.75*Math.sqrt(z[0]/1000):2.5+Math.sqrt(z[0]);return '<svg width="'+(2*r+6)+'" height="'+(2*r+4)+'" viewBox="'+(-r-3)+' '+(-r-2)+' '+(2*r+6)+' '+(2*r+4)+'" aria-hidden="true"><circle r="'+r+'" fill="none" stroke="var(--ink-2)" stroke-width="1.3"/></svg>'+z[1];}).join(" &nbsp; ")+'</span>';
 if(MAP.show.counties)lg+='<span><svg width="26" height="10" aria-hidden="true"><rect x="1" y="1" width="24" height="8" fill="none" stroke="var(--ink-3)" stroke-width="1" rx="2"/></svg>county outline</span>';
  if(MAP.show.lines)lg+='<span><svg width="26" height="10" aria-hidden="true"><line x1="0" x2="26" y1="5" y2="5" stroke="var(--grid-500)" stroke-width="2.4"/></svg>500 kV</span><span><svg width="26" height="10" aria-hidden="true"><line x1="0" x2="26" y1="5" y2="5" stroke="var(--grid-230)" stroke-width="1.6"/></svg>230 kV</span><span><svg width="26" height="10" aria-hidden="true"><line x1="0" x2="26" y1="5" y2="5" stroke="var(--grid-low)" stroke-width="1.1"/></svg>115-138 kV</span>';
  if(MAP.show.hifld)lg+='<span><svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true"><rect x="-3.5" y="-3.5" width="7" height="7" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.6"/></svg>substation (HIFLD)</span>';
  if(MAP.show.osm)lg+='<span><svg width="12" height="12" viewBox="-6 -6 12 12" aria-hidden="true"><path d="M0 -4.5L4.5 0L0 4.5L-4.5 0Z" fill="none" stroke="var(--ink-2)" stroke-width="1.3"/></svg>substation (OSM)</span>';
  if(MAP.show.kde&&OV.kde.length)lg+='<span><i class="sw" style="background:var(--cat2);opacity:.6"></i>'+esc(OV.kde.map(function(k){return (k.label||"density")+(k.units?" ("+k.units+")":"");}).join(" / "))+'</span>';
  if(MAP.show.plume&&OV.plumes.length){var pp=OV.plumes[Math.min(MAP.plume,OV.plumes.length-1)];lg+='<span><i class="sw" style="background:var(--grid-500);opacity:.6"></i>'+esc((pp.title||"plume")+(pp.units?" ("+pp.units+")":""))+'</span>';}
  if(MAP.show.links&&OV.links.length)lg+='<span><svg width="26" height="10" aria-hidden="true"><line x1="0" x2="26" y1="5" y2="5" stroke="var(--rc-other)" stroke-width="1.2"/></svg>links</span>';
  if(CH0){var swc=[0,0.25,0.5,0.75,1].map(function(f){return '<i class="sw" style="background:var(--accent);opacity:'+(0.06+0.74*f).toFixed(2)+'"></i>';}).join("");lg+='<span>'+swc+esc((CH0.title||"")+": "+fmt(chMin,chMax<10?2:0)+" to "+fmt(chMax,chMax<10?2:0)+" "+(CH0.units||""))+'</span>';}
  KINDS.forEach(function(k,i){if(MAP.show["k:"+k]===true)lg+='<span><svg width="12" height="12" viewBox="-7 -7 14 14" aria-hidden="true"><path d="'+["M0 -6L6 5H-6Z","M-5 -5H5V5H-5Z","M-6 -2H-2V-6H2V-2H6V2H2V6H-2V2H-6Z","M0 -6L6 0L0 6L-6 0Z"][i%4]+'" fill="'+GC[(i+2)%GC.length]+'"/></svg>'+esc(klab(k))+'</span>';});
  if(MAP.show.dcs)lg+='<span><svg width="10" height="10" viewBox="-5 -5 10 10" aria-hidden="true"><circle r="2" fill="var(--ink-3)" fill-opacity=".6"/></svg>data-center building, Loudoun only (OSM)</span>';
  $("#mapLegend").innerHTML=lg;
  renderSel();
}
function pickFac(reg){setFac(S.fac===reg?"":reg);}
function renderSel(){
  var host=$("#mapSel");if(!host)return;var g=GEOBY[S.fac];
  if(!g){host.innerHTML='<p class="cap">No facility selected. Selecting one filters the Overview, Documents, Run logs and Outages pages.</p>';return;}
  var dc=DOC_BY_REG[g.reg]||0;
  host.innerHTML='<div class="selcard"><b>'+esc(g.name)+'</b> · reg. '+esc(g.reg)+' · '+esc(g.city)+(g.county?', '+esc(g.countyLabel||g.county):'')+'<br>'+fmt(g.gens)+' generators, rated total '+fmt(g.rate)+' kW, permit row year '+esc(g.year)+'. '+fmt(dc)+' documents in the releases; '+(EV_BY_REG[g.reg]?fmt(EV_BY_REG[g.reg])+' run-log events.':'no run-log events.')+
    '<br><button class="btn ghost" type="button" data-go="doc">Documents</button><button class="btn ghost" type="button" data-go="run">Run logs</button><button class="btn ghost" type="button" data-go="out">Outages</button><button class="btn ghost" type="button" data-go="ov">Overview</button><button class="btn ghost" type="button" id="selclear">Clear filter</button></div>';
  Array.prototype.forEach.call(host.querySelectorAll("[data-go]"),function(b){b.onclick=function(){showTab(b.getAttribute("data-go"));window.scrollTo(0,0);};});
  $("#selclear").onclick=function(){setFac("");};
}

/* ======================= RUN LOG ADDITIONS ======================= */
function heatFac(ev){if(S.fac)return S.fac;var m={};ev.forEach(function(x){var k=x[EC.facility_reg];m[k]=(m[k]||0)+1;});var ks=Object.keys(m).sort(function(a,b){return m[b]-m[a];});return ks[0]||"";}
CH.runHeat=function(el,W){
  var ev0=evFiltered(),fac=heatFac(ev0),ev=ev0.filter(function(x){return x[EC.facility_reg]===fac&&validDate(x[EC.date])&&+x[EC.hours]>0;});
  if(!ev.length){el.innerHTML=noData("No dated events with hours in the current filter.");return;}
  var eng={},mi0=1e9,mi1=0,mxh=0;
  ev.forEach(function(x){var e=x[EC.engine_id]||"(unnamed)",mo=x[EC.date].slice(0,7),mi=monthIdx(mo);mi0=Math.min(mi0,mi);mi1=Math.max(mi1,mi);
    var o=eng[e]||(eng[e]={tot:0,m:{}}),c=o.m[mo]||(o.m[mo]={h:0,em:0});c.h+=+x[EC.hours];o.tot+=+x[EC.hours];if(rcOf(x[EC.reason_class])==="emergency_outage")c.em+=+x[EC.hours];mxh=Math.max(mxh,c.h);});
  var names=Object.keys(eng).sort(function(a,b){return cmp(a,b);}),n=mi1-mi0+1,Lw=Math.min(78,Math.round(W*0.2)),R=8,iw=W-Lw-R,cw=iw/n,rh=9,TH=26,Hb=names.length*rh+4;
  var ax=head(W,TH,"Month axis");for(var y=Math.ceil(mi0/12);y<=Math.floor(mi1/12);y++){var x=Lw+(y*12-mi0)*cw;ax+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="14" y2="22"/><text x="'+x+'" y="11" text-anchor="middle">'+y+'</text>';}
  ax+='<text x="'+(Lw-6)+'" y="21" text-anchor="end">engine</text></svg>';
  var b=head(W,Hb,"Heatmap of engine operating hours by month for "+facLabel(fac));
  names.forEach(function(e,i){var y=i*rh+2;b+='<text x="'+(Lw-5)+'" y="'+(y+rh-1.5)+'" text-anchor="end" style="font-size:8.5px">'+esc(nowrap(e,14))+'</text>';
    Object.keys(eng[e].m).forEach(function(mo){var c=eng[e].m[mo],x=Lw+(monthIdx(mo)-mi0)*cw,op=0.18+0.82*Math.sqrt(c.h/mxh);
      b+='<rect x="'+x+'" y="'+y+'" width="'+Math.max(1.5,cw-0.4)+'" height="'+(rh-1)+'" fill="'+(c.em>0?"var(--rc-emergency)":"var(--accent)")+'" fill-opacity="'+(c.em>0?Math.max(.55,op):op)+'" data-tip="'+esc("**"+e+" · "+mo+"**\n"+fmt(c.h,1)+" h total"+(c.em?"\n"+fmt(c.em,1)+" h emergency-class":""))+'"/>';});});
  b+='</svg>';
  el.innerHTML='<p class="cap" style="margin:0 0 6px">Showing <b>'+esc(facLabel(fac))+'</b>'+(S.fac?'':' (largest facility; pick another above)')+': '+names.length+' engines. Cell shade = operating hours that month (square-root scale, darkest = '+fmt(mxh,1)+' h); red cells include emergency-class hours. Engine ids are as written in the logs.</p>'+ax+'<div class="hm" tabindex="0" aria-label="Scrollable heatmap">'+b+'</div>'+
    legendHtml([["hours in month (teal, darker = more)","var(--accent)"],["month with emergency-class hours","var(--rc-emergency)"]]);
};
var MIX="hours";
CH.runMix=function(el,W){
  var ev=evFiltered().filter(function(x){return validDate(x[EC.date]);}),m={},yrs={};
  ev.forEach(function(x){var y=x[EC.date].slice(0,4),c=rcOf(x[EC.reason_class]),h=MIX==="events"?1:(+x[EC.hours]||0);if(MIX!=="events"&&!(+x[EC.hours]>0))return;var o=m[y]||(m[y]={});o[c]=(o[c]||0)+h;yrs[y]=1;});
  var ys=Object.keys(yrs).sort();if(!ys.length){el.innerHTML=noData("Nothing to show for this filter.");return;}
  var pct=MIX==="share",L=48,R=8,T=8,B=44,H=250,iw=W-L-R,ih=H-T-B,bw=iw/ys.length,mx=1;
  if(!pct)ys.forEach(function(y){mx=Math.max(mx,REASONS.reduce(function(a,r){return a+(m[y][r]||0);},0));});mx=pct?100:niceMax(mx);
  var s=head(W,H,"Reason mix by year");
  ticksLin(mx,4).forEach(function(v){var y=T+ih-ih*v/mx;s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-5)+'" y="'+(y+3)+'" text-anchor="end">'+fmt(v,v<10&&v%1?1:0)+(pct?"%":"")+'</text>';});
  ys.forEach(function(y,i){var o=m[y],tot=REASONS.reduce(function(a,r){return a+(o[r]||0);},0),x=L+i*bw,yb=T+ih;
    ["maintenance","test","other","emergency_outage"].forEach(function(r){var v=o[r]||0;if(!v)return;var vv=pct?100*v/tot:v,h=ih*vv/mx;yb-=h;
      s+='<rect x="'+(x+bw*0.14)+'" y="'+yb+'" width="'+(bw*0.72)+'" height="'+h+'" fill="'+RCLR[r]+'" data-tip="'+esc("**"+y+" · "+r+"**\n"+fmt(v,MIX==="events"?0:1)+(MIX==="events"?" events":" h")+(pct?" ("+fmt(vv,1)+"%)":"")+"\nYear total: "+fmt(tot,MIX==="events"?0:1))+'"/>';});
    s+='<text x="'+(x+bw/2)+'" y="'+(T+ih+15)+'" text-anchor="middle">'+y+'</text>';});
  s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T+ih)+'" y2="'+(T+ih)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(T+ih)+'"/><text x="'+(L+iw/2)+'" y="'+(H-4)+'" text-anchor="middle">Calendar year of operation</text><text transform="translate(11,'+(T+ih/2)+') rotate(-90)" text-anchor="middle">'+(pct?"Share of hours (%)":MIX==="events"?"Events (count)":"Engine-hours")+'</text></svg>';
  el.innerHTML=s+legendHtml(REASONS.map(function(r){return [r,RCLR[r]];}));
};
function dayAgg(ev){
  var m={};ev.forEach(function(x){var d=x[EC.date],h=+x[EC.hours];if(!validDate(d)||!(h>0))return;var o=m[d]||(m[d]={emE:{},emH:0,otE:{},otH:0,raw:{}}),e=x[EC.facility_reg]+"|"+(x[EC.engine_id]||"?");
    if(rcOf(x[EC.reason_class])==="emergency_outage"){o.emE[e]=1;o.emH+=h;o.raw[x[EC.reason_raw]||"?"]=1;}else{o.otE[e]=1;o.otH+=h;}});return m;}
function cnt(o){return Object.keys(o).length;}
CH.runDaily=function(el,W){
  var ev=evFiltered(),A=dayAgg(ev),ks=Object.keys(A).sort();if(!ks.length){el.innerHTML=noData("No dated events with hours in the current filter.");return;}
  var d0=dayNum(ks[0])-3,d1=dayNum(ks[ks.length-1])+3,n=d1-d0+1,L=44,R=10,T=12,B=40,H=250,iw=W-L-R,ih=H-T-B,mx=1;
  ks.forEach(function(k){var a=A[k];mx=Math.max(mx,cnt(a.emE)+cnt(a.otE));});mx=niceMax(mx);
  var s=head(W,H,"Engines running per day"),sw=Math.max(1,Math.min(6,iw/n*0.9));
  niceTicks(0,mx,4).forEach(function(v){var y=T+ih-ih*v/mx;s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-5)+'" y="'+(y+3)+'" text-anchor="end">'+fmt(v)+'</text>';});
  function X(d){return L+(d-d0+0.5)*iw/n;}
  var pm="",pe="";ks.forEach(function(k){var a=A[k],x=X(dayNum(k)).toFixed(1),no=cnt(a.otE),ne=cnt(a.emE);if(no)pm+='M'+x+' '+(T+ih)+'V'+(T+ih-ih*no/mx).toFixed(1);if(ne)pe+='M'+x+' '+(T+ih-ih*no/mx).toFixed(1)+'V'+(T+ih-ih*(no+ne)/mx).toFixed(1);});
  s+='<path d="'+pm+'" stroke="var(--rc-maintenance)" stroke-width="'+sw+'" fill="none"/><path d="'+pe+'" stroke="var(--rc-emergency)" stroke-width="'+Math.max(sw,1.6)+'" fill="none"/>';
  var big=ks.filter(function(k){return cnt(A[k].emE)>=8;}).sort(function(a,b){return cnt(A[b].emE)-cnt(A[a].emE);}).slice(0,4);
  big.forEach(function(k,i){var a=A[k],x=X(dayNum(k)),y=T+ih-ih*(cnt(a.emE)+cnt(a.otE))/mx;
    s+='<circle cx="'+x+'" cy="'+y+'" r="8" fill="none" stroke="var(--rc-emergency)" stroke-width="1.6"/><text x="'+x+'" y="'+(y+3.5)+'" text-anchor="middle" class="t1" style="fill:var(--rc-emergency)">'+(i+1)+'</text>';});
  var y0=new Date(d0*864e5).getUTCFullYear(),y1=new Date(d1*864e5).getUTCFullYear(),ystep=Math.max(1,Math.ceil((y1-y0+1)/(iw/50)));
  for(var y=y0;y<=y1;y++){var dd=dayNum(y+"-01-01");if(dd<d0||dd>d1||(y-y0)%ystep)continue;var x=X(dd);s+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="'+(T+ih)+'" y2="'+(T+ih+4)+'"/><text x="'+x+'" y="'+(T+ih+16)+'" text-anchor="middle">'+y+'</text>';}
  s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T+ih)+'" y2="'+(T+ih)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(T+ih)+'"/><text x="'+(L+iw/2)+'" y="'+(H-4)+'" text-anchor="middle">Date of logged operation (log dates, local)</text><text transform="translate(11,'+(T+ih/2)+') rotate(-90)" text-anchor="middle">Distinct engines running</text>';
  s+='<line id="rdx" y1="'+T+'" y2="'+(T+ih)+'" stroke="var(--ink)" stroke-width="1" style="display:none" pointer-events="none"/><rect data-hover="1" x="'+L+'" y="'+T+'" width="'+iw+'" height="'+ih+'" fill="transparent"/></svg>';
  el.innerHTML=s+legendHtml([["engines running for emergency-class reasons","var(--rc-emergency)"],["engines running for test, maintenance or other reasons","var(--rc-maintenance)"]])+(big.length?'<p class="cap"><b>Circled days:</b> '+big.map(function(k,i){return (i+1)+'. '+k+': '+cnt(A[k].emE)+' engines, '+fmt(A[k].emH,0)+' engine-hours';}).join(' · ')+'</p>':'')+'<p class="cap">An engine counts on a day if one of its logged events that day has recorded hours above zero. Events without hours are not counted.</p>';
  var svg=el.querySelector("svg"),hov=svg.querySelector("[data-hover]"),cur=svg.querySelector("#rdx");
  function mv(e){var r=svg.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,di=Math.round((px-L)/iw*n-0.5),d=d0+di,k=dayStr(d),a=A[k];cur.setAttribute("x1",X(d));cur.setAttribute("x2",X(d));cur.style.display="";
    showTip("<b>"+k+"</b><br>"+(a?cnt(a.emE)+" engines emergency-class ("+fmt(a.emH,1)+" h)<br>"+cnt(a.otE)+" engines other reasons ("+fmt(a.otH,1)+" h)"+(cnt(a.emE)?"<br>"+esc(Object.keys(a.raw).join("; ")):""):"no logged operation"),e.clientX,e.clientY);}
  hov.addEventListener("pointermove",mv);hov.addEventListener("pointerdown",mv);hov.addEventListener("pointerleave",function(){cur.style.display="none";hideTip();});
};
function runSummary(){
  var m={};EV.forEach(function(x){var reg=x[EC.facility_reg];if(!reg)return;var o=m[reg]||(m[reg]={reg:reg,n:0,h:0,em:0,emd:{},eng:{},min:"",max:""}),d=x[EC.date],h=+x[EC.hours]||0;o.n++;o.h+=h;o.eng[x[EC.engine_id]||"?"]=1;
    if(rcOf(x[EC.reason_class])==="emergency_outage"){o.em+=h;if(h>0&&validDate(d))o.emd[d]=1;}if(validDate(d)){if(!o.min||d<o.min)o.min=d;if(!o.max||d>o.max)o.max=d;}});
  var ptOnly={};Object.keys(PTCNT).forEach(function(k){if(!m[k])ptOnly[k]=PTCNT[k];});
  var rows=Object.keys(m).map(function(k){return m[k];}).sort(function(a,b){return b.h-a.h;});
  var h='<h2>Facilities with run logs</h2><div class="tw"><table><thead><tr><th>Facility</th><th>County</th><th class="n">Events</th><th class="n">Engines</th><th class="n">Engine-hours</th><th class="n">Emergency-class hours</th><th class="n">Emergency days</th><th>First to last event</th></tr></thead><tbody>';
  rows.forEach(function(o){var g=GEOBY[o.reg];h+='<tr class="click'+(o.reg===S.fac?'" aria-selected="true':'')+'" data-setfac="'+esc(o.reg)+'"><td>'+esc(facLabel(o.reg))+'</td><td>'+(g?esc(g.countyLabel||g.county):'<span class="muted">n/a</span>')+'</td><td class="n">'+fmt(o.n)+'</td><td class="n">'+fmt(Object.keys(o.eng).length)+'</td><td class="n">'+fmt(o.h,0)+'</td><td class="n">'+fmt(o.em,0)+'</td><td class="n">'+fmt(Object.keys(o.emd).length)+'</td><td class="mono">'+esc(o.min)+' to '+esc(o.max)+'</td></tr>';});
  h+='</tbody></table></div><p class="cap">Click a row to filter this page to that facility.'+(Object.keys(ptOnly).length?' Period totals only, no dated events: '+Object.keys(ptOnly).sort().map(function(k){return esc(facLabel(k))+" ("+fmt(ptOnly[k])+" rows)";}).join("; ")+'.':'')+'</p>';
  return h;
}
function runViz(){
  return '<h2>Run-log charts</h2><div class="card"><h3>Engine × month heatmap</h3><div class="ch" data-ch="runHeat"></div></div>'+
   '<div class="cols2"><div class="card"><h3>Reason mix by year <select id="mixsel" class="sel" aria-label="Measure"><option value="hours"'+(MIX==="hours"?" selected":"")+'>engine-hours</option><option value="events"'+(MIX==="events"?" selected":"")+'>event count</option><option value="share"'+(MIX==="share"?" selected":"")+'>share of hours</option></select></h3><div class="ch" data-ch="runMix"></div></div>'+
   '<div class="card"><h3>Engines running per day (multi-engine emergency days stand out)</h3><div class="ch" data-ch="runDaily"></div></div></div>';
}

/* ======================= OUTAGES ======================= */
var OS={fips:"",year:"",metric:"max",scale:"lin",thr:1000,sort:"date",dir:1};
function outFacs(){var m={};EV.forEach(function(x){var r=x[EC.facility_reg];if(r&&GEOBY[r]&&OUTD[GEOBY[r].fips])m[r]=1;});return Object.keys(m).sort();}
function outFac(){var l=outFacs();if(S.fac&&l.indexOf(S.fac)>=0)return S.fac;return l.indexOf("74155")>=0?"74155":l[0]||"";}
function outDay(o,k){var i=dayNum(k)-dayNum(o.start);if(i<0||i>=o.max.length)return null;return {max:o.max[i],ch:o.ch[i],snaps:o.snaps[i]};}
function emDaysFor(fac){var m={};EV.forEach(function(x){if(x[EC.facility_reg]!==fac)return;var d=x[EC.date],h=+x[EC.hours];if(!validDate(d)||!(h>0)||rcOf(x[EC.reason_class])!=="emergency_outage")return;
  var o=m[d]||(m[d]={date:d,h:0,eng:{},raw:{}});o.h+=h;o.eng[x[EC.engine_id]||"?"]=1;o.raw[x[EC.reason_raw]||"?"]=1;});return m;}
CH.outMain=function(el,W){
  var fac=outFac(),g=GEOBY[fac],o=g&&OUTD[g.fips];if(!o){el.innerHTML=noData("No outage series for this facility.");return;}
  var A=dayAgg(EV.filter(function(x){return x[EC.facility_reg]===fac;})),ks=Object.keys(A).sort();if(!ks.length){el.innerHTML=noData("No run-log days.");return;}
  var from=dayNum(ks[0])-10,to=dayNum(ks[ks.length-1])+10;
  if(OS.year){from=Math.max(from,dayNum(OS.year+"-01-01"));to=Math.min(to,dayNum(OS.year+"-12-31"));}
  if(to<from){el.innerHTML=noData("No run-log days in "+OS.year+" for this facility.");return;}
  var n=to-from+1,L=54,R=10,T1=10,H1=170,gap=34,H2=100,T2=T1+H1+gap,B=36,H=T2+H2+B,iw=W-L-R,o0=dayNum(o.start);
  function val(d){var i=d-o0;if(i<0||i>=o.max.length)return 0;return OS.metric==="ch"?o.ch[i]:o.max[i];}
  function tf(v){return OS.scale==="sqrt"?Math.sqrt(v):v;}
  var mx1=1,d;for(d=from;d<=to;d++)mx1=Math.max(mx1,tf(val(d)));
  var rawMax=OS.scale==="sqrt"?mx1*mx1:mx1,nm=niceMax(rawMax),mt=tf(nm),mx2=1;
  for(d=from;d<=to;d++){var a0=A[dayStr(d)];if(a0)mx2=Math.max(mx2,a0.emH+a0.otH);}mx2=niceMax(mx2);
  function X(d){return L+(d-from+0.5)*iw/n;}
  var sw=Math.max(1,iw/n*0.9),s=head(W,H,"County customers out and emergency generator runs on a shared time axis");
  ticksLin(1,4).forEach(function(f){var v=OS.scale==="sqrt"?nm*f*f:nm*f,y=T1+H1-H1*f;s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-5)+'" y="'+(y+3)+'" text-anchor="end">'+fmt(v,v<10&&v%1?1:0)+'</text>';});
  var gridLeg=[];
  if(GRID){(GRID.orders||[]).forEach(function(r){if(!r.start||!/data-center/.test(r.type))return;var a=Math.max(from,dayNum(r.start)),b=Math.min(to,dayNum(r.end||r.start));if(b<a)return;
      s+='<rect x="'+X(a-0.5)+'" y="'+T1+'" width="'+Math.max(2,X(b+0.5)-X(a-0.5))+'" height="'+(T2+H2-T1)+'" fill="var(--cat2)" fill-opacity=".22" data-tip="'+esc("**DOE 202(c) "+r.order+"**\n"+r.start+" to "+r.end+"\n"+r.entity)+'"/>';gridLeg[0]=1;});
    var placed=[],lblW=function(t){return t.length*5.9+6;};
    (GRID.pjm_events||[]).slice().sort(function(a,b){return a.date<b.date?-1:1;}).forEach(function(r){var dd=dayNum(r.date);if(dd<from||dd>to)return;var x=X(dd),txt="PJM "+fmt(r.mw)+" MW",w=lblW(txt),row=0,rt=x+5+w>W-R,tries=0,x0,x1,y,ok;
      do{x0=rt?x-5-w:x+5;x1=x0+w;y=T1+12+row*13;ok=!placed.some(function(b){return b.row===row&&x0<b.x1+3&&x1>b.x0-3;});if(!ok){row++;if(row>3){row=0;rt=!rt;tries++;}}}while(!ok&&tries<2);
      placed.push({x0:x0,x1:x1,row:row});
      s+='<line x1="'+x+'" x2="'+x+'" y1="'+T1+'" y2="'+(T2+H2)+'" stroke="var(--cat2)" stroke-width="2" stroke-dasharray="5 3"/><path d="M'+x+' '+(T1+2)+'l-6 -2h12z" fill="var(--cat2)"/><text x="'+(rt?x-5:x+5)+'" y="'+y+'" text-anchor="'+(rt?"end":"start")+'" class="t1" style="fill:var(--cat2);paint-order:stroke;stroke:var(--surface);stroke-width:3px;stroke-linejoin:round">'+txt+'</text><rect x="'+(x-4)+'" y="'+T1+'" width="8" height="'+(T2+H2-T1)+'" fill="transparent" data-tip="'+esc("**PJM large-load transfer "+r.date+"**\n"+r.text+"\n"+r.region)+'"/>';gridLeg[1]=1;});}
  var gp="";for(d=from;d<=to;d++){var i=d-o0;if(i>=0&&i<o.snaps.length&&o.snaps[i]<86)gp+='M'+X(d).toFixed(1)+' '+(T1+H1)+'v-6';}
  var pa="";for(d=from;d<=to;d++){var v=val(d);if(v>0)pa+='M'+X(d).toFixed(1)+' '+(T1+H1)+'V'+(T1+H1-H1*tf(v)/mt).toFixed(1);}
  s+='<path d="'+pa+'" stroke="var(--outage)" stroke-width="'+sw+'" fill="none"/><path d="'+gp+'" stroke="var(--warn-ink)" stroke-width="'+sw+'" fill="none"/>';
  var tk="";ks.forEach(function(k){var dd=dayNum(k);if(dd>=from&&dd<=to&&A[k].emH>0)tk+='M'+X(dd).toFixed(1)+' '+T1+'v'+(H1+gap+H2);});
  s+='<path d="'+tk+'" stroke="var(--rc-emergency)" stroke-opacity=".3" stroke-width="1" fill="none"/>';
  ticksLin(1,2).forEach(function(f){var v=mx2*f,y=T2+H2-H2*f;s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-5)+'" y="'+(y+3)+'" text-anchor="end">'+fmt(v,0)+'</text>';});
  var pb="",pe="";ks.forEach(function(k){var dd=dayNum(k);if(dd<from||dd>to)return;var a=A[k],x=X(dd).toFixed(1),ho=a.otH,he=a.emH;if(ho)pb+='M'+x+' '+(T2+H2)+'V'+(T2+H2-H2*Math.min(ho,mx2)/mx2).toFixed(1);if(he)pe+='M'+x+' '+(T2+H2-H2*Math.min(ho,mx2)/mx2).toFixed(1)+'V'+(T2+H2-H2*Math.min(ho+he,mx2)/mx2).toFixed(1);});
  s+='<path d="'+pb+'" stroke="var(--rc-maintenance)" stroke-width="'+sw+'" fill="none"/><path d="'+pe+'" stroke="var(--rc-emergency)" stroke-width="'+Math.max(sw,1.6)+'" fill="none"/>';
  var y0=new Date(from*864e5).getUTCFullYear(),y1=new Date(to*864e5).getUTCFullYear(),x;
  if(n>400){for(var y=y0;y<=y1;y++){var dd=dayNum(y+"-01-01");if(dd<from||dd>to)continue;x=X(dd);s+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="'+(T2+H2)+'" y2="'+(T2+H2+4)+'"/><text x="'+x+'" y="'+(T2+H2+16)+'" text-anchor="middle">'+y+'</text>';}}
  else{var st=Math.max(1,Math.ceil(n/(iw/64)));for(d=from;d<=to;d+=st){x=X(d);s+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="'+(T2+H2)+'" y2="'+(T2+H2+4)+'"/><text x="'+x+'" y="'+(T2+H2+16)+'" text-anchor="middle">'+dayStr(d).slice(2)+'</text>';}}
  s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T1+H1)+'" y2="'+(T1+H1)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T1+'" y2="'+(T1+H1)+'"/><line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(T2+H2)+'" y2="'+(T2+H2)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T2+'" y2="'+(T2+H2)+'"/>';
  s+='<text transform="translate(11,'+(T1+H1/2)+') rotate(-90)" text-anchor="middle">'+(OS.metric==="ch"?"Customer-hours / day":"Max customers out / day")+(OS.scale==="sqrt"?" (sqrt axis)":"")+'</text><text transform="translate(11,'+(T2+H2/2)+') rotate(-90)" text-anchor="middle">Engine-hours / day</text><text x="'+(L+iw/2)+'" y="'+(H-4)+'" text-anchor="middle">Local calendar date</text>';
  s+='<line id="odx" y1="'+T1+'" y2="'+(T2+H2)+'" stroke="var(--ink)" stroke-width="1" style="display:none" pointer-events="none"/><rect data-hover="1" x="'+L+'" y="'+T1+'" width="'+iw+'" height="'+(T2+H2-T1)+'" fill="transparent"/></svg>';
  el.innerHTML='<p class="cap" style="margin:0 0 6px"><b>Top:</b> '+esc(o.county)+' County (FIPS '+esc(g.fips)+') EAGLE-I '+(OS.metric==="ch"?"customer-hours per local day":"maximum customers out in any 15-minute snapshot per local day")+'. <b>Bottom:</b> engine-hours logged by '+esc(facLabel(fac))+' per day (red = emergency-class reasons, grey = everything else, stacked). Faint red lines mark emergency-run days.</p>'+s+
    legendHtml([["county customers out (EAGLE-I)","var(--outage)"],["emergency-class engine-hours","var(--rc-emergency)"],["other engine-hours (test, maintenance, other)","var(--rc-maintenance)"],["EAGLE-I day with missing snapshots","var(--warn-ink)"]].concat(gridLeg[0]?[["DOE 202(c) backup-generation order in effect","var(--cat2)"]]:[]).concat(gridLeg[1]?[["PJM large-load transfer event (dashed line)","var(--cat2)"]]:[]));
  var svg=el.querySelector("svg"),hov=svg.querySelector("[data-hover]"),cur=svg.querySelector("#odx");
  function mv(e){var r=svg.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,di=Math.round((px-L)/iw*n-0.5),dd=from+Math.max(0,Math.min(n-1,di)),k=dayStr(dd),a=A[k],od=outDay(o,k);cur.setAttribute("x1",X(dd));cur.setAttribute("x2",X(dd));cur.style.display="";
    showTip("<b>"+k+"</b><br>County max out: "+(od?fmt(od.max):"n/a")+"<br>County customer-hours: "+(od?fmt(od.ch,0):"n/a")+(od&&od.snaps<86?"<br>EAGLE-I snapshots that day: "+od.snaps+" of ~96":"")+"<br>Emergency engine-hours: "+(a?fmt(a.emH,1)+" ("+cnt(a.emE)+" engines)":"0")+"<br>Other engine-hours: "+(a?fmt(a.otH,1):"0"),e.clientX,e.clientY);}
  hov.addEventListener("pointermove",mv);hov.addEventListener("pointerdown",mv);hov.addEventListener("pointerleave",function(){cur.style.display="none";hideTip();});
};
function outSummary(thr){
  var facs=outFacs(),missing=[];
  var regs={};EV.forEach(function(x){if(x[EC.facility_reg])regs[x[EC.facility_reg]]=1;});Object.keys(PTCNT).forEach(function(k){regs[k]=1;});
  Object.keys(regs).sort().forEach(function(r){if(facs.indexOf(r)<0)missing.push(r);});
  var h='<h2>All facilities with a county outage series</h2><div class="tw"><table><thead><tr><th>Facility</th><th>County</th><th class="n">Emergency-run days</th><th class="n">Of these, county outage at or above the threshold (+/- 1 day)</th><th class="n">Share</th><th class="n">Same test, all days in the logging period</th></tr></thead><tbody>';
  facs.forEach(function(f){var g=GEOBY[f],o=OUTD[g.fips],days=emDaysFor(f),ks=Object.keys(days);var nh=ks.filter(function(k){return [dayStr(dayNum(k)-1),k,dayStr(dayNum(k)+1)].some(function(q){var z=outDay(o,q);return z&&z.max>=thr;});}).length;
    var allD=Object.keys(dayAgg(EV.filter(function(x){return x[EC.facility_reg]===f;}))).sort(),base=0,tot=0;
    if(allD.length){for(var d=dayNum(allD[0]);d<=dayNum(allD[allD.length-1]);d++){tot++;if([d-1,d,d+1].some(function(q){var z=outDay(o,dayStr(q));return z&&z.max>=thr;}))base++;}}
    h+='<tr class="click" data-setfac="'+esc(f)+'"><td>'+esc(facLabel(f))+'</td><td>'+esc(g.countyLabel||g.county)+'</td><td class="n">'+fmt(ks.length)+'</td><td class="n">'+fmt(nh)+'</td><td class="n">'+(ks.length?fmt(100*nh/ks.length,0)+"%":"")+'</td><td class="n">'+(tot?fmt(100*base/tot,0)+"%":"")+'</td></tr>';});
  h+='</tbody></table></div><p class="cap">Threshold: '+fmt(thr)+' customers out (set above). Click a row to show that facility in the chart.'+(missing.length?' Not comparable: '+missing.map(function(r){var g=GEOBY[r];return esc(facLabel(r))+(g?(OUTD[g.fips]?" (no dated emergency-class events, period totals only)":" (no county series)"):" (not in the permit layer with coordinates, so no county)");}).join("; ")+'.':'')+'</p>';
  return h;
}
function renderOut(){
  var p=$("#pane-out"),facs=outFacs();
  if(!facs.length){p.innerHTML='<div class="note"><b>No outage comparison available.</b> It needs run-log facilities with coordinates and an EAGLE-I county series.</div>';return;}
  var fac=outFac(),g=GEOBY[fac],o=OUTD[g.fips],days=emDaysFor(fac),ks=Object.keys(days).sort();
  var years={};EV.forEach(function(x){if(x[EC.facility_reg]===fac&&validDate(x[EC.date]))years[x[EC.date].slice(0,4)]=1;});
  var h='<p class="sub">Does the county lose power on the days the facility runs its generators for emergency reasons? EAGLE-I (ORNL) reports customers without power per county every 15 minutes. It does not locate outages inside the county, so a facility can run on a feeder fault that never shows in a county total.</p>';
  h+='<div class="bar"><label>Facility with run logs<select id="ofac">'+facs.map(function(f){return '<option value="'+esc(f)+'"'+(f===fac?" selected":"")+'>'+esc(facLabel(f))+'</option>';}).join("")+'</select></label>'+
    '<label>Year<select id="oyear">'+opts(Object.keys(years).sort(),OS.year,"All years")+'</select></label>'+
    '<label>County series<select id="ometric"><option value="max"'+(OS.metric==="max"?" selected":"")+'>max customers out per day</option><option value="ch"'+(OS.metric==="ch"?" selected":"")+'>customer-hours per day</option></select></label>'+
    '<label>Axis<select id="oscale"><option value="lin"'+(OS.scale==="lin"?" selected":"")+'>linear</option><option value="sqrt"'+(OS.scale==="sqrt"?" selected":"")+'>square root</option></select></label>'+
    '<label>Outage threshold (customers)<select id="othr">'+[1,100,1000,5000,20000].map(function(v){return '<option value="'+v+'"'+(OS.thr===v?" selected":"")+'>'+fmt(v)+'</option>';}).join("")+'</select></label></div>';
  h+='<div class="card"><h3>'+esc(o.county)+' County customers out vs. '+esc(g.name)+' generator runs</h3><div class="ch" data-ch="outMain"></div></div>';
  var rows=ks.map(function(k){var d=days[k],b=dayStr(dayNum(k)-1),a=dayStr(dayNum(k)+1),od=outDay(o,k)||{},ob=outDay(o,b)||{},oa=outDay(o,a)||{};
    return {date:k,eng:cnt(d.eng),h:d.h,raw:Object.keys(d.raw).join("; "),max:od.max,before:ob.max,after:oa.max,ch:od.ch,snaps:od.snaps};});
  var thr=OS.thr,nh=rows.filter(function(r){return Math.max(r.max||0,r.before||0,r.after||0)>=thr;}).length;
  var allD=Object.keys(dayAgg(EV.filter(function(x){return x[EC.facility_reg]===fac;}))).sort(),dA=dayNum(allD[0]),dB=dayNum(allD[allD.length-1]),base=0,tot=0;
  for(var d=dA;d<=dB;d++){var q=[outDay(o,dayStr(d-1)),outDay(o,dayStr(d)),outDay(o,dayStr(d+1))];tot++;if(q.some(function(z){return z&&z.max>=thr;}))base++;}
  h+='<p class="sub" style="margin-top:12px"><b>'+rows.length+'</b> emergency-run days for this facility; on <b>'+nh+'</b> ('+fmt(100*nh/Math.max(1,rows.length),0)+'%) the county had at least <b>'+fmt(thr)+'</b> customers out on that day or the day before or after. For comparison, <b>'+fmt(100*base/Math.max(1,tot),0)+'%</b> of all '+fmt(tot)+' days in the facility\'s logging period ('+dayStr(dA)+' to '+dayStr(dB)+') meet the same test. A small difference means the generator runs are not tracking county-wide outages.</p>';
  rows.sort(function(a,b){var k=OS.sort;return OS.dir*cmp(a[k],b[k])||cmp(a.date,b.date);});
  h+='<div class="tw"><table><thead><tr>'+th("Date","date",OS)+th("Engines","eng",OS,1)+th("Engine-hours","h",OS,1)+'<th>Reason as logged</th>'+th("County max out, that day","max",OS,1)+th("Day before","before",OS,1)+th("Day after","after",OS,1)+th("Customer-hours, that day","ch",OS,1)+'</tr></thead><tbody>';
  function c(v){return '<td class="n'+(v>=thr?" hit":v>0?"":" hit0")+'">'+(v==null?'<span class="muted">n/a</span>':fmt(v))+'</td>';}
  rows.forEach(function(r){h+='<tr><td class="mono">'+esc(r.date)+(r.snaps!=null&&r.snaps<86?' <span class="pill no" title="EAGLE-I had fewer snapshots than expected on this local date">gap</span>':"")+'</td><td class="n">'+r.eng+'</td><td class="n">'+fmt(r.h,1)+'</td><td>'+esc(r.raw)+'</td>'+c(r.max)+c(r.before)+c(r.after)+'<td class="n">'+(r.ch==null?"":fmt(r.ch,0))+'</td></tr>';});
  h+='</tbody></table></div>';
  if(GRID){
    h+='<h2>Grid emergency context</h2><p class="sub">Vertical bands and dashed lines on the chart above appear only where the date falls inside the plotted window. '+esc((GRID.notes||[]).join(" "))+'</p>';
    h+='<h3 style="font-size:14px">PJM large-load transfer events (data centers moving to backup generation)</h3><div class="tw"><table><thead><tr><th>Date</th><th class="n">MW (PJM deck)</th><th class="n">MW (other PJM document)</th><th>Region</th><th>What the source says</th><th>Source</th></tr></thead><tbody>'+
      (GRID.pjm_events||[]).map(function(r){return '<tr><td class="mono">'+esc(r.date)+'</td><td class="n">'+fmt(r.mw)+'</td><td class="n">'+fmt(r.mw_alt)+'</td><td>'+esc(r.region)+'</td><td>'+esc(r.text)+'</td><td>'+esc(r.source_file)+', '+esc(r.source_page||"")+'<div class="muted">'+esc(r.alt_source||"")+'</div>'+(r.source_url?'<a href="'+esc(r.source_url)+'" target="_blank" rel="noopener">link</a>':"")+'</td></tr>';}).join("")+'</tbody></table></div>';
    h+='<h3 style="font-size:14px;margin-top:16px">DOE Federal Power Act 202(c) orders mentioning backup generation (all dated 2026)</h3><div class="tw"><table><thead><tr><th>Order</th><th>Effective from</th><th>to</th><th>Region / entity</th><th>Kind</th><th>Source</th></tr></thead><tbody>'+
      (GRID.orders||[]).map(function(r){return '<tr><td class="mono">'+esc(r.order)+'</td><td class="mono">'+esc(r.start)+'</td><td class="mono">'+esc(r.end)+'</td><td>'+esc(r.entity)+'</td><td>'+esc(r.type)+'</td><td>DOE index, text line '+esc(r.source_line)+' <a href="'+esc(r.source_url)+'" target="_blank" rel="noopener">link</a><div class="muted">'+esc(r.effective_text)+'</div></td></tr>';}).join("")+'</tbody></table></div>';}
  h+=outSummary(thr);
  h+='<p class="cap"><b>Dates and time zones.</b> EAGLE-I timestamps are UTC (stated in the dataset paper; only partly corroborated by the hourly profile). The county series here is cut into <b>America/New_York local dates</b> to match the dates written in run logs, which are local calendar dates; the day-before and day-after columns absorb the remaining mismatch (an evening outage can straddle local midnight, and a log row may be dated when the paperwork was filled in). <b>Missing data.</b> EAGLE-I omits zero-outage counties, so a day with no rows is shown as 0; days with fewer than 86 of about 96 snapshots nationwide are flagged "gap" and may hide outages. Values are 15-minute snapshot counts, not events, and sum every utility in '+esc(o.county)+' County. <b>Facility to county</b> is the '+esc(g.fipsBasis||"permit layer")+'. Facilities in the same county share one outage series (all the Loudoun facilities use the Loudoun series).</p>';
  p.innerHTML=h;
  $("#ofac").onchange=function(){setFac(this.value);};$("#oyear").onchange=function(){OS.year=this.value;renderOut();};
  $("#ometric").onchange=function(){OS.metric=this.value;renderOut();};$("#oscale").onchange=function(){OS.scale=this.value;renderOut();};$("#othr").onchange=function(){OS.thr=+this.value;renderOut();};
  bindSort(p,OS,renderOut);drawCharts(p);
}

/* ======================= GENERIC SECTION PAGES (spatial / emissions / health) ======================= */
var GC=["var(--accent)","var(--cat2)","var(--grid-500)","var(--rc-emergency)","var(--rc-other)","var(--ink-3)"];
var FIGS=[];
function niceTicks(lo,hi,n){if(!(hi>lo)){hi=lo+1;}var span=hi-lo,st=Math.pow(10,Math.floor(Math.log10(span/n))),f=span/n/st,m=f<=1?1:f<=2?2:f<=5?5:10;st*=m;
  var a=Math.ceil(lo/st-1e-9)*st,t=[];for(var v=a;v<=hi+st*1e-6;v+=st)t.push(+v.toPrecision(12));return t;}
function ftick(v){var a=Math.abs(v);return a>=1000?fmt(v,0):a>=10?fmt(v,v%1?1:0):a>=1?fmt(v,v%1?2:0):String(+v.toPrecision(2));}
function groupsOf(arr){var g=[];arr.forEach(function(x){var k=x.group||"";if(g.indexOf(k)<0)g.push(k);});return g;}
function axes(W,H,L,R,T,B,xl,yl){return '<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+(H-B)+'" y2="'+(H-B)+'"/><line class="ax" x1="'+L+'" x2="'+L+'" y1="'+T+'" y2="'+(H-B)+'"/><text x="'+(L+(W-L-R)/2)+'" y="'+(H-4)+'" text-anchor="middle">'+esc(xl||"")+'</text><text transform="translate(11,'+(T+(H-T-B)/2)+') rotate(-90)" text-anchor="middle">'+esc(yl||"")+'</text>';}
function gLegend(gs){if(gs.length<2)return "";return legendHtml(gs.map(function(g,i){return [g||"(all)",GC[i%GC.length]];}));}
function numCell(c){return (c%1===0&&c>=1800&&c<=2100)?String(c):fmt(c,c%1?3:0);}
function cellHtml(c){c=String(c==null?"":c);var m=/^https?:\/\/\S+$/.exec(c.trim());return m?'<a href="'+esc(m[0])+'" target="_blank" rel="noopener">'+esc(nowrap(m[0].replace(/^https?:\/\/(www\.)?/,""),48))+'</a>':esc(c).replace(/(https?:\/\/[^\s<)]+)/g,'<a href="$1" target="_blank" rel="noopener">link</a>');}
function isoDay(v){if(typeof v!=="string")return null;var m=/^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(v);return m?Date.UTC(+m[1],+m[2]-1,+(m[3]||1))/864e5:null;}
function catLabel(c,all){c=String(c);var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(c);if(m&&all.every(function(x){return String(x).slice(4)===c.slice(4);}))return m[1];return c;}
function vbar(el,W,f){ // vertical bars: categories + series[{name,values}] or series[{name,points:[[category,value]]}]; grouped, or stacked when f.stacked
  var cats=(f.categories||[]).map(String),ser=[],ns,i,k;
  if(!f.categories){var set={};(f.series||[]).forEach(function(se){(se.points||[]).forEach(function(p){set[String(p[0])]=1;});});cats=Object.keys(set).sort();}
  (f.series||[]).forEach(function(se){var vals=[];if(se.values)vals=se.values.slice();else(se.points||[]).forEach(function(p){vals[cats.indexOf(String(p[0]))]=p[1];});ser.push({name:se.name,vals:vals});});
  ns=ser.length;var n=cats.length;if(!n||!ns){el.innerHTML=noData("No data.");return;}
  var H=270,L=58,R=12,T=10,B=48,iw=W-L-R,ih=H-T-B,stacked=!!f.stacked,mx=0,mn=0;
  for(i=0;i<n;i++){var pos=0,neg=0;ser.forEach(function(se){var v=+se.vals[i];if(isNaN(v)||se.vals[i]==null)return;if(stacked){if(v>=0)pos+=v;else neg+=v;}else{pos=Math.max(pos,v);neg=Math.min(neg,v);}});mx=Math.max(mx,pos);mn=Math.min(mn,neg);}
  var tk=niceTicks(mn,mx||1,5),lo=Math.min(mn,tk[0]),hi=Math.max(mx,tk[tk.length-1]);
  function Y(v){return T+ih-ih*(v-lo)/(hi-lo||1);}
  var s=head(W,H,f.title||"bar chart");
  tk.forEach(function(v){s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(v)+'" y2="'+Y(v)+'"/><text x="'+(L-5)+'" y="'+(Y(v)+3)+'" text-anchor="end">'+ftick(v)+'</text>';});
  var band=iw/n,gw=band*0.78,bw=stacked?gw:gw/ns;
  for(i=0;i<n;i++){var x0=L+i*band+(band-gw)/2,up=0,dn=0;
    ser.forEach(function(se,j){var v=se.vals[i];if(v==null||isNaN(+v))return;v=+v;var y1,y2,x=stacked?x0:x0+j*bw;
      if(stacked){if(v>=0){y1=Y(up+v);y2=Y(up);up+=v;}else{y1=Y(dn);y2=Y(dn+v);dn+=v;}}else{y1=Y(Math.max(v,0));y2=Y(Math.min(v,0));}
      s+='<rect x="'+x.toFixed(1)+'" y="'+y1.toFixed(1)+'" width="'+Math.max(1,bw-(ns>1&&!stacked?1:0)).toFixed(1)+'" height="'+Math.max(0.5,y2-y1).toFixed(1)+'" fill="'+GC[j%GC.length]+'" data-tip="'+esc("**"+catLabel(cats[i],cats)+"**\n"+se.name+": "+ftick(v))+'"/>';});}
  var lw=Math.max.apply(null,cats.map(function(c){return catLabel(c,cats).length;}))*5.6+8,step=Math.max(1,Math.ceil(n*lw/iw));
  cats.forEach(function(c,i){if(i%step)return;var x=L+i*band+band/2;s+='<line class="ax" x1="'+x+'" x2="'+x+'" y1="'+(T+ih)+'" y2="'+(T+ih+4)+'"/><text x="'+x+'" y="'+(T+ih+16)+'" text-anchor="middle">'+esc(catLabel(c,cats))+'</text>';});
  if(lo<0)s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(0)+'" y2="'+Y(0)+'"/>';
  el.innerHTML=s+axes(W,H,L,R,T,B,f.x_label,f.y_label)+'</svg>'+(ns>1?legendHtml(ser.map(function(se,j){return [se.name,GC[j%GC.length]];})):"");
}
function normFig(f){ // accept the variants the analysis files use: {x,y} points, edge-list histograms
  if(f.type==="line"||f.type==="scatter"){var conv=function(p){return (p&&!Array.isArray(p)&&typeof p==="object"&&"x" in p)?[p.x,p.y]:p;};
    if(f.type==="line"&&((f.series||[]).some(function(se){return (se.points||[]).some(function(p){return p&&!Array.isArray(p);});})||(f.band&&f.band.lo&&f.band.lo.some(function(p){return !Array.isArray(p);})))){f=JSON.parse(JSON.stringify(f));
      f.series.forEach(function(se){se.points=(se.points||[]).map(conv).filter(function(p){return p&&p[1]!=null;});});if(f.band){f.band.lo=f.band.lo.map(conv);f.band.hi=f.band.hi.map(conv);}}}
  if(f.type==="histogram"&&f.counts&&!f.bins.some(function(b){return typeof b==="object";})){var e=f.bins,g=JSON.parse(JSON.stringify(f));g.bins=f.counts.map(function(c,i){return {x0:e[i],x1:e[i+1],count:c};});f=g;}
  return f;}
function drawFig(el,W,f){
  f=normFig(f);
  var s="",H=270,L=56,R=12,T=10,B=44,iw=W-L-R,ih=H-T-B,i;
  if(f.type==="table"){var h='<div class="tw"><table><thead><tr>'+(f.columns||[]).map(function(c){return '<th>'+esc(c)+'</th>';}).join("")+'</tr></thead><tbody>';
    (f.rows||[]).forEach(function(r){h+='<tr>'+r.map(function(c){return '<td'+(typeof c==="number"?' class="n"':"")+'>'+(typeof c==="number"?numCell(c):cellHtml(c))+'</td>';}).join("")+'</tr>';});el.innerHTML=h+'</tbody></table></div>';return;}
  if(f.type==="bar"&&!f.bars&&f.series){vbar(el,W,f);return;}
  if(f.type==="scatter"&&!f.points&&f.series){var pts=[];f=JSON.parse(JSON.stringify(f));f.series.forEach(function(se,si){(se.points||[]).forEach(function(p){p._g=si;if(!p.label)p.label=se.name;pts.push(p);});});f.points=pts;f._sn=f.series.map(function(se){return se.name;});}
  if(f.type==="bar"){var bars=f.bars||[],gs=groupsOf(bars),vmin=Math.min.apply(null,bars.map(function(b){return b.value;}).concat([0])),vmax=Math.max.apply(null,bars.map(function(b){return b.value;}).concat([0]));
    var Lw=Math.min(170,Math.round(W*0.4)),rh=22,n=bars.length,Hh=T+n*rh+B,iw2=W-Lw-48,tk=niceTicks(vmin,vmax,4),lo=Math.min(vmin,tk[0]),hi=Math.max(vmax,tk[tk.length-1]);
    function XX(v){return Lw+iw2*(v-lo)/(hi-lo||1);}s=head(W,Hh,f.title||"bar chart");
    tk.forEach(function(v){s+='<line class="gl" x1="'+XX(v)+'" x2="'+XX(v)+'" y1="'+T+'" y2="'+(T+n*rh)+'"/><text x="'+XX(v)+'" y="'+(T+n*rh+13)+'" text-anchor="middle">'+ftick(v)+'</text>';});
    bars.forEach(function(b,k){var y=T+k*rh,x0=XX(0),x1=XX(b.value),gi=gs.indexOf(b.group||"");s+='<g data-tip="'+esc("**"+b.label+"**\n"+(b.group?b.group+"\n":"")+fmt(b.value,Math.abs(b.value)<10&&b.value%1?3:0))+'"><text x="'+(Lw-6)+'" y="'+(y+rh/2+3.5)+'" text-anchor="end">'+esc(nowrap(b.label,Math.floor(Lw/5.6)))+'</text><rect x="'+Math.min(x0,x1)+'" y="'+(y+3)+'" width="'+Math.max(1,Math.abs(x1-x0))+'" height="'+(rh-6)+'" fill="'+GC[gi%GC.length]+'"/><text x="'+(b.value>=0?Math.max(x0,x1)+4:Math.min(x0,x1)-4)+'" y="'+(y+rh/2+3.5)+'" text-anchor="'+(b.value>=0?"start":"end")+'">'+ftick(b.value)+'</text></g>';});
    s+='<line class="ax" x1="'+XX(0)+'" x2="'+XX(0)+'" y1="'+T+'" y2="'+(T+n*rh)+'"/><text x="'+(Lw+iw2/2)+'" y="'+(Hh-4)+'" text-anchor="middle">'+esc(f.x_label||f.y_label||"")+'</text></svg>';el.innerHTML=s+gLegend(gs);return;}
  if(f.type==="histogram"){var bins=f.bins||[],gs2=groupsOf(bins);if(!bins.length){el.innerHTML=noData("No data.");return;}
    var x0=Math.min.apply(null,bins.map(function(b){return b.x0;})),x1=Math.max.apply(null,bins.map(function(b){return b.x1;})),my=Math.max.apply(null,bins.map(function(b){return b.count;})),tx=niceTicks(x0,x1,Math.max(2,Math.floor(iw/70))),ty=niceTicks(0,my,4),yh=ty[ty.length-1]||1;
    function X2(v){return L+iw*(v-x0)/(x1-x0||1);}function Y2(v){return T+ih-ih*v/yh;}s=head(W,H,f.title||"histogram");
    ty.forEach(function(v){s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y2(v)+'" y2="'+Y2(v)+'"/><text x="'+(L-5)+'" y="'+(Y2(v)+3)+'" text-anchor="end">'+ftick(v)+'</text>';});
    bins.forEach(function(b){var gi=gs2.indexOf(b.group||""),ng=gs2.length,bx=X2(b.x0),bw=(X2(b.x1)-bx),w=bw/ng;s+='<rect x="'+(bx+gi*w+0.5)+'" y="'+Y2(b.count)+'" width="'+Math.max(1,w-1)+'" height="'+(T+ih-Y2(b.count))+'" fill="'+GC[gi%GC.length]+'" data-tip="'+esc("**"+ftick(b.x0)+" to "+ftick(b.x1)+"**\n"+(b.group?b.group+"\n":"")+fmt(b.count)+" in bin")+'"/>';});
    tx.forEach(function(v){s+='<line class="ax" x1="'+X2(v)+'" x2="'+X2(v)+'" y1="'+(T+ih)+'" y2="'+(T+ih+4)+'"/><text x="'+X2(v)+'" y="'+(T+ih+16)+'" text-anchor="middle">'+ftick(v)+'</text>';});
    el.innerHTML=s+axes(W,H,L,R,T,B,f.x_label,"Count")+'</svg>'+gLegend(gs2);return;}
  // numeric xy: scatter / line
  var xs=[],ys=[],TIME=false,CAT=null;
  if(f.type==="line"&&(f.series||[]).length&&isoDay(f.series[0].points[0]&&f.series[0].points[0][0])!==null){TIME=true;
    f=JSON.parse(JSON.stringify(f));var cv=function(p){p.push(p[0]);p[0]=isoDay(p[0]);};f.series.forEach(function(se){se.points.forEach(cv);});if(f.band){f.band.lo.forEach(cv);f.band.hi.forEach(cv);}}
  if(!TIME&&f.type==="line"&&(f.series||[]).length&&f.series[0].points.length&&typeof f.series[0].points[0][0]==="string"){CAT=[];f=JSON.parse(JSON.stringify(f));var cc=function(p){var i=CAT.indexOf(p[0]);if(i<0){i=CAT.length;CAT.push(p[0]);}p.push(p[0]);p[0]=i;};f.series.forEach(function(se){se.points.forEach(cc);});if(f.band){f.band.lo.forEach(cc);f.band.hi.forEach(cc);}}
  if(f.type==="scatter"){(f.points||[]).forEach(function(p){xs.push(p.x);ys.push(p.y);});}
  else if(f.type==="line"){(f.series||[]).forEach(function(se){se.points.forEach(function(p){xs.push(p[0]);ys.push(p[1]);});});if(f.band){["lo","hi"].forEach(function(k){f.band[k].forEach(function(p){xs.push(p[0]);ys.push(p[1]);});});}}
  else{el.innerHTML=noData("Unsupported figure type: "+f.type);return;}
  if(!xs.length){el.innerHTML=noData("No data.");return;}
  var x0=Math.min.apply(null,xs),x1=Math.max.apply(null,xs),y0=Math.min.apply(null,ys),y1=Math.max.apply(null,ys);
  if(f.type==="scatter"){var px=(x1-x0||1)*0.05,py=(y1-y0||1)*0.08;x0-=px;x1+=px;y0-=py;y1+=py;}
  var tx2=niceTicks(x0,x1,Math.max(2,Math.floor(iw/70))),ty2=niceTicks(y0,y1,5);
  if(CAT){tx2=[];var cs=Math.max(1,Math.ceil(CAT.length/Math.max(2,Math.floor(iw/58))));CAT.forEach(function(c,i){if(i%cs===0)tx2.push(i);});}
  if(TIME){tx2=[];var ya=new Date(x0*864e5).getUTCFullYear(),yb=new Date(x1*864e5).getUTCFullYear(),ys2=Math.max(1,Math.ceil((yb-ya+1)/Math.max(2,Math.floor(iw/60))));for(var yy=ya;yy<=yb+1;yy+=ys2){var dd=Date.UTC(yy,0,1)/864e5;if(dd>=x0&&dd<=x1)tx2.push(dd);}}if(CAT){x0=-0.3;x1=Math.max(CAT.length-0.7,0.3);}else if(!TIME){x0=Math.min(x0,tx2[0]);x1=Math.max(x1,tx2[tx2.length-1]);}y0=Math.min(y0,ty2[0]);y1=Math.max(y1,ty2[ty2.length-1]);
  function X3(v){return L+iw*(v-x0)/(x1-x0||1);}function Y3(v){return T+ih-ih*(v-y0)/(y1-y0||1);}
  s=head(W,H,f.title||"chart");
  ty2.forEach(function(v){s+='<line class="gl" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y3(v)+'" y2="'+Y3(v)+'"/><text x="'+(L-5)+'" y="'+(Y3(v)+3)+'" text-anchor="end">'+ftick(v)+'</text>';});
  tx2.forEach(function(v){s+='<line class="ax" x1="'+X3(v)+'" x2="'+X3(v)+'" y1="'+(T+ih)+'" y2="'+(T+ih+4)+'"/><text x="'+X3(v)+'" y="'+(T+ih+16)+'" text-anchor="middle">'+(CAT?esc(CAT[v]||""):TIME?new Date(v*864e5).getUTCFullYear():ftick(v))+'</text>';});
  if(y0<0&&y1>0)s+='<line class="ax" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y3(0)+'" y2="'+Y3(0)+'" stroke-dasharray="3 3"/>';
  var leg=[];
  if(f.type==="scatter"){(f.points||[]).forEach(function(p){s+='<circle cx="'+X3(p.x)+'" cy="'+Y3(p.y)+'" r="4" fill="'+(f._sn?GC[(p._g||0)%GC.length]:"var(--accent)")+'" fill-opacity=".7" stroke="var(--surface)" data-tip="'+esc("**"+(p.label||"")+"**\nx: "+ftick(p.x)+"\ny: "+ftick(p.y))+'"/>';});
    if(f._sn&&f._sn.length>1)f._sn.forEach(function(nm,si){leg.push([nm,GC[si%GC.length]]);});
    if(f.fit)s+='<line x1="'+X3(x0)+'" x2="'+X3(x1)+'" y1="'+Y3(f.fit.intercept+f.fit.slope*x0)+'" y2="'+Y3(f.fit.intercept+f.fit.slope*x1)+'" stroke="var(--rc-emergency)" stroke-width="2" data-tip="'+esc("Fit: y = "+ftick(f.fit.intercept)+" + "+ftick(f.fit.slope)+" x")+'"/>';
    if(f.fit)leg.push(["fitted line (slope "+ftick(f.fit.slope)+")","var(--rc-emergency)"]);}
  else{if(f.band){var d="";f.band.lo.forEach(function(p,k){d+=(k?"L":"M")+X3(p[0]).toFixed(1)+" "+Y3(p[1]).toFixed(1);});f.band.hi.slice().reverse().forEach(function(p){d+="L"+X3(p[0]).toFixed(1)+" "+Y3(p[1]).toFixed(1);});
      s+='<path d="'+d+'Z" fill="var(--ink-3)" fill-opacity=".28" stroke="var(--ink-3)" stroke-width="1" data-tip="'+esc(f.band.label||"envelope")+'"/>';leg.push([f.band.label||"envelope","var(--ink-3)"]);}
    (f.series||[]).forEach(function(se,k){var d2="";se.points.forEach(function(p,j){d2+=(j?"L":"M")+X3(p[0]).toFixed(1)+" "+Y3(p[1]).toFixed(1);});s+='<path d="'+d2+'" fill="none" stroke="'+GC[k%GC.length]+'" stroke-width="2"/>';
      se.points.forEach(function(p){s+='<circle cx="'+X3(p[0])+'" cy="'+Y3(p[1])+'" r="6" fill="transparent" data-tip="'+esc("**"+se.name+"**\n"+((TIME||CAT)?p[2]:"x: "+ftick(p[0]))+"\ny: "+ftick(p[1]))+'"/>';});leg.push([se.name,GC[k%GC.length]]);});}
  el.innerHTML=s+axes(W,H,L,R,T,B,f.x_label,f.y_label)+'</svg>'+(leg.length?legendHtml(leg):"");
}
CH.fig=function(el,W){drawFig(el,W,FIGS[+el.getAttribute("data-fig")]);};
function figHost(f){var i=FIGS.push(f)-1;return '<div class="card"><h3>'+esc(f.title||"")+'</h3><div class="ch" data-ch="fig" data-fig="'+i+'"></div></div>';}
/* wind rose */
var DIRN=["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
CH.rose=function(el,W){
  var r=WROSES[+el.getAttribute("data-rose")],n=r.bins_deg.length,sz=Math.min(W,420),cx=W/2,cy=sz/2,R0=sz/2-26,tot=r.freq.map(function(a){return a.reduce(function(x,y){return x+y;},0);}),mx=niceMax(Math.max.apply(null,tot.concat([1])));
  var s=head(W,sz,r.title||"wind rose");
  [0.25,0.5,0.75,1].forEach(function(f){s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R0*f+'" fill="none" stroke="var(--rule)"/><text x="'+(cx+3)+'" y="'+(cy-R0*f-2)+'">'+fmt(mx*f,mx<4?1:0)+'%</text>';});
  s+='<line class="gl" x1="'+cx+'" x2="'+cx+'" y1="'+(cy-R0)+'" y2="'+(cy+R0)+'"/><line class="gl" x1="'+(cx-R0)+'" x2="'+(cx+R0)+'" y1="'+cy+'" y2="'+cy+'"/>';
  var nc=r.speed_classes.length,step=360/n;
  r.bins_deg.forEach(function(deg,i){var cum=0;for(var c=0;c<nc;c++){var v=r.freq[i][c]||0;if(!v)continue;var r0=R0*cum/mx,r1=R0*(cum+v)/mx;cum+=v;
    var a0=(deg-step*0.42-90)*Math.PI/180,a1=(deg+step*0.42-90)*Math.PI/180,p=function(rr,a){return (cx+rr*Math.cos(a)).toFixed(1)+" "+(cy+rr*Math.sin(a)).toFixed(1);};
    s+='<path d="M'+p(r0,a0)+'L'+p(r1,a0)+'A'+r1+' '+r1+' 0 0 1 '+p(r1,a1)+'L'+p(r0,a1)+'A'+r0+' '+r0+' 0 0 0 '+p(r0,a0)+'Z" fill="var(--accent)" fill-opacity="'+(0.22+0.78*(c+1)/nc)+'" stroke="var(--surface)" stroke-width=".6" data-tip="'+esc("**"+(DIRN[Math.round(deg/22.5)%16]||deg+"°")+" ("+deg+"°)**\n"+r.speed_classes[c]+": "+fmt(v,2)+"%\nAll speeds: "+fmt(tot[i],2)+"%")+'"/>';}});
  [["N",0],["E",90],["S",180],["W",270]].forEach(function(d){var a=(d[1]-90)*Math.PI/180;s+='<text x="'+(cx+(R0+14)*Math.cos(a))+'" y="'+(cy+(R0+14)*Math.sin(a)+4)+'" text-anchor="middle" class="t1">'+d[0]+'</text>';});
  el.innerHTML=s+'</svg>'+'<div class="legend">'+r.speed_classes.map(function(c,i){return '<span><i class="sw" style="background:var(--accent);opacity:'+(0.22+0.78*(i+1)/nc)+'"></i>'+esc(c)+'</span>';}).join("")+'</div>'+'<p class="cap">'+esc(r.station||"")+(r.period?" · "+esc(r.period):"")+'. Wedge length = percent of observations from that direction (shades: darker = higher speed class, stacked). Direction convention as supplied in the data file (meteorological roses give the direction the wind blows from).</p>';
};
var WROSES=[];
/* raster helpers */
function cssRGB(name,fb){try{var v=getComputedStyle(document.body).getPropertyValue(name).trim();if(/^#[0-9a-f]{6}$/i.test(v))return [parseInt(v.substr(1,2),16),parseInt(v.substr(3,2),16),parseInt(v.substr(5,2),16)];if(/^#[0-9a-f]{3}$/i.test(v))return [parseInt(v[1]+v[1],16),parseInt(v[2]+v[2],16),parseInt(v[3]+v[3],16)];}catch(e){}return fb||[29,91,112];}
function merY(lat){return Math.log(Math.tan(Math.PI/4+lat*Math.PI/360));}
function rasterURL(g,rgb){ // g:{bbox,nx,ny,values}; resampled to Web Mercator space
  var b=g.bbox,ym0=merY(b[1]),ym1=merY(b[3]),ox=Math.min(420,g.nx*4),oy=Math.max(2,Math.round(ox*(ym1-ym0)/(((b[2]-b[0])*Math.PI/180)||1)));
  var cv=document.createElement("canvas");cv.width=ox;cv.height=oy;var c=cv.getContext("2d"),im=c.createImageData(ox,oy),mx=0,k;
  for(k=0;k<g.values.length;k++)if(g.values[k]>mx)mx=g.values[k];if(!mx)mx=1;
  for(var j=0;j<oy;j++){var ym=ym1-(j+0.5)/oy*(ym1-ym0),lat=(2*Math.atan(Math.exp(ym))-Math.PI/2)*180/Math.PI,row=Math.floor((b[3]-lat)/(b[3]-b[1])*g.ny);if(row<0||row>=g.ny)continue;
    for(var i=0;i<ox;i++){var col=Math.floor((i+0.5)/ox*g.nx),v=g.values[row*g.nx+col]||0,a=v>0?Math.min(0.85,0.08+0.8*Math.sqrt(v/mx)):0,o=(j*ox+i)*4;im.data[o]=rgb[0];im.data[o+1]=rgb[1];im.data[o+2]=rgb[2];im.data[o+3]=Math.round(a*255);}}
  c.putImageData(im,0,0);return {url:cv.toDataURL("image/png"),max:mx};
}
var PLUMES=[];
CH.plume=function(el,W){
  var pl=PLUMES[+el.getAttribute("data-plume")],sz=Math.min(W,460),b=pl.bbox,ym0=merY(b[1]),ym1=merY(b[3]),asp=(ym1-ym0)/(((b[2]-b[0])*Math.PI/180)||1),L=44,B=30,iw=sz-L-8,ih=Math.round(iw*asp),H=ih+B+8,r=rasterURL(pl,cssRGB("--grid-500",[106,61,154]));
  function X(lon){return L+iw*(lon-b[0])/(b[2]-b[0]);}function Y(lat){return 4+ih*(ym1-merY(lat))/(ym1-ym0);}
  var s=head(W,H,pl.title||"plume");s+='<rect x="'+L+'" y="4" width="'+iw+'" height="'+ih+'" fill="var(--surface-2)" fill-opacity=".6" stroke="var(--rule)"/><image href="'+r.url+'" x="'+L+'" y="4" width="'+iw+'" height="'+ih+'" preserveAspectRatio="none"/>';
  niceTicks(b[0],b[2],4).forEach(function(v){s+='<text x="'+X(v)+'" y="'+(ih+18)+'" text-anchor="middle">'+Math.abs(v).toFixed(2)+'°'+(v<0?"W":"E")+'</text>';});
  niceTicks(b[1],b[3],4).forEach(function(v){s+='<text x="'+(L-4)+'" y="'+(Y(v)+3)+'" text-anchor="end">'+v.toFixed(2)+'°</text>';});
  if(pl.source)s+='<path d="M'+X(pl.source[0])+' '+(Y(pl.source[1])-7)+'l5 10h-10z" fill="var(--rc-emergency)" stroke="var(--surface)" data-tip="Source"/>';
  el.innerHTML=s+'</svg><p class="cap">Raster maximum '+ftick(r.max)+' '+esc(pl.units||"")+'; opacity scales with the square root of the value. Triangle = source.</p>';
};
function renderSections(pane,data,o){
  if(!data){pane.innerHTML='<div class="note"><b>'+esc(o.empty)+'</b> '+esc(o.emptyNote||"")+'</div>';return;}
  FIGS=[];WROSES=data.wind_roses||[];PLUMES=data.plumes||[];
  var h='<p class="sub">'+(data.generated?'Generated '+esc(data.generated)+'. ':'')+esc(data.crs_note||"")+'</p>';
  var secs=data.sections||[];
  if(secs.length>1)h+='<p class="sub">'+secs.map(function(s){return '<a href="#sec-'+esc(s.id)+'">'+esc(s.title)+'</a>';}).join(" · ")+'</p>';
  secs.forEach(function(s){
    h+='<section class="gsec" id="sec-'+esc(s.id)+'"><h2>'+esc(s.title)+'</h2>';
    if(s.method)h+='<p class="method"><b>Method.</b> '+esc(s.method)+'</p>';
    if((s.findings||[]).length)h+='<div class="find"><b>Findings</b><ul>'+s.findings.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul></div>';
    var figs=s.figures||[],tabs=figs.filter(function(f){return f.type==="table";}),oth=figs.filter(function(f){return f.type!=="table";});
    if(oth.length)h+='<div class="cols2">'+oth.map(figHost).join("")+'</div>';
    tabs.forEach(function(f){h+='<div class="card" style="margin:12px 0"><h3>'+esc(f.title||"")+'</h3><div class="ch" data-ch="fig" data-fig="'+(FIGS.push(f)-1)+'"></div></div>';});
    if((s.sources||[]).length)h+='<div class="find"><b>Sources</b><ul>'+s.sources.map(function(x){return '<li>'+(typeof x==="string"?cellHtml(x):cellHtml(x.url||x.title||JSON.stringify(x)))+'</li>';}).join("")+'</ul></div>';
    if((s.caveats||[]).length)h+='<div class="note cav"><b>Caveats</b><ul>'+s.caveats.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul></div>';
    h+='</section>';});
  if(WROSES.length){h+='<section class="gsec"><h2>Wind roses</h2><div class="cols2">'+WROSES.map(function(r,i){return '<div class="card"><h3>'+esc(r.title||"")+'</h3><div class="ch" data-ch="rose" data-rose="'+i+'"></div></div>';}).join("")+'</div></section>';}
  if(PLUMES.length){h+='<section class="gsec"><h2>Plume rasters</h2><div class="cols2">'+PLUMES.map(function(r,i){return '<div class="card"><h3>'+esc(r.title||"")+'</h3><div class="ch" data-ch="plume" data-plume="'+i+'"></div></div>';}).join("")+'</div></section>';}
  pane.innerHTML=h;drawCharts(pane);
}
function renderSpa(){renderSections($("#pane-spa"),GS,{empty:"Spatial analysis not available.",emptyNote:"The spatial-analysis file was not found when this site was built."});}
function renderEmi(){renderSections($("#pane-emi"),EMI,{empty:"Emissions and wind analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderHea(){renderSections($("#pane-hea"),HEA,{empty:"Health-impact analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderAq(){renderSections($("#pane-aq"),OZ,{empty:"Air-quality analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderTax(){renderSections($("#pane-tax"),TAX,{empty:"Tax analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderEle(){renderSections($("#pane-ele"),ELE,{empty:"Electricity-price analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderDem(){renderSections($("#pane-dem"),DEM,{empty:"Demographic analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderCap(){renderSections($("#pane-cap"),CAP,{empty:"Capacity-market analysis not available.",emptyNote:"The analysis file for this page was not found when this site was built."});}
function renderLar(){renderSections($("#pane-lar"),LAR,{empty:"Large-load analysis not available.",emptyNote:"The large-load analysis file was not found when this site was built."});}
function renderNei(){renderSections($("#pane-nei"),NEI,{empty:"Emissions-inventory analysis not available.",emptyNote:"The EPA National Emissions Inventory analysis file was not found when this site was built."});}
function renderSrc(){
  var p=$("#pane-src"),h='<p class="sub">Everything the site draws on: DEQ portal requests, the stored public data layers, and the Sources tables and source URLs found in each analysis page.</p>';
  h+='<h2>DEQ portal requests</h2><div class="tw"><table><thead><tr><th>Request</th><th>State</th><th>Date</th><th>Documents</th><th>Portal</th></tr></thead><tbody>'+Object.keys(META.requests).sort().map(function(k){var r=META.requests[k];return '<tr><td class="mono">'+esc(k)+'</td><td>'+esc(r.state||"")+'</td><td>'+esc(r.date||"")+'</td><td class="n">'+fmt(r.n)+'</td><td><a href="'+esc(REQ_URL[k])+'" target="_blank" rel="noopener">request page</a></td></tr>';}).join("")+'</tbody></table></div>';
  if(!SRC){p.innerHTML=h+'<div class="note">Source index not available.</div>';return;}
  h+='<h2>Data layers on the map and outage pages</h2><div class="tw"><table><thead><tr><th>Layer</th><th>Used for</th><th>Source</th><th>Note</th></tr></thead><tbody>'+(SRC.builtin||[]).map(function(r){return '<tr><td>'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+cellHtml(r[2])+'</td><td>'+esc(r[3])+'</td></tr>';}).join("")+'</tbody></table></div>';
  (SRC.tables||[]).forEach(function(tb){h+='<h2>'+esc(tb.pagename)+': '+esc(tb.section)+'</h2><div class="tw"><table><thead><tr>'+tb.columns.map(function(c){return '<th>'+esc(c)+'</th>';}).join("")+'</tr></thead><tbody>'+tb.rows.map(function(r){return '<tr>'+r.map(function(c){return '<td>'+(typeof c==="number"?numCell(c):cellHtml(c))+'</td>';}).join("")+'</tr>';}).join("")+'</tbody></table></div>';});
  if((SRC.urls||[]).length)h+='<h2>All source URLs in the analysis files ('+fmt((SRC.urls||[]).length)+')</h2>';
  if((SRC.urls||[]).length)h+='<div class="tw"><table><thead><tr><th>Page</th><th>Section / item</th><th>URL</th></tr></thead><tbody>'+SRC.urls.map(function(u){return '<tr><td>'+esc(u.pagename)+'</td><td>'+esc(u.context)+'</td><td>'+cellHtml(u.url)+'</td></tr>';}).join("")+'</tbody></table></div>';
  p.innerHTML=h;
}
function renderMet(){
  var p=$("#pane-met"),m=D("d-methods","DEQ_METHODS")||[];
  if(!m.length){p.innerHTML='<div class="note">No methods documents were found when this site was built.</div>';return;}
  var groups=[],gm={};m.forEach(function(d,i){var g=d.group||"Methods";if(!gm[g]){gm[g]=[];groups.push(g);}gm[g].push(i);});
  var h='<p class="sub">Methods, the review of this analysis and the corrections made to it, and the source notes for each dataset.</p>';
  h+='<div class="find"><b>Contents</b>'+groups.map(function(g){return '<div style="margin-top:6px"><b>'+esc(g)+'</b>: '+gm[g].map(function(i){return '<a href="#met'+i+'">'+esc(m[i].title)+'</a>';}).join(" · ")+'</div>';}).join("")+'</div>';
  groups.forEach(function(g){h+='<h2 class="gh">'+esc(g)+'</h2>'+gm[g].map(function(i){var d=m[i];return '<section class="card md" id="met'+i+'" style="margin:12px 0"><h2 style="margin-top:0">'+esc(d.title)+'</h2>'+d.html+'</section>';}).join("");});
  p.innerHTML=h;
}

function renderAll(){renderChip();var f={ov:renderOv,map:renderMap,fac:renderFac,doc:renderDoc,run:renderRun,out:renderOut,spa:renderSpa,emi:renderEmi,hea:renderHea,aq:renderAq,tax:renderTax,ele:renderEle,dem:renderDem,cap:renderCap,lar:renderLar,nei:renderNei,src:renderSrc,met:renderMet};
  Object.keys(f).forEach(function(k){if($("#pane-"+k))f[k]();});showTab(S.tab);}
if(window.matchMedia){try{window.matchMedia("(prefers-color-scheme: dark)").addListener(function(){setTimeout(function(){renderAll();},50);});}catch(e){}}
renderHeader();renderNav();renderAll();
})();
