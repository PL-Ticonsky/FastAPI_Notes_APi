const API_BASE = `${location.protocol}//${location.hostname}:8000`;
const $ = (id) => document.getElementById(id);
const state = { notes: [], filter: 'all', query: '', sort: 'updated', view: 'grid', loading: false, error: '', saving: false, deleting: false, pendingDelete: null, original: '' };
const dateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
const roman = (n) => { let r = ''; for (const [v,s] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]) { while(n>=v){r+=s;n-=v;} } return r; };
const escapeHtml = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
let toastTimer;
function toast(message) { clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false; toastTimer=setTimeout(()=>$('toast').hidden=true,4500); }
async function api(path, options={}) {
  let res;
  try { res=await fetch(API_BASE+path,{...options,headers:{'Content-Type':'application/json',...options.headers},signal:AbortSignal.timeout(12000)}); }
  catch { throw new Error('No pudimos conectar con el archivo. Revisa la conexión e inténtalo de nuevo.'); }
  if(res.status===204)return null;
  const data=await res.json().catch(()=>null);
  if(!res.ok){
    if(res.status===404)throw new Error('Este manuscrito ya no está en el archivo. Actualiza la colección.');
    if(res.status===422)throw new Error('Revisa el título (1–200 caracteres) y el texto (hasta 5000 caracteres).');
    throw new Error('No se pudo completar la operación. Inténtalo de nuevo.');
  }
  return data;
}
function connection(ok){$('connection').replaceChildren();const dot=document.createElement('span');dot.className='status-dot'+(ok?'':' offline');$('connection').append(dot,document.createTextNode(ok?'Archivo conectado':'Sin conexión'));}
async function loadNotes(){
  if(state.loading)return;
  state.loading=true;state.error='';$('refresh').disabled=true;render();
  try { state.notes=await api('/notes');connection(true); }
  catch(e){state.error=e.message;connection(false);}
  finally{state.loading=false;$('refresh').disabled=false;render();}
}
function visibleNotes(){
  const cutoff=Date.now()-7*24*60*60*1000;
  return state.notes.filter(n=>(state.filter==='all'||new Date(n.updated_at).getTime()>=cutoff)&&normalize(n.title+' '+n.content).includes(normalize(state.query))).sort((a,b)=>state.sort==='title'?a.title.localeCompare(b.title,'es'):new Date(b[state.sort==='created'?'created_at':'updated_at'])-new Date(a[state.sort==='created'?'created_at':'updated_at'])||a.id.localeCompare(b.id));
}
function render(){
  const notes=visibleNotes();
  $('totalCount').textContent=state.loading&&!state.notes.length?'—':state.notes.length;
  $('resultCount').textContent=state.loading?'Consultando el archivo…':`${notes.length} ${notes.length===1?'manuscrito':'manuscritos'}${state.query?' encontrados':''}`;
  $('notesList').setAttribute('aria-busy',String(state.loading));
  $('notesList').className='notes-grid'+(state.view==='list'?' list-view':'');
  const status=$('collectionStatus');status.hidden=true;status.replaceChildren();
  if(state.error||(!notes.length&&!state.loading)){
    status.hidden=false;
    const heading=document.createElement('h3'),description=document.createElement('p'),button=document.createElement('button');button.className='button secondary';
    if(state.error){heading.textContent='El archivo no está disponible';description.textContent=state.error;button.textContent='Volver a intentar';button.onclick=loadNotes;}
    else if(state.query){heading.textContent='Estas palabras aún no están aquí';description.textContent='Prueba otro término o vuelve a ver la colección completa.';button.textContent='Limpiar búsqueda';button.onclick=()=>{$('search').value='';state.query='';render();$('search').focus();};}
    else {heading.textContent=state.filter==='recent'?'Sin manuscritos recientes':'Toda historia comienza con una página en blanco';description.textContent=state.filter==='recent'?'Aquí aparecerán las notas modificadas en los últimos siete días.':'Escribe tu primera nota y comienza a dar forma a tu archivo.';button.textContent='Nuevo manuscrito';button.onclick=()=>openEditor();}
    status.append(heading,description,button);
  }else if(state.loading&&!state.notes.length){status.hidden=false;status.textContent='Abriendo el archivo…';}
  $('notesList').innerHTML=notes.map((n,i)=>`<article class="note-card" data-id="${escapeHtml(n.id)}"><div class="card-meta"><span>FOLIO ${roman(i+1)}</span><span class="flourish" aria-hidden="true">❧</span></div><button class="note-open" data-action="edit" aria-label="Abrir ${escapeHtml(n.title)}"><h3>${escapeHtml(n.title)}</h3><p class="note-content${n.content?'':' empty-content'}">${escapeHtml(n.content||'Una página a la espera de tus palabras…')}</p></button><div class="card-bottom"><time class="card-date" datetime="${escapeHtml(n.updated_at)}" title="Última modificación">${dateFormat.format(new Date(n.updated_at))}</time><div class="card-actions"><button class="icon-button" data-action="edit" aria-label="Editar ${escapeHtml(n.title)}" title="Editar manuscrito">${icon('quill')}</button><button class="icon-button delete-note" data-action="delete" aria-label="Eliminar ${escapeHtml(n.title)}" title="Eliminar manuscrito">${icon('trash')}</button></div></div></article>`).join('');
}
function formSnapshot(){return JSON.stringify([$('title').value,$('content').value]);}
let editorTrigger=null;
function openEditor(note=null){
  editorTrigger=document.activeElement;
  $('noteId').value=note?.id||'';$('title').value=note?.title||'';$('content').value=note?.content||'';
  $('editorHeading').textContent=note?'Entre tinta y memoria':'Un nuevo manuscrito';
  $('editDate').textContent=note?`Última modificación: ${dateFormat.format(new Date(note.updated_at))}`:'Un espacio en blanco, infinitas posibilidades.';
  $('formMsg').textContent='';$('charCount').textContent=`${$('content').value.length} / 5000`;
  state.original=formSnapshot();$('editor').showModal();$('title').focus();
}
function closeEditor(){
  if(state.saving)return;
  if(formSnapshot()!==state.original&&!confirm('Tienes palabras sin guardar. ¿Quieres salir y descartar los cambios?'))return;
  $('editor').close();
}
$('editor').addEventListener('close',()=>{if(editorTrigger?.isConnected)editorTrigger.focus();else $('newNote').focus();});
$('editor').addEventListener('cancel',e=>{e.preventDefault();closeEditor();});
$('closeEditor').onclick=closeEditor;$('cancelEditor').onclick=closeEditor;$('newNote').onclick=()=>openEditor();
$('content').addEventListener('input',()=>{$('charCount').textContent=`${$('content').value.length} / 5000`;});
$('noteForm').addEventListener('submit',async e=>{
  e.preventDefault();if(state.saving)return;
  const payload={title:$('title').value.trim(),content:$('content').value};
  if(!payload.title){$('formMsg').textContent='Dale un título a tu manuscrito antes de guardarlo.';$('title').focus();return;}
  state.saving=true;$('saveBtn').disabled=true;$('closeEditor').disabled=true;$('cancelEditor').disabled=true;$('title').readOnly=true;$('content').readOnly=true;$('saveBtn').querySelector('span').textContent='Guardando…';$('formMsg').textContent='';
  const id=$('noteId').value;
  try{
    const note=await api(id?`/notes/${id}`:'/notes',{method:id?'PUT':'POST',body:JSON.stringify(payload)});
    state.notes=id?state.notes.map(n=>n.id===id?note:n):[note,...state.notes];state.error='';connection(true);state.original=formSnapshot();$('editor').close();render();toast(id?'Los cambios han quedado en tinta.':'Un nuevo manuscrito se une a tu archivo.');
  }catch(err){$('formMsg').textContent=err.message;}
  finally{state.saving=false;$('saveBtn').disabled=false;$('closeEditor').disabled=false;$('cancelEditor').disabled=false;$('title').readOnly=false;$('content').readOnly=false;$('saveBtn').querySelector('span').textContent='Guardar manuscrito';}
});
let deleteTrigger=null;
$('notesList').addEventListener('click',e=>{
  const button=e.target.closest('[data-action]');if(!button)return;
  const note=state.notes.find(n=>n.id===button.closest('[data-id]').dataset.id);if(!note)return;
  if(button.dataset.action==='edit')openEditor(note);
  else{deleteTrigger=button;state.pendingDelete=note;$('deleteDescription').textContent=`«${note.title}» se eliminará de tu colección.`;$('deleteError').textContent='';$('deleteDialog').showModal();$('cancelDelete').focus();}
});
$('cancelDelete').onclick=()=>{if(!state.deleting)$('deleteDialog').close();};
$('deleteDialog').addEventListener('cancel',e=>{if(state.deleting)e.preventDefault();});
$('deleteDialog').addEventListener('close',()=>{state.pendingDelete=null;if(deleteTrigger?.isConnected)deleteTrigger.focus();else $('newNote').focus();});
$('confirmDelete').onclick=async()=>{
  if(state.deleting||!state.pendingDelete)return;
  state.deleting=true;$('confirmDelete').disabled=true;$('cancelDelete').disabled=true;$('confirmDelete').textContent='Eliminando…';
  const id=state.pendingDelete.id;
  try{await api(`/notes/${id}`,{method:'DELETE'});state.notes=state.notes.filter(n=>n.id!==id);render();$('deleteDialog').close();toast('Manuscrito eliminado del archivo.');}
  catch(e){$('deleteError').textContent=e.message;}
  finally{state.deleting=false;$('confirmDelete').disabled=false;$('cancelDelete').disabled=false;$('confirmDelete').textContent='Sí, eliminar';}
};
$('search').addEventListener('input',e=>{state.query=e.target.value;render();});
$('sort').addEventListener('change',e=>{state.sort=e.target.value;render();});
$('refresh').onclick=loadNotes;
for(const button of document.querySelectorAll('[data-filter]'))button.onclick=()=>{
  state.filter=button.dataset.filter;
  for(const item of document.querySelectorAll('[data-filter]')){item.classList.toggle('active',item===button);if(item===button)item.setAttribute('aria-current','page');else item.removeAttribute('aria-current');}
  $('collectionTitle').textContent=state.filter==='all'?'La colección':'Páginas recientes';$('breadcrumb').textContent=state.filter==='all'?'MANUSCRITOS':'RECIENTES';render();
};
for(const view of ['grid','list'])$(view+'View').onclick=()=>{state.view=view;for(const v of ['grid','list']){$(v+'View').classList.toggle('selected',v===view);$(v+'View').setAttribute('aria-pressed',String(v===view));}render();};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)&&!document.querySelector('dialog[open]')){e.preventDefault();$('search').focus();}});
loadNotes();
