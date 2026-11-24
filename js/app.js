/* Lógica do app: navegação, telas e interações */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const R=v=>'R$ '+v.toFixed(2).replace('.',',');
const DISCOUNT=.5;

let favs=new Set(),reservas=[],comprovantes=[],stack=['home'];
let cur=null,qty=1,pay='Pix',filter='Todos',view='lista',stars=0,revRes=null,step=1;
let kgSaved=14.5,saved=86;

/* ---------- Navegação ---------- */
function go(id,push=true){
  $$('.screen').forEach(s=>s.classList.remove('show'));
  const s=$('#'+id);s.classList.add('show');
  if(push&&stack[stack.length-1]!==id)stack.push(id);
  $('#nav').classList.toggle('show',s.classList.contains('tab'));
  $$('nav button').forEach(b=>b.classList.toggle('on',b.dataset.go===id));
  ({home:renderHome,favs:renderFavs,reservas:renderRes,impacto:renderImpact,doacoes:renderDon})[id]?.();
  s.querySelector('.body')?.scrollTo(0,0);persist();
}
function back(){stack.pop();go(stack[stack.length-1]||'home',false)}
function tab(id){stack=[id];go(id,false)}
function toast(m){persist();const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2600)}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-back]');if(b)return back();
  const g=e.target.closest('nav [data-go]');if(g)return tab(g.dataset.go);
  const r=e.target.closest('[data-go]');if(r)go(r.dataset.go);
});

/* ---------- Tema claro/escuro ---------- */
function applyTheme(t){
  document.documentElement.dataset.theme=t;
  $('#themeBtn').textContent=t==='dark'?'☀️':'🌙';
  Store.setTheme(t);
}
$$('.theme-btn').forEach(b=>b.onclick=()=>{
  const t=document.documentElement.dataset.theme==='dark'?'light':'dark';
  applyTheme(t);toast(t==='dark'?'Tema escuro ativado.':'Tema claro ativado.');
});
applyTheme(Store.getTheme()||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));

/* ---------- Início ---------- */
const price=o=>o.orig*(1-DISCOUNT);
function offerCard(o){return `<button class="card offer" data-id="${o.id}">
 <div class="thumb">${o.emoji}</div><div><h3>${o.nome}</h3><p>${o.loja}</p>
 <div class="price"><b>${R(price(o))}</b><s>${R(o.orig)}</s><span class="off">50% off</span></div>
 <p>${o.dist.toString().replace('.',',')} km · retirar ${o.ret.split(' às')[0].replace('hoje, ','hoje, até ')}</p></div></button>`}
function bindOffers(el){el.querySelectorAll('.offer,.pin').forEach(b=>b.onclick=()=>openDetail(+b.dataset.id))}
function renderHome(){
  const cats=['Todos','Padaria','Restaurante','Mercado'];
  $('#chips').innerHTML=cats.map(c=>`<span class="chip ${c===filter?'on':''}" data-c="${c}">${c}</span>`).join('');
  $$('#chips .chip').forEach(c=>c.onclick=()=>{filter=c.dataset.c;renderHome()});
  const q=$('#q').value.toLowerCase();
  const l=offers.filter(o=>o.qtd>0&&(filter==='Todos'||o.tipo===filter)&&(o.nome+o.loja).toLowerCase().includes(q));
  $('#list').innerHTML=l.length?l.map(offerCard).join(''):'<p class="empty">Nada por aqui. Tente outra busca ou categoria.</p>';
  bindOffers($('#list'));
  $('#mapv').innerHTML=l.map((o,i)=>`<button class="pin" data-id="${o.id}" style="left:${12+i*27%60}%;top:${14+i*23%62}%">${R(price(o))}</button>`).join('');
  bindOffers($('#mapv'));
  $('#list').classList.toggle('hidden',view!=='lista');$('#mapv').classList.toggle('hidden',view!=='mapa');
}
$('#q').oninput=renderHome;
$$('.seg button').forEach(b=>b.onclick=()=>{view=b.dataset.view;$$('.seg button').forEach(x=>x.classList.toggle('on',x===b));renderHome()});

