import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, newConcurso, newTopic } from "../src/data/defaults.js";
import { LEGACY_KEY, WORKSPACE_KEY, loadWorkspace, emptyWorkspace, saveWorkspace, updateActiveState, newProfile, mergeWorkspaceProfiles, validateWorkspaceBackup } from "../src/data/workspace.js";
import { parseTopicLines, parseStructuredEdital, mergeEditalTopics } from "../src/lib/edital.js";
import { activeTopics, computePriorities, dueReviews, generatePlan, netMinutes, regenerateUpcomingPlan, currentStage } from "../src/lib/planner.js";
import { addDays, weekdayIndex } from "../src/lib/dates.js";
import { scoreSimulado } from "../src/lib/stats.js";

function memoryStorage() {
  const map = new Map();
  return { getItem: key => map.get(key) || null, setItem: (key,val) => map.set(key,val), has: k => map.has(k) };
}
function makeCourse() {
  const a = createInitialState(), c = { ...newConcurso(), orgao: "Concurso neutro", cargo: "Analista", prioridade: 5 };
  const topic = { ...newTopic(a), disciplina: "Português", nome: "Interpretação", concursos: [c.id] };
  return { ...a, concursos: [c], topics: [topic], settings: { ...a.settings, concursoPrincipal: c.id, horasDia: [60,60,60,60,60,60,60] } };
}

