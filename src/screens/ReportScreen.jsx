/**
 * Relatório semanal com recomendações e nível de evidência; copia um resumo para conversar com o Claude.
 */
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { PageHeader, StatCard } from "../components/ui/feedback";
import { Textarea } from "../components/ui/form";
import { useApp } from "../context/AppContext";
import { EVIDENCE_BADGE, MODE_LABELS, SESSION_TYPE_MODE, STUDY_STAGES } from "../data/constants";
import { copyToClipboard } from "../lib/clipboard";
import { addDays, formatDM, formatMinutes, startOfWeek, today } from "../lib/dates";
import {
  computePriorities,
  currentStage,
  dueReviews,
  errorBreakdown,
  netMinutes,
} from "../lib/planner";
import {
  evidenceLevel,
  executionStats,
  formatPct,
  questionStats,
  scoreSimulado,
  topicStats,
  wilsonInterval,
} from "../lib/stats";

export function ReportScreen() {
  let { state, nav } = useApp(),
    settings = state.settings,
    todayStr = today(),
    [l, o] = useState(0),
    [d, u] = useState(null),
    [L, g] = useState(""),
    m = addDays(startOfWeek(todayStr), -7 * l),
    h = addDays(m, 6),
    f = addDays(m, -7),
    n = addDays(m, -1),
    i = useMemo(() => {
      let I = executionStats(state.sessions, m, h, todayStr),
        A = executionStats(state.sessions, f, n),
        R = (E, me, pa) => E.date >= me && E.date <= pa,
        S = state.questions.filter((E) => R(E, m, h)),
        O = state.questions.filter((E) => R(E, f, n)),
        P = questionStats(S),
        K = questionStats(O),
        B = state.sessions.filter((E) => E.status === "feita" && E.date >= m && E.date <= h),
        H = {
          profundo: 0,
          consolidacao: 0,
          avaliacao: 0,
        };
      B.forEach((E) => (H[SESSION_TYPE_MODE[E.tipo]] += E.actualMin || 0));
      let c = B.reduce((E, me) => E + (me.actualMin || 0), 0),
        p = addDays(m, -7),
        y = addDays(m, -21),
        F = [...new Set(state.topics.map((E) => E.disciplina))].map((E) => {
          let me = state.topics.filter((ze) => ze.disciplina === E).map((ze) => ze.id),
            pa = state.questions.filter((ze) => me.includes(ze.topicId) && R(ze, p, h)),
            ho = state.questions.filter(
              (ze) => me.includes(ze.topicId) && R(ze, y, addDays(p, -1)),
            ),
            Xa = questionStats(pa),
            Ka = questionStats(ho);
          return {
            dn: E,
            a: Xa,
            b: Ka,
            delta: Xa.acc != null && Ka.acc != null ? Xa.acc - Ka.acc : null,
            ok: Xa.valid >= settings.amostraMin && Ka.valid >= settings.amostraMin,
          };
        }),
        U = computePriorities(state, todayStr).filter(
          (E) => E.st.valid >= settings.amostraMin && E.st.acc < 0.6,
        ),
        de = computePriorities(state, todayStr).filter(
          (E) => E.st.valid < settings.amostraMin && E.t.status !== "nao_iniciado",
        ),
        he = dueReviews(state, h),
        Ae = errorBreakdown(S.concat(O)),
        Ke = S.concat(O).filter((E) => E.correto === false).length,
        De = Array.from(
          {
            length: 7,
          },
          (E, me) => netMinutes(settings, addDays(m, me)),
        ).reduce((E, me) => E + me, 0),
        Ut =
          [1, 2, 3, 4]
            .map(
              (E) =>
                executionStats(state.sessions, addDays(m, -7 * E), addDays(m, -7 * E + 6)).done,
            )
            .reduce((E, me) => E + me, 0) / 4,
        Lo = state.simulados
          .filter((E) => E.data >= m && E.data <= h)
          .map((E) => ({
            s: E,
            sc: scoreSimulado(E),
          })),
        He = [];
      if (
        (he.length &&
          He.push({
            t: `Zerar ${he.length} revisão(ões) vencida(s) antes de conteúdo novo`,
            j: `Revisões atrasadas: ${he
              .slice(0, 3)
              .map((E) => E.nome)
              .join(", ")}${he.length > 3 ? "…" : ""}.`,
            ev: "suficiente",
            tipo: "fato",
          }),
        I.planned >= 120 &&
          I.ratio < 0.6 &&
          He.push({
            t: `Reduzir a carga planejada para perto do que você realmente executa (~${formatMinutes(Ut || I.done)}/semana)`,
            j: `Execução de ${formatPct(I.ratio)} do plano (${formatMinutes(I.done)} de ${formatMinutes(I.planned)}). Plano acima da capacidade real gera atraso acumulado.`,
            ev: I.planned >= 300 ? "indicativa" : "insuficiente",
            tipo: "tendência",
          }),
        Ke >= settings.amostraMin &&
          Ae[0] &&
          Ae[0][1] / Ke >= 0.35 &&
          He.push({
            t: `Atacar o erro dominante: “${Ae[0][0]}”`,
            j: `${Ae[0][1]} de ${Ke} erros (${formatPct(Ae[0][1] / Ke)}) nas duas últimas semanas. Isso aponta o tipo de treino, mas não prova causa.`,
            ev: evidenceLevel(Ke, settings.amostraMin),
            tipo: "correlação",
          }),
        U.slice(0, 3).forEach((E) =>
          He.push({
            t: `Reforçar “${E.t.nome}” com questões comentadas e revisão dos erros`,
            j: `Acerto de ${formatPct(E.st.acc)} em n=${E.st.valid}, abaixo de 60%.`,
            ev: evidenceLevel(E.st.valid, settings.amostraMin),
            tipo: "tendência",
          }),
        ),
        de.length &&
          He.push({
            t: `Completar o diagnóstico de ${de.length} assunto(s) com poucas questões`,
            j: `${de
              .slice(0, 3)
              .map((E) => `${E.t.nome} (n=${E.st.valid})`)
              .join(
                "; ",
              )}. Abaixo de ${settings.amostraMin} questões, nenhuma conclusão sobre domínio.`,
            ev: "insuficiente",
            tipo: "lacuna de dados",
          }),
        c >= 180)
      ) {
        let E = STUDY_STAGES[currentStage(state, todayStr)];
        for (let me of ["profundo", "consolidacao", "avaliacao"]) {
          let pa = (H[me] / c) * 100;
          Math.abs(pa - E[me]) >= 20 &&
            He.push({
              t: `Rebalancear o bloco “${MODE_LABELS[me]}”`,
              j: `${pa.toFixed(0)}% do tempo da semana contra alvo de ${E[me]}% no estágio “${E.label}”. Uma semana não define padrão: confirme na próxima.`,
              ev: "indicativa",
              tipo: "tendência",
            });
        }
      }
      return (
        P.avgSec &&
          P.timedN >= 5 &&
          P.avgSec > settings.segPorItemMeta &&
          He.push({
            t: "Treinar velocidade em questões cronometradas",
            j: `Tempo médio de ${Math.round(P.avgSec)} s por item contra meta de ${settings.segPorItemMeta} s (n=${P.timedN}).`,
            ev: evidenceLevel(P.timedN, settings.amostraMin),
            tipo: "tendência",
          }),
        !state.questions.length &&
          !state.sessions.length &&
          He.push({
            t: "Registrar o primeiro bloco de questões diagnósticas",
            j: "Sem registros, o relatório não tem o que analisar. Nada foi estimado.",
            ev: "insuficiente",
            tipo: "lacuna de dados",
          }),
        {
          ex: I,
          pex: A,
          kW: P,
          kP: K,
          byBloco: H,
          totMin: c,
          discs: F,
          crit: U,
          pend: de,
          late: he,
          errs: Ae,
          nErr: Ke,
          capW: De,
          avg4: Ut,
          sims: Lo,
          rec: He,
        }
      );
    }, [state, m]),
    w = wilsonInterval(i.kW.c, i.kW.valid),
    v = state.decisions.filter((I) => I.data >= m && I.data <= h),
    C = () =>
      [
        `# Relatório semanal ${formatDM(m)}–${formatDM(h)}`,
        `Estágio: ${STUDY_STAGES[currentStage(state, todayStr)].label}. Prova principal: ${state.concursos.find((A) => A.id === settings.concursoPrincipal)?.dataProva || "sem data"}.`,
        "",
        `Execução: ${formatMinutes(i.ex.done)} de ${formatMinutes(i.ex.planned)} planejados (${formatPct(i.ex.ratio)}). Capacidade da semana: ${formatMinutes(i.capW)}.`,
        `Questões: ${i.kW.total} (certas ${i.kW.c}, erradas ${i.kW.e}, brancas ${i.kW.b}). Acerto ${formatPct(i.kW.acc)} com n=${i.kW.valid}. Semana anterior: ${formatPct(i.kP.acc)} (n=${i.kP.valid}).`,
        `Erros por tipo (2 semanas): ${i.errs.map(([A, R]) => `${A} ${R}`).join("; ") || "sem erros classificados"}.`,
        `Revisões vencidas: ${i.late.length}. Assuntos críticos (<60%, n≥${settings.amostraMin}): ${i.crit.map((A) => `${A.t.nome} ${formatPct(A.st.acc)} n=${A.st.valid}`).join("; ") || "nenhum"}.`,
        `Assuntos (situação | n | acerto): ${state.topics
          .map((A) => {
            let R = topicStats(state, A.id);
            return `${A.nome} [${A.status} | ${R.valid} | ${R.valid ? formatPct(R.acc) : "—"}]`;
          })
          .join("; ")}.`,
        "",
        "Recomendações geradas pelo painel:",
        ...i.rec.map((A) => `- ${A.t} (${A.j}) [${EVIDENCE_BADGE[A.ev][0]}]`),
        "",
        "Peço ao Claude: 1) o que mudou e qual o impacto no plano; 2) atualizar o diagnóstico separando fato de hipótese; 3) reavaliar prioridades sem reagir a oscilações pequenas; 4) sugerir ajustes ao ciclo e metas realistas; 5) explicar o motivo de cada mudança e o que preciso validar.",
      ].join(`
`),
    x = async () => {
      let I = C();
      (await copyToClipboard(I))
        ? (g("Resumo copiado. Cole na conversa com o Claude."), setTimeout(() => g(""), 3e3))
        : u(I);
    },
    Section = ({ n: I, title: A, children: R }) => <Card title={`${I}. ${A}`}>{R}</Card>,
    N = ({ children: I }) => <p className="text-xs text-muted">{I}</p>;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Relatório semanal"
        sub="Cada recomendação diz em que se apoia e quão forte é a evidência. Uma semana isolada indica, não prova."
      >
        <IconButton icon={ChevronLeft} label="Semana anterior" onClick={() => o(l + 1)} />
        <span className="min-w-[8rem] text-center text-[13px] font-medium">
          {formatDM(m)}
          {" – "}
          {formatDM(h)}
          {l === 0 ? " (atual)" : ""}
        </span>
        <IconButton
          icon={ChevronRight}
          label="Próxima semana"
          disabled={l === 0}
          onClick={() => o(Math.max(0, l - 1))}
        />
        <Button variant="primary" icon={Copy} onClick={x}>
          Copiar resumo para o Claude
        </Button>
      </PageHeader>
      {L && (
        <p role="status" className="rounded-md bg-goodSoft px-3 py-2 text-xs text-goodInk">
          {L}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section n={1} title="Planejado × executado">
          {i.ex.n ? (
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Execução" value={formatPct(i.ex.ratio)} sub={`${i.ex.n} sessões`} />
              <StatCard
                label="Executado"
                value={formatMinutes(i.ex.done)}
                sub={`plano ${formatMinutes(i.ex.planned)}`}
              />
              <StatCard
                label="Semana anterior"
                value={i.pex.ratio == null ? "—" : formatPct(i.pex.ratio)}
              />
            </div>
          ) : (
            <N>Nenhuma sessão planejada nesta semana.</N>
          )}
          {i.totMin > 0 && (
            <p className="mt-3 text-xs text-ink2">
              {"Tempo por bloco: "}
              {Object.entries(i.byBloco)
                .map(([I, A]) => `${MODE_LABELS[I]} ${formatPct(A / i.totMin)}`)
                .join(" · ")}
            </p>
          )}
        </Section>
        <Section n={2} title="Evolução do desempenho">
          {i.kW.valid || i.kP.valid ? (
            <>
              <p className="text-[13px]">
                {"Esta semana: "}
                <b>{formatPct(i.kW.acc)}</b>
                {" (n="}
                {i.kW.valid}
                {i.kW.valid ? `, IC95% ${formatPct(w[0])}–${formatPct(w[1])}` : ""}
                {") · anterior: "}
                <b>{formatPct(i.kP.acc)}</b>
                {" (n="}
                {i.kP.valid})
              </p>
              <p className="mt-1 text-xs text-ink2">
                {i.kW.valid >= settings.amostraMin && i.kP.valid >= settings.amostraMin
                  ? `Diferença de ${((i.kW.acc - i.kP.acc) * 100).toFixed(1)} p.p.: com os intervalos de confiança, só diferenças grandes e repetidas contam como evolução.`
                  : "Amostra abaixo do mínimo em pelo menos uma das semanas: sem conclusão."}
              </p>
            </>
          ) : (
            <N>Sem questões nas duas últimas semanas.</N>
          )}
          {i.sims.length > 0 && (
            <p className="mt-2 text-xs text-ink2">
              {"Simulados da semana: "}
              {i.sims.map(({ s: I, sc: A }) => `${I.nome} ${formatPct(A.pctMax)}`).join(" · ")}
            </p>
          )}
        </Section>
        <Section n={3} title="Disciplinas que mais avançaram">
          {i.discs.some((I) => I.ok) ? (
            <ul className="flex flex-col gap-1.5">
              {i.discs
                .filter((I) => I.ok)
                .sort((I, A) => A.delta - I.delta)
                .map((I) => (
                  <li key={I.dn} className="flex justify-between gap-2 text-[13px]">
                    <span className="truncate">{I.dn}</span>
                    <span className="tabular-nums text-ink2">
                      {formatPct(I.b.acc)}
                      {" → "}
                      {formatPct(I.a.acc)}{" "}
                      <Badge tone={I.delta > 0.05 ? "good" : I.delta < -0.05 ? "crit" : "muted"}>
                        {I.delta >= 0 ? "+" : ""}
                        {(I.delta * 100).toFixed(0)}
                        {" p.p."}
                      </Badge>
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <N>
              {"Compara as últimas 2 semanas com as 2 anteriores, só com n ≥ "}
              {settings.amostraMin}
              {" nos dois períodos. Ainda não há dados suficientes."}
            </N>
          )}
        </Section>
        <Section n={4} title="Assuntos que continuam críticos">
          {i.crit.length ? (
            <ul className="flex flex-col gap-1.5">
              {i.crit.map((I) => (
                <li key={I.t.id} className="flex justify-between gap-2 text-[13px]">
                  <span className="truncate">{I.t.nome}</span>
                  <Badge tone="crit">
                    {formatPct(I.st.acc)}
                    {" · n="}
                    {I.st.valid}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <N>
              Nenhum assunto com acerto abaixo de 60% e amostra suficiente.
              {i.pend.length ? ` ${i.pend.length} ainda sem amostra mínima.` : ""}
            </N>
          )}
        </Section>
        <Section n={5} title="Revisões atrasadas">
          {i.late.length ? (
            <ul className="flex flex-col gap-1.5">
              {i.late.map((I) => (
                <li key={I.id} className="flex justify-between gap-2 text-[13px]">
                  <span className="truncate">{I.nome}</span>
                  <span className="text-xs tabular-nums text-warnInk">
                    {"previsto para "}
                    {formatDM(I.rev.due)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <N>Nenhuma revisão vencida até o fim da semana.</N>
          )}
        </Section>
        <Section n={6} title="Erros recorrentes">
          {i.errs.length ? (
            <ul className="flex flex-col gap-1.5">
              {i.errs.slice(0, 5).map(([I, A]) => (
                <li key={I} className="flex justify-between gap-2 text-[13px]">
                  <span>{I}</span>
                  <span className="tabular-nums text-ink2">
                    {A}
                    {" ("}
                    {formatPct(A / i.nErr)})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <N>Sem erros classificados nas duas últimas semanas.</N>
          )}
        </Section>
        <Section n={7} title="Horas efetivamente disponíveis">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Capacidade" value={formatMinutes(i.capW)} sub="já com margem" />
            <StatCard label="Executado" value={formatMinutes(i.ex.done)} />
            <StatCard
              label="Média 4 semanas"
              value={formatMinutes(Math.round(i.avg4))}
              sub="executado"
            />
          </div>
          {settings.provisorio && (
            <p className="mt-2 text-xs text-warnInk">
              A disponibilidade ainda é provisória: confirme em Configurações.
            </p>
          )}
        </Section>
        <Section n={9} title="Alterações sugeridas no ciclo">
          <p className="text-[13px]">
            {i.crit.length
              ? `Dar mais voltas aos blocos de ${[...new Set(i.crit.map((I) => I.t.disciplina))].join(", ")}.`
              : i.pend.length
                ? "Manter o ciclo e usar os próximos blocos para completar o diagnóstico."
                : "Sem base para alterar o ciclo: mantenha-o até haver dados."}
          </p>
          <Button size="sm" className="mt-2" onClick={() => nav("cronograma")}>
            Abrir ciclo
          </Button>
        </Section>
      </div>
      <Card title="8 e 10. Recomendações para a próxima semana e justificativa">
        {i.rec.length ? (
          <ul className="flex flex-col divide-y divide-line">
            {i.rec.map((I, A) => (
              <li key={A} className="py-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[13px] font-medium">{I.t}</span>
                  <Badge tone={EVIDENCE_BADGE[I.ev][1]}>{EVIDENCE_BADGE[I.ev][0]}</Badge>
                  <Badge tone="muted">{I.tipo}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-ink2">{I.j}</p>
              </li>
            ))}
          </ul>
        ) : (
          <N>Sem recomendações: nada fora do esperado nesta semana, ou ainda sem dados.</N>
        )}
        {v.length > 0 && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="mb-1 text-xs font-medium text-ink2">Mudanças registradas na semana</p>
            <ul className="text-xs text-ink2">
              {v.map((I) => (
                <li key={I.id}>
                  {formatDM(I.data)}
                  {" · "}
                  {I.motivo} <span className="text-muted">({I.acao})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted">
          <b>Fato</b>
          {": contagem direta. "}
          <b>Tendência</b>
          {": padrão em poucos pontos. "}
          <b>Correlação</b>
          {": coincidência de dois sinais, sem causa comprovada. "}
          <b>Evidência suficiente</b>
          {": n ≥ "}
          {3 * settings.amostraMin}
          {"; "}
          <b>indicativo</b>
          {": n ≥ "}
          {settings.amostraMin}.
        </p>
      </Card>
      <Modal open={!!d} onClose={() => u(null)} title="Selecione e copie">
        <Textarea
          readOnly
          className="min-h-[260px] font-mono text-xs"
          value={d || ""}
          onFocus={(I) => I.target.select()}
        />
      </Modal>
    </div>
  );
}