/* ---------- Detalhe ---------- */
const avg=l=>{const r=reviews.filter(x=>x.loja===l);return r.length?(r.reduce((a,x)=>a+x.n,0)/r.length).toFixed(1).replace('.',','):'–'}
function openDetail(id){cur=offers.find(o=>o.id===id);qty=1;renderDetail();go('detail')}
function renderDetail(){
  const o=cur,rv=reviews.filter(x=>x.loja===o.loja);
  $('#favbtn').textContent=favs.has(o.loja)?'♥ Favoritado':'♡ Favoritar';
  $('#detail-body').innerHTML=`<div class="thumb big">${o.emoji}</div>
  <h1>${o.nome}</h1><p class="muted">${o.loja} · ${o.dist.toString().replace('.',',')} km · ⭐ ${avg(o.loja)}</p>
  <div class="price"><b style="font-size:30px">${R(price(o))}</b><s>${R(o.orig)}</s><span class="off">50% off</span></div>
  <div class="card"><div class="line"><span>Validade</span><b>${o.val}</b></div><div class="line"><span>Retirada</span><b>${o.ret}</b></div><div class="line"><span>Local</span><b>${o.end}</b></div></div>
  <p class="safe">✅ Produto próprio para consumo. A qualidade é de responsabilidade do estabelecimento.</p>
  <div class="qty"><b>Quantidade</b><button id="m">−</button><b id="qv">${qty}</b><button id="p">+</button><span class="muted">${o.qtd} disponíveis</span></div>
  <p class="label">Avaliações dos clientes</p>
  ${rv.map(r=>`<div class="rev"><i>${'★'.repeat(r.n)}${'☆'.repeat(5-r.n)}</i> <b>${r.nome}</b><br>${r.t||''}</div>`).join('')||'<p class="muted">Ainda sem avaliações.</p>'}`;
  $('#m').onclick=()=>{qty=Math.max(1,qty-1);$('#qv').textContent=qty};
  $('#p').onclick=()=>{if(qty<o.qtd)qty++;else toast('Só há '+o.qtd+' unidade(s) disponível(is).');$('#qv').textContent=qty};
}
$('#favbtn').onclick=()=>{favs.has(cur.loja)?favs.delete(cur.loja):favs.add(cur.loja);renderDetail();toast(favs.has(cur.loja)?'Você receberá alertas desta loja.':'Removido dos favoritos.')};
$('#toCheckout').onclick=()=>{renderCheckout();go('checkout')};

/* ---------- Checkout ---------- */
function renderCheckout(){
  const o=cur,orig=o.orig*qty,fin=price(o)*qty;
  $('#checkout-body').innerHTML=`<h1>Resumo do pedido</h1>
  <div class="card"><b>${o.nome} · ${qty} un.</b><p class="muted">${o.loja}</p>
  <div class="line"><span>Preço original</span><span>${R(orig)}</span></div>
  <div class="line" style="color:var(--coral)"><span>Desconto 50%</span><span>− ${R(orig-fin)}</span></div>
  <div class="line tot"><span>Total</span><span>${R(fin)}</span></div></div>
  <p class="label">Forma de pagamento</p>
  <div class="pay">${['Pix','Cartão','Carteira digital'].map(p=>`<button class="${p===pay?'on':''}" data-p="${p}">${p}</button>`).join('')}</div>
  <p class="info">Após o pagamento, você recebe um QR Code para retirar em <b>${o.ret}</b>. Cancelamento grátis até 18h.</p>`;
  $$('.pay button').forEach(b=>b.onclick=()=>{pay=b.dataset.p;renderCheckout()});
}
const rnd=()=>'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.random()*24|0];
$('#payBtn').onclick=()=>{
  const o=cur,r={o,qty,pay,total:price(o)*qty,code:rnd()+(Math.random()*9|0)+rnd()+'-'+(100+Math.random()*899|0)};
  o.qtd-=qty;reservas.unshift(r);kgSaved+=o.kg*qty;saved+=(o.orig-price(o))*qty;
  stack=['home'];showConfirm(r);toast('Pagamento aprovado via '+pay+'!');
};

/* ---------- QR Code (desenho simulado a partir do código) ---------- */
function qr(code){
  let s=0;for(const c of code)s=(s*31+c.charCodeAt(0))>>>0;
  const n=25,F=[[3,3],[21,3],[3,21]];let out='';
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    let v=null;
    for(const[cx,cy]of F){const d=Math.max(Math.abs(x-cx),Math.abs(y-cy));if(d<=4)v=(d===3||d<=1)?1:0}
    if(v===null){s=(s*1664525+1013904223)>>>0;v=s>>>28&1}
    if(v)out+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return `<svg viewBox="-1 -1 27 27" fill="#0c3a2a" shape-rendering="crispEdges" role="img" aria-label="QR Code ${code}">${out}</svg>`;
}