test("instalação limpa não impõe CGU ou qualquer concurso", () => {
  const a = createInitialState();
  assert.equal(a.concursos.length, 0); assert.equal(a.topics.length,0);
  assert.equal(a.settings.concursoPrincipal, "");
  assert.equal(a.settings.horasDia.reduce((s,n)=>s+n,0),0);
});
test("primeira abertura inicia onboarding e sem disciplinas", () => {
  const w=loadWorkspace(memoryStorage());
  assert.equal(w.profiles.length, 1); assert.equal(w.profiles[0].onboarded, false);
});
test("migração v1 preserva dados e a chave legada", () => {
  const store=memoryStorage(), legacy=createInitialState({legacyExamples:true});
  legacy.sessions=[{id:"sess-legacy", date:"2026-10-22",status:"feita",actualMin:50}];
  store.setItem(LEGACY_KEY,JSON.stringify(legacy));
  const migrated=loadWorkspace(store);
  assert.equal(migrated.profiles[0].name,"Meu histórico original");
  assert.equal(migrated.profiles[0].state.concursos.length,legacy.concursos.length);
  assert.equal(migrated.profiles[0].state.sessions[0].id,"sess-legacy");
  assert.equal(saveWorkspace(migrated,store),true);
  assert.ok(store.getItem(LEGACY_KEY)); assert.ok(store.getItem(WORKSPACE_KEY));
});
test("perfil A e B isolados após persistência e troca", () => {
  const store=memoryStorage(), a=makeCourse(), p1=newProfile("A",a,true),p2=newProfile("B",createInitialState(),false);
  const w={version:2,activeProfileId:p1.id,profiles:[p1,p2]};
  const out=updateActiveState(w,prev=>({...prev,questions:[{id:"q1",correto:false}]}));
  assert.equal(out.profiles[1].state.questions.length,0);
  assert.equal(out.profiles[0].state.questions.length,1);
  saveWorkspace(out,store);
  const restored=loadWorkspace(store);
  assert.equal(restored.profiles[1].state.questions.length,0);
  assert.equal(restored.profiles[0].state.questions[0].id,"q1");
});
test("backup workspace completo é validado e incorporado sem sobrescrever", () => {
  const w=emptyWorkspace(), incoming=emptyWorkspace();
  assert.equal(validateWorkspaceBackup(incoming),true);
  const mixed=mergeWorkspaceProfiles(w,incoming);
  assert.equal(mixed.profiles.length,2);
  assert.notEqual(mixed.profiles[0].id,mixed.profiles[1].id);
  assert.equal(w.profiles.length,1);
});
test("workspace inválido não é sobrescrito", () => {
  const store=memoryStorage();store.setItem(WORKSPACE_KEY,'{"version":2,"profiles":[null]}');
  const w=loadWorkspace(store);
  assert.ok(w.storageError);
  assert.equal(saveWorkspace(w,store),false);
  assert.equal(store.getItem(WORKSPACE_KEY),'{"version":2,"profiles":[null]}');
});
test("texto de edital e JSON estruturado identificam disciplinas e eliminam duplicatas", () => {
  const parsed=parseTopicLines("Português:\n- Concordância verbal\n- Interpretação\nPortuguês | Concordância verbal\nAdministração | Gestão pública");
  assert.equal(parsed.rows.length,3);
  const json=parseStructuredEdital({disciplinas:[{nome:"Direito",topicos:["Atos administrativos","Serviços públicos"]}]});
  assert.equal(json.rows.length,2);
});
test("reimportação da mesma matriz não duplica; concursos distintos ficam separados", () => {
  const a=createInitialState(), c1="c1",c2="c2";
  const rows=parseTopicLines("Direito | Leis").rows;
  const first=mergeEditalTopics([],rows,c1,()=>newTopic(a));
  const repeated=mergeEditalTopics(first.topics,rows,c1,()=>newTopic(a));
  assert.equal(repeated.added,0);
  const second=mergeEditalTopics(repeated.topics,rows,c2,()=>newTopic(a));
  assert.equal(second.topics.length,2);
  assert.deepEqual(second.topics.map(x=>x.concursos),[[c1],[c2]]);
});
test("não planeja nem revisa assuntos de concurso inativo", () => {
  const a=makeCourse();
  a.topics[0].rev={stage:1,due:"2026-09-01",history:[]};
  assert.equal(dueReviews(a,"2026-11-06").length,1);
  a.concursos[0].ativo=false;
  assert.equal(activeTopics(a).length,0);
  assert.equal(dueReviews(a,"2026-11-06").length,0);
  assert.equal(computePriorities(a,"2026-11-06").length,0);
  assert.equal(generatePlan(a,"2026-11-06",14).sessions.length,0);
});
test("só cria sessões em dias disponíveis, sem ultrapassar capacidade", () => {
  const a=makeCourse(); a.settings.horasDia=[0,120,0,0,0,0,0]; a.settings.bufferPct=25;
  const start="2026-11-09", result=generatePlan(a,start,21);
  assert.ok(result.sessions.length>0);
  for (const s of result.sessions) {
    assert.equal(weekdayIndex(s.date),1);
    assert.ok(s.plannedMin>0);
  }
  const byDay=new Map();
  for (const s of result.sessions) byDay.set(s.date,(byDay.get(s.date)||0)+s.plannedMin);
  for (const [day,min] of byDay) assert.ok(min<=netMinutes(a.settings,day),`${day}: ${min}`);
});
test("regeração preserva tarefas concluídas e manuais, remove só automáticas pendentes", () => {
  const a=makeCourse(); const start="2026-11-06";
  a.sessions=[
    {id:"done",date:start,status:"feita",auto:true,plannedMin:40,actualMin:40,topicIds:[a.topics[0].id],concursoIds:[a.concursos[0].id]},
    {id:"manual",date:start,status:"planejada",auto:false,plannedMin:20,topicIds:[a.topics[0].id],concursoIds:[a.concursos[0].id]},
    {id:"future",date:addDays(start,1),status:"planejada",auto:true,plannedMin:40,topicIds:[a.topics[0].id],concursoIds:[a.concursos[0].id]},
  ];
  const result=regenerateUpcomingPlan(a,start,14);
  assert.equal(result.removed,1);
  assert.ok(result.sessions.some(s=>s.id==="done"));
  assert.ok(result.sessions.some(s=>s.id==="manual"));
  assert.ok(!result.sessions.some(s=>s.id==="future"));
});
test("sem horas ou sem matérias, não agenda sessões artificiais", () => {
  const a=makeCourse(); a.settings.horasDia=[0,0,0,0,0,0,0];
  assert.equal(generatePlan(a,"2026-11-06",7).sessions.length,0);
  a.settings.horasDia=[60,60,60,60,60,60,60]; a.topics=[];
  assert.equal(generatePlan(a,"2026-11-06",7).sessions.length,0);
});
test("simulado múltipla escolha não pune erros quando penalidade é zero", () => {
  const s={regra:{acerto:1,erro:0},rows:[{itens:10,acertos:6,erros:4,brancos:0,peso:1}]};
  assert.equal(scoreSimulado(s).pts,6);
});

test("CSV por disciplina e assunto funciona com separador e campos entre aspas", async () => {
  const { parseCsvTopics } = await import("../src/lib/edital.js");
  const result = parseCsvTopics('disciplina;assunto\nPortuguês;"Redação, coerência"\nDireito;Atos administrativos');
  assert.equal(result.rows.length,2);
  assert.equal(result.rows[0].nome,"Redação, coerência");
});
test("pontuação de simulado respeita valor de acerto diferente de 1", () => {
  const result = scoreSimulado({regra:{acerto:2,erro:0.5},rows:[{itens:10,acertos:6,erros:4,brancos:0,peso:1}]});
  assert.equal(result.pts,10); assert.equal(result.max,20);
});

test("PDF com conteúdo ambíguo não cria disciplinas fictícias", async () => {
  const { suggestFromDocumentText } = await import("../src/lib/edital.js");
  assert.equal(suggestFromDocumentText("Edital número 42\nCapítulo de inscrições\nNão há conteúdo programático aqui.").rows.length,0);
});
