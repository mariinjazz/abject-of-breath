(() => {
 'use strict';
 const data=JSON.parse(document.getElementById('deck-data').textContent);
 const stage=document.getElementById('stage'), viewport=document.getElementById('viewport'), select=document.getElementById('page-select');
 let current=Math.max(0,Math.min(data.length-1,(Number(location.hash.slice(1))||Number(document.body.dataset.start)||1)-1)), editing=false;
 const storageKey='abject-breath-style-trial-v1';let saved={};
 // Published presentation uses the saved final text.
 const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
 const paragraphs=s=>s.split(/\n\n+/).map(p=>'<p>'+escape(p).replace(/\n/g,'<br>')+'</p>').join('');
 function notify(t){const n=document.getElementById('notice');n.textContent=t;n.style.display='block';setTimeout(()=>n.style.display='none',4500)}
 data.forEach((slide,i)=>{
  const option=new Option(`${String(i+1).padStart(2,'0')}  ${slide.title}`,i);select.add(option);
  const section=document.createElement('section');section.className='slide'+(slide.trial?' design-trial':'');section.setAttribute('aria-label',`${i+1}. ${slide.title}`);
  slide.elements.forEach(e=>{
   const el=document.createElement('div');el.className='element '+e.kind;el.dataset.id=e.id;
   Object.assign(el.style,{left:e.x+'px',top:e.y+'px',width:e.w+'px',height:e.h+'px'});
   if(e.kind==='panel'){el.style.background=e.fill;el.setAttribute('aria-hidden','true')}else if(e.kind==='text'){
    if(Object.hasOwn(saved,e.id))e.text=saved[e.id];
    Object.assign(el.style,{fontSize:e.size+'px',lineHeight:e.line||1.2,color:e.color||'',fontWeight:e.weight||400});
    if(e.heading)el.classList.add('condensed');
    if(e.justifyFirst)el.classList.add('justify-first');
    el.innerHTML=e.href?`<a href="${escape(e.href)}" target="_blank" rel="noopener noreferrer">${escape(e.text).replace(/\n/g,'<br>')}</a>`:paragraphs(e.text);
    if(e.emphasis){for(const phrase of e.emphasis){el.innerHTML=el.innerHTML.replace(escape(phrase),'<mark>'+escape(phrase)+'</mark>')}}
    el.addEventListener('input',()=>{e.text=el.innerText;saved[e.id]=e.text;try{localStorage.setItem(storageKey,JSON.stringify(saved))}catch{}});
   }else if(e.kind==='image'){
    const img=document.createElement('img');img.src=e.src;img.alt=e.alt||'';img.draggable=false;img.style.objectPosition=e.position||'50% 50%';
    if(e.href){const a=document.createElement('a');a.href=e.href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','Watch '+e.alt);a.append(img);el.append(a)}else el.append(img);
   }else if(e.kind==='youtube'){
    const f=document.createElement('iframe');f.dataset.embed='https://www.youtube.com/embed/'+e.youtubeId+'?rel=0';f.title=e.alt;f.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';f.allowFullscreen=true;f.referrerPolicy='strict-origin-when-cross-origin';Object.assign(f.style,{width:'100%',height:'100%',border:'0'});
    const a=document.createElement('a');a.className='fallback';a.href=e.fallback;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Watch on YouTube ↗';el.classList.add('video');el.append(f,a);
   }else if(e.kind==='placeholder'){
    el.setAttribute('role','img');el.setAttribute('aria-label',e.alt);el.innerHTML='<div><strong>'+escape(e.label)+'</strong><span>'+escape(e.detail)+'</span><small>Video to be added</small></div>';
   }else if(e.kind==='video'){
    const v=document.createElement('video');v.src=e.src;v.poster=e.poster;v.controls=true;v.preload='metadata';v.playsInline=true;v.setAttribute('aria-label',e.alt);
    const play=document.createElement('button');play.className='play-overlay';play.setAttribute('aria-label','Play '+e.alt);play.innerHTML='<span>▶ '+escape(e.alt)+'</span>';
    play.addEventListener('click',()=>{play.hidden=true;v.play().catch(()=>{play.hidden=false;notify('Use “Watch on YouTube” if this browser cannot play the video.')})});
    v.addEventListener('play',()=>{play.hidden=true;document.querySelectorAll('video').forEach(other=>{if(other!==v)other.pause()})});v.addEventListener('ended',()=>play.hidden=false);
    const a=document.createElement('a');a.className='fallback';a.href=e.fallback;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Watch on YouTube ↗';
    el.append(v,play,a);
   }
   section.append(el);
  });stage.append(section);
 });
 const sections=[...stage.children];
 function scale(){const pad=document.body.classList.contains('presenting')?0:32;const s=Math.min((viewport.clientWidth-pad)/1920,(viewport.clientHeight-pad)/1080);stage.style.width=1920*s+'px';stage.style.height=1080*s+'px';sections.forEach(n=>n.style.transform=`scale(${s})`)}
 function show(i){current=Math.max(0,Math.min(data.length-1,i));sections.forEach((s,j)=>{s.classList.toggle('active',j===current);s.setAttribute('aria-hidden',String(j!==current));s.querySelectorAll('iframe[data-embed]').forEach(f=>{if(j===current){if(!f.getAttribute('src'))f.src=f.dataset.embed}else{f.removeAttribute('src')}});if(j!==current)s.querySelectorAll('video').forEach(v=>v.pause())});select.value=String(current);document.getElementById('status').textContent=data[current].status;document.getElementById('previous').disabled=current===0;document.getElementById('next').disabled=current===data.length-1;history.replaceState(null,'','#'+(current+1));scale()}
 document.getElementById('previous').onclick=()=>show(current-1);document.getElementById('next').onclick=()=>show(current+1);select.onchange=()=>show(Number(select.value));
 document.getElementById('edit').onclick=()=>{editing=!editing;document.body.classList.toggle('editing',editing);document.getElementById('edit').textContent=editing?'Finish editing':'Edit text';document.getElementById('download').hidden=!editing;document.querySelectorAll('.text').forEach(el=>{el.contentEditable=String(editing);el.spellcheck=editing});if(editing)notify('Click any text to edit it. Download an edited copy to keep your changes.')};
 document.getElementById('download').onclick=()=>{
  const copy=document.documentElement.cloneNode(true);copy.querySelector('#deck-data').textContent=JSON.stringify(data).replace(/<\//g,'<\\/');copy.querySelector('#stage').innerHTML='';copy.querySelector('#page-select').innerHTML='';copy.querySelector('body').classList.remove('editing','presenting');copy.querySelector('#edit').textContent='Edit text';copy.querySelector('#download').hidden=true;copy.querySelector('#notice').style.display='none';
  const blob=new Blob(['<!doctype html>\n'+copy.outerHTML],{type:'text/html'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Abject of Breath - style trial edited.html';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notify('Keep the edited HTML beside presentation.css, presentation.js and the assets folder.');
 };
 document.getElementById('present').onclick=async()=>{document.body.classList.add('presenting');scale();try{await document.documentElement.requestFullscreen()}catch{}};
 document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement){document.body.classList.remove('presenting');scale()}});
 document.addEventListener('keydown',e=>{if(e.target.isContentEditable||/SELECT|INPUT|TEXTAREA/.test(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();show(current+1)}if(e.key==='ArrowLeft'){e.preventDefault();show(current-1)}if(e.key==='Escape'){document.body.classList.remove('presenting');scale()}});
 window.addEventListener('resize',scale);window.addEventListener('hashchange',()=>show((Number(location.hash.slice(1))||1)-1));show(current);
})();