/* ---------- Reserva confirmada ---------- */
function showConfirm(r){
  revRes=r;
  $('#confirm-body').innerHTML=`<div class="ok">✓</div><h1 class="center">Reserva confirmada</h1>
  <p class="muted center">Apresente o código no balcão para retirar.</p>
  <div class="qr">${qr(r.code)}</div><p class="code">${r.code}</p>
  <div class="card"><b>${r.o.nome} · ${r.qty} un.</b><p class="muted">${r.o.loja} · ${r.o.end}</p><p class="muted">Retirar ${r.o.ret} · Pago ${R(r.total)} (${r.pay})</p></div>
  <button class="btn" id="c-how">Como chegar</button>
  <button class="btn ghost" id="c-rate">Já retirei · avaliar</button>
  <button class="btn danger" id="c-cancel">Cancelar reserva</button>
  <button class="pill" id="c-home">Voltar ao início</button>`;
  $('#c-how').onclick=()=>toast('Abrindo rota para '+r.o.end+'…');
  $('#c-home').onclick=()=>tab('home');
  $('#c-rate').onclick=()=>{stars=0;$('#rev-text').value='';$('#rev-for').textContent=r.o.nome+' · '+r.o.loja;drawStars();go('review')};
  $('#c-cancel').onclick=()=>{r.o.qtd+=r.qty;kgSaved-=r.o.kg*r.qty;saved-=(r.o.orig-price(r.o))*r.qty;reservas=reservas.filter(x=>x!==r);toast('Reserva cancelada. Estorno de '+R(r.total)+' em até 3 dias.');tab('home')};
  go('confirm');
}

/* ---------- Avaliação ---------- */
function drawStars(){$('#stars').innerHTML=[1,2,3,4,5].map(i=>`<button class="${i<=stars?'on':''}" data-s="${i}" aria-label="${i} estrelas">★</button>`).join('');$$('#stars button').forEach(b=>b.onclick=()=>{stars=+b.dataset.s;drawStars()})}
$('#sendReview').onclick=()=>{
  if(!stars)return toast('Escolha de 1 a 5 estrelas.');
  reviews.unshift({loja:revRes.o.loja,nome:'Maria S.',n:stars,t:$('#rev-text').value.trim()});
  toast('Obrigado! Sua avaliação foi publicada.');tab('home');
};

/* ---------- Abas ---------- */
function renderFavs(){
  const l=offers.filter(o=>favs.has(o.loja)&&o.qtd>0);
  $('#favs-list').innerHTML=favs.size?(l.map(offerCard).join('')||'<p class="empty">Suas lojas favoritas estão sem ofertas agora. Avisaremos quando chegar algo.</p>'):'<p class="empty">Toque em ♡ numa oferta para favoritar a loja e receber alertas.</p>';
  bindOffers($('#favs-list'));
}
function renderRes(){
  $('#res-list').innerHTML=reservas.length?reservas.map((r,i)=>`<button class="card offer" data-i="${i}"><div class="thumb">${r.o.emoji}</div><div><h3>${r.o.nome} · ${r.qty} un.</h3><p>${r.o.loja}</p><p>Código <b>${r.code}</b> · ${R(r.total)}</p></div></button>`).join(''):'<p class="empty">Você ainda não reservou nada. Que tal começar pelo início?</p>';
  $$('#res-list .offer').forEach(b=>b.onclick=()=>showConfirm(reservas[+b.dataset.i]));
}
function renderImpact(){
  $('#impact-body').innerHTML=`<p class="brand">SobraBoa</p><h1>Seu impacto</h1>
  <div class="stat"><div class="card"><p class="big">${kgSaved.toFixed(1).replace('.',',')}</p><p>kg de comida salva</p></div>
  <div class="card"><p class="big">${Math.round(saved)}</p><p>reais economizados</p></div></div>
  <div class="card"><b>Meta do mês: 20 kg</b><div class="bar" style="margin-top:10px"><i style="width:${Math.min(100,kgSaved/20*100)}%"></i></div>
  <p class="muted" style="margin-top:8px">Cada kg salvo evita desperdício e emissões de gás metano.</p></div>`;
}

/* ---------- Doações (ONG) ---------- */
function renderDon(){
  $('#don-list').innerHTML=donations.length?donations.map(d=>`<div class="card offer" style="cursor:default"><div class="thumb">${d.emoji}</div><div style="flex:1"><h3>${d.nome}</h3><p>${d.loja}</p><p>${d.info}</p></div></div><button class="btn don" data-id="${d.id}" style="margin:-4px 0 10px">Solicitar retirada</button>`).join(''):'<p class="empty">Sem doações no momento.</p>';
  $$('.don').forEach(b=>b.onclick=()=>{const i=donations.findIndex(d=>d.id==b.dataset.id),d=donations.splice(i,1)[0];comprovantes.unshift(d);toast('Retirada solicitada. Comprovante gerado.');renderDon();renderHist()});
}
function renderHist(){$('#hist').innerHTML='<p class="label">Comprovantes</p>'+(comprovantes.length?comprovantes.map((d,i)=>`<div class="card" style="margin-top:8px"><b>${d.nome}</b><p class="muted">${d.loja} · ${d.info.split(' · ')[0]} · 17/11/2026 · Nº ${String(i+1).padStart(4,'0')}</p></div>`).join(''):'<p class="muted">Nenhuma doação retirada ainda.</p>')}
$('#histBtn').onclick=()=>{renderHist();$('#hist').classList.toggle('hidden')};

/* ---------- Nova oferta (estabelecimento) ---------- */
function novoUpdate(){
  $$('#novo .pane').forEach(p=>p.classList.toggle('hidden',+p.dataset.p!==step));
  $('#novoStep').textContent='Passo '+step+' de 3';$('#novoBar').style.width=step/3*100+'%';
  $('#novoNext').textContent=step===3?'Publicar oferta':'Continuar';
  if(step===3){const p=+$('#n-preco').value;$('#n-resumo').innerHTML=`<b>${$('#n-nome').value}</b><p class="muted">${$('#n-qtd').value} un. · ${R(p)} → <b>${R(p*(1-DISCOUNT))}</b> (50% off)</p><p class="muted">Validade ${$('#n-val').value.split('-').reverse().join('/')} · retirada ${$('#n-ret').value}</p>${$('#n-doar').checked?'<p class="muted">♻️ Sobras serão direcionadas para doação.</p>':''}`}
}
$('#n-preco').oninput=e=>$('#n-final').textContent=R((+e.target.value||0)*(1-DISCOUNT));
$('#n-foto').onclick=()=>toast('Foto adicionada (simulação).');
$('#novoBack').onclick=()=>{if(step>1){step--;novoUpdate()}else back()};
$('#novoNext').onclick=()=>{
  if(step===1&&(!$('#n-nome').value.trim()||!(+$('#n-preco').value>0)))return toast('Informe o produto e o preço original.');
  if(step===2&&!$('#n-val').value)return toast('Informe a data de validade.');
  if(step<3){step++;return novoUpdate()}
  const p=+$('#n-preco').value;
  offers.unshift({id:Date.now(),nome:$('#n-nome').value.trim(),loja:'Minha Loja',tipo:'Mercado',emoji:'🛒',dist:.1,orig:p,qtd:+$('#n-qtd').value||1,val:$('#n-val').value.split('-').reverse().join('/'),ret:'hoje, '+$('#n-ret').value.replace(':','h'),end:'Seu estabelecimento',kg:1});
  step=1;novoUpdate();toast('Oferta publicada com 50% de desconto!');tab('home');
};
$('#support').onclick=()=>toast('Suporte: suporte@sobraboa.com.br');

/* ---------- Persistência (js/storage.js) ---------- */
function persist(){Store.save({offers,reviews,donations,favs:[...favs],reservas,comprovantes,kgSaved,saved})}
function restore(){
  const d=Store.load();if(!d)return;
  ({offers,reviews,donations,reservas,comprovantes,kgSaved,saved}=d);favs=new Set(d.favs);
  reservas.forEach(r=>r.o=offers.find(o=>o.id===r.o.id)||r.o);
}
$('#resetData').onclick=()=>{Store.reset();location.reload()};

/* ---------- Início ---------- */
$('#l-enter').onclick=()=>tab('home');
$('#l-social').onclick=()=>{toast('Conectado com Google (simulação).');tab('home')};
restore();go('login',false);