import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const SUPER_ADMIN_PASSWORD = "W@Huimai2";
const STORAGE_ORGS = "cg360_orgs";
const STORAGE_RESPOSTAS = "cg360_respostas";
const STORAGE_FORMS = "cg360_forms";

const DEFAULT_SCALE_LABELS = {
  1:"Raramente", 2:"Às vezes", 3:"Frequentemente", 4:"Quase sempre", 5:"Sempre", 0:"Não sei avaliar"
};
const SC = {0:"#94a3b8",1:"#ef4444",2:"#f97316",3:"#eab308",4:"#22c55e",5:"#10b981"};

// ─── SCALE MODELS ────────────────────────────────────────────────────
const SCALE_MODELS = {
  frequencia: {
    id: "frequencia",
    name: "Frequência",
    icon: "🔁",
    description: "Com que frequência esse comportamento é observado?",
    tip: "Recomendado para a maioria das organizações. Universal, humano e fácil de responder.",
    labels: {1:"Raramente", 2:"Às vezes", 3:"Frequentemente", 4:"Quase sempre", 5:"Sempre", 0:"Não sei avaliar"},
  },
  concordancia: {
    id: "concordancia",
    name: "Concordância",
    icon: "✅",
    description: "Você concorda com esta afirmação sobre a pessoa?",
    tip: "Mais corporativo. Funciona bem com perguntas no formato de afirmações.",
    labels: {1:"Discordo totalmente", 2:"Discordo", 3:"Neutro", 4:"Concordo", 5:"Concordo totalmente", 0:"Sem elementos para avaliar"},
  },
  maturidade: {
    id: "maturidade",
    name: "Maturidade",
    icon: "📈",
    description: "Qual o nível de desenvolvimento nessa área?",
    tip: "Focado em crescimento. Ideal quando o objetivo é criar planos de desenvolvimento.",
    labels: {1:"Precisa melhorar", 2:"Em desenvolvimento", 3:"Adequado", 4:"Muito bom", 5:"Excelente", 0:"Não consigo avaliar"},
  },
};
function getScaleLabels(modelId){ return SCALE_MODELS[modelId]?.labels || SCALE_MODELS.frequencia.labels; }
const DEFAULT_YESNO_LABELS = {1:"Sim", 2:"Atenção", 0:"Não"};
const YESNO_COLORS = {1:"#ef4444", 2:"#f59e0b", 0:"#10b981"};
// SCALE is built dynamically from org settings — see getScale() in App
function gerarCiclos(){const ano=new Date().getFullYear();const inicio=Math.max(ano,2026);const r=[];for(let a=inicio;a<=inicio+3;a++){r.push(`${a} - 1º Semestre`);r.push(`${a} - 2º Semestre`);}return r;}
const CICLOS=gerarCiclos();
const LGPD = "Suas respostas são completamente anônimas. Nenhum dado pessoal identificável é coletado. Os administradores do sistema visualizam apenas resultados agregados, sem identificação de quem respondeu. Os dados são utilizados exclusivamente para fins de desenvolvimento organizacional interno, conforme a LGPD (Lei nº 13.709/2018). Você pode interromper o preenchimento a qualquer momento.";


// ─── FORMULÁRIOS ADAPTATIVOS POR TIPO DE ORGANIZAÇÃO ─────────────────
function getDefaultFormsForOrg(orgType) {
  const isReligiosa = !orgType || orgType === "religiosa";

  const blocoEspiritual = isReligiosa
    ? { id:"espiritualidade", title:"Vida espiritual e coerência", icon:"✝️",
        perguntas:[
          "Tenho sido fiel nas minhas práticas devocionais.",
          "Tenho sido coerente com minhas palavras e ações.",
          "Tenho reagido a críticas e correções com humildade.",
          "Tenho buscado a vontade de Deus para minhas decisões.",
          "Minha prática ministerial tem refletido os objetivos que defini no meu planejamento anual.",
        ],
        abertas:["Em quais áreas você percebe maior crescimento espiritual no último período?","Em quais áreas sente maior fragilidade atualmente?"]}
    : { id:"espiritualidade", title:"Propósito e valores pessoais", icon:"🧭",
        perguntas:[
          "Tenho agido de forma coerente com meus valores pessoais.",
          "Tenho sido honesto e íntegro nas minhas decisões.",
          "Tenho reagido a críticas e correções com humildade.",
          "Tenho buscado clareza sobre meu propósito e direção de vida.",
          "Minha prática tem refletido os objetivos que defini no meu descritivo de função.",
        ],
        abertas:["Em quais áreas você percebe maior crescimento pessoal no último período?","Em quais áreas sente maior fragilidade atualmente?"]};

  const blocoImpacto = isReligiosa
    ? { id:"impacto", title:"Impacto e resultados", icon:"🌱",
        perguntas:[
          "Tenho produzido impacto positivo nas pessoas ao meu redor.",
          "Tenho desenvolvido outras pessoas e multiplicado meu ministério.",
          "Tenho alcançado as metas estabelecidas no meu planejamento ministerial.",
          "Tenho desenvolvido novas habilidades.",
        ],
        abertas:["Onde você percebe maior fruto atualmente?","Onde gostaria de crescer no próximo ciclo?"]}
    : { id:"impacto", title:"Impacto e resultados", icon:"🌱",
        perguntas:[
          "Tenho produzido impacto positivo nas pessoas ao meu redor.",
          "Tenho desenvolvido outras pessoas para fazerem o que eu faço.",
          "Tenho alcançado as metas estabelecidas no meu descritivo de função.",
          "Tenho desenvolvido novas habilidades.",
        ],
        abertas:["Onde você percebe maiores resultados atualmente?","Onde gostaria de crescer no próximo ciclo?"]};

  const blocoSaudeEmocional = isReligiosa
    ? { id:"saude_emocional", title:"Saúde emocional", icon:"💙",
        perguntas:[
          "Tenho conseguido lidar de forma saudável com pressões e frustrações.",
          "Tenho percebido equilíbrio entre ministério, vida pessoal e familiar.",
          "Tenho conseguido pedir ajuda quando necessário.",
          "Tenho chegado às minhas atividades ministeriais com disposição e motivação.",
          "Tenho conseguido estabelecer limites saudáveis.",
        ],
        abertas:["Quais são hoje suas maiores fontes de desgaste?","O que mais tem fortalecido você emocionalmente?"]}
    : { id:"saude_emocional", title:"Saúde emocional", icon:"💙",
        perguntas:[
          "Tenho conseguido lidar de forma saudável com pressões e frustrações.",
          "Tenho percebido equilíbrio entre trabalho, vida pessoal e familiar.",
          "Tenho conseguido pedir ajuda quando necessário.",
          "Tenho chegado às minhas atividades com disposição e motivação.",
          "Tenho conseguido estabelecer limites saudáveis.",
        ],
        abertas:["Quais são hoje suas maiores fontes de desgaste?","O que mais tem fortalecido você emocionalmente?"]};

  // Autoavaliação com dimensões alinhadas às demais perspectivas
  return [
    { id:"autoavaliacao", title:"Autoavaliação", icon:"🪞", subtitle:"Um espaço honesto e seguro para olhar para si mesmo",
      blocos:[
        blocoEspiritual,
        blocoSaudeEmocional,
        { id:"relacionamentos", title:"Relacionamentos e convivência", icon:"🤝",
          perguntas:[
            "Tenho contribuído para que meus ambientes sejam saudáveis.",
            "Tenho escutado opiniões diferentes sem defensividade.",
            "Tenho lidado bem com conflitos.",
            "Tenho sido acessível e respeitoso nas relações.",
            "Tenho colaborado com minha(s) equipe(s) de trabalho.",
          ],
          abertas:["O que você acredita que mais fortalece suas relações?","Onde você acredita que precisa amadurecer relacionalmente?"]},
        { id:"comunicacao", title:"Comunicação", icon:"💬",
          perguntas:[
            "Tenho me comunicado com clareza.",
            "Tenho dado feedbacks respeitosos e honestos.",
            "Tenho escutado atentamente as pessoas.",
            "Tenho comunicado expectativas de maneira saudável.",
          ],
          abertas:["Em quais situações sua comunicação funciona melhor?","O que você deseja desenvolver na sua comunicação?"]},
        { id:"alinhamento", title:"Alinhamento e cultura", icon:"⛵",
          perguntas:[
            "Tenho representado bem os valores da organização.",
            "Tenho contribuído para a unidade da organização.",
            "Tenho fortalecido a cultura de cuidado e cooperação.",
            "Tenho mantido alinhamento com a liderança e suas diretrizes.",
          ],
          abertas:["O que mais conecta você ao propósito da organização?","O que hoje dificulta seu alinhamento ou engajamento?"]},
        blocoImpacto,
        { id:"saude_integral_auto", title:"Saúde integral", icon:"💚",
          perguntas:[
            "Minhas relações familiares estão saudáveis.",
            "Tenho descansado adequadamente.",
            "Tenho mantido regularidade nos exercícios físicos.",
            "Tenho cuidado da minha alimentação.",
            "Tenho lidado bem com minhas frustrações.",
          ],
          abertas:[]},
      ]},
  ];
}


const DEFAULT_FORMS = [
  // ── AUTOAVALIAÇÃO ──────────────────────────────────────────────
  { id:"autoavaliacao", title:"Autoavaliação", icon:"🪞", subtitle:"Um espaço honesto e seguro para olhar para si mesmo",
    blocos:[
      { id:"espiritualidade", title:"Vida espiritual e coerência", icon:"✝️",
        perguntas:[
          "Tenho sido fiel nas minhas práticas devocionais.",
          "Tenho sido coerente com minhas palavras e ações.",
          "Tenho reagido a críticas e correções com humildade.",
          "Tenho buscado a vontade de Deus para minhas decisões.",
          "Minha prática ministerial tem refletido os objetivos que defini no meu planejamento anual.",
        ],
        abertas:["Em quais áreas você percebe maior crescimento espiritual no último período?","Em quais áreas sente maior fragilidade atualmente?"]},
      { id:"saude_emocional", title:"Saúde emocional", icon:"💙",
        perguntas:[
          "Tenho conseguido lidar de forma saudável com pressões e frustrações.",
          "Tenho percebido equilíbrio entre ministério, vida pessoal e familiar.",
          "Tenho conseguido pedir ajuda quando necessário.",
          "Tenho chegado às minhas atividades ministeriais com disposição e motivação.",
          "Tenho conseguido estabelecer limites saudáveis.",
        ],
        abertas:["Quais são hoje suas maiores fontes de desgaste?","O que mais tem fortalecido você emocionalmente?"]},
      { id:"relacionamentos", title:"Relacionamentos e convivência", icon:"🤝",
        perguntas:[
          "Tenho contribuído para que meus ambientes sejam saudáveis.",
          "Tenho escutado opiniões diferentes sem defensividade.",
          "Tenho lidado bem com conflitos.",
          "Tenho sido acessível e respeitoso nas relações.",
          "Tenho colaborado com minha(s) equipe(s) de trabalho.",
        ],
        abertas:["O que você acredita que mais fortalece suas relações?","Onde você acredita que precisa amadurecer relacionalmente?"]},
      { id:"comunicacao", title:"Comunicação", icon:"💬",
        perguntas:[
          "Tenho me comunicado com clareza.",
          "Tenho dado feedbacks respeitosos e honestos.",
          "Tenho escutado atentamente as pessoas.",
          "Tenho comunicado expectativas de maneira saudável.",
        ],
        abertas:["Em quais situações sua comunicação funciona melhor?","O que você deseja desenvolver na sua comunicação?"]},
      { id:"alinhamento", title:"Alinhamento e cultura", icon:"⛵",
        perguntas:[
          "Tenho representado bem os valores da organização.",
          "Tenho contribuído para a unidade da organização.",
          "Tenho fortalecido a cultura de cuidado e cooperação.",
          "Tenho mantido alinhamento com a liderança e suas diretrizes.",
        ],
        abertas:["O que mais conecta você ao propósito da organização?","O que hoje dificulta seu alinhamento ou engajamento?"]},
      { id:"impacto", title:"Impacto e resultados", icon:"🌱",
        perguntas:[
          "Tenho produzido impacto positivo nas pessoas ao meu redor.",
          "Tenho desenvolvido outras pessoas e multiplicado meu ministério.",
          "Tenho alcançado as metas estabelecidas no meu planejamento ministerial.",
          "Tenho desenvolvido novas habilidades.",
        ],
        abertas:["Onde você percebe maior fruto atualmente?","Onde gostaria de crescer no próximo ciclo?"]},
      { id:"saude_integral_auto", title:"Saúde integral", icon:"💚",
        perguntas:[
          "Minhas relações familiares estão saudáveis.",
          "Tenho descansado adequadamente.",
          "Tenho mantido regularidade nos exercícios físicos.",
          "Tenho cuidado da minha alimentação.",
          "Tenho lidado bem com minhas frustrações.",
        ],
        abertas:[]},
    ]},

  // ── AVALIAÇÃO DE PARES ──────────────────────────────────────────
  { id:"pares", title:"Avaliação de Pares", icon:"👥", subtitle:"Compartilhe com cuidado e honestidade",
    blocos:[
      { id:"relacionamentos_par", title:"Relacionamentos e convivência", icon:"🤝",
        perguntas:[
          "Esta pessoa contribui para um ambiente saudável.",
          "Trata as pessoas com respeito e consideração.",
          "Trabalha bem em equipe, demonstrando cooperação.",
          "Demonstra humildade nos relacionamentos.",
          "Resolve conflitos com maturidade.",
          "Escuta opiniões diferentes com abertura.",
        ],
        abertas:[]},
      { id:"comunicacao_par", title:"Comunicação", icon:"💬",
        perguntas:[
          "Comunica-se de forma clara e objetiva.",
          "Compartilha informações importantes adequadamente.",
          "Escuta com atenção.",
          "Demonstra abertura ao diálogo.",
          "Quando precisa corrigir ou orientar, faz isso de forma respeitosa.",
        ],
        abertas:[]},
      { id:"maturidade_par", title:"Maturidade emocional", icon:"🧘",
        perguntas:[
          "Demonstra equilíbrio emocional diante das pressões.",
          "Reage de forma madura a frustrações.",
          "Assume erros quando necessário.",
          "Ouve críticas sem defensividade excessiva.",
        ],
        abertas:[]},
      { id:"alinhamento_par", title:"Alinhamento e cultura", icon:"⛵",
        perguntas:[
          "Representa bem os valores da organização.",
          "Fortalece a unidade do grupo.",
          "Demonstra compromisso com a organização.",
          "Atua de forma coerente com a cultura onde está inserida.",
        ],
        abertas:[]},
      { id:"impacto_par", title:"Impacto e resultados", icon:"🌱",
        perguntas:[
          "Produz impacto positivo nas pessoas ao seu redor.",
          "Contribui de forma relevante para os resultados da equipe.",
          "Demonstra iniciativa e proatividade.",
          "Investe no próprio desenvolvimento.",
        ],
        abertas:["O que esta pessoa faz que mais contribui para a equipe?","Em qual área você percebe maior potencial de crescimento nesta pessoa?"]},
      { id:"saude_integral_par", title:"Saúde integral", icon:"💚",
        perguntas:[
          "Demonstra sinais saudáveis nas relações familiares.",
          "Demonstra sinais de descanso e equilíbrio adequados.",
          "Demonstra boa disposição física e cuidado com a saúde.",
          "Demonstra maturidade para lidar com frustrações.",
        ],
        abertas:[]},
      { id:"riscos_par", title:"Riscos e sinais preventivos", icon:"⚠️",
        perguntas:[
          "Percebo sinais de sobrecarga nesta pessoa.",
          "Percebo sinais de isolamento.",
          "Percebo sinais de desgaste emocional.",
          "Percebo perda de motivação.",
          "Percebo tensões relacionais recorrentes.",
          "Esta pessoa se beneficiaria de um acompanhamento mais próximo neste momento.",
        ],
        abertas:[],isRisk:true},
    ]},

  // ── AVALIAÇÃO PELA LIDERANÇA ────────────────────────────────────
  { id:"lideranca", title:"Avaliação pela Liderança", icon:"🧭", subtitle:"Avaliação de quem acompanha de perto",
    blocos:[
      { id:"relacionamentos_lid", title:"Relacionamentos e convivência", icon:"🤝",
        perguntas:[
          "Esta pessoa contribui para um ambiente saudável na equipe.",
          "Trata as pessoas com respeito e consideração.",
          "Demonstra capacidade de trabalhar bem em equipe.",
          "Lida com conflitos de forma madura.",
          "Demonstra humildade nos relacionamentos.",
        ],
        abertas:[]},
      { id:"comunicacao_lid", title:"Comunicação", icon:"💬",
        perguntas:[
          "Comunica-se com clareza e objetividade.",
          "Escuta atentamente antes de responder.",
          "Recebe orientações e feedbacks com abertura.",
          "Comunica dificuldades e necessidades de forma adequada.",
        ],
        abertas:[]},
      { id:"maturidade_lid", title:"Maturidade emocional", icon:"🧘",
        perguntas:[
          "Demonstra equilíbrio emocional diante das pressões.",
          "Reage de forma madura a frustrações.",
          "Demonstra segurança sem arrogância.",
          "Assume erros quando necessário.",
          "Recebe correções sem defensividade excessiva.",
        ],
        abertas:[]},
      { id:"alinhamento_lid", title:"Alinhamento e cultura", icon:"⛵",
        perguntas:[
          "Representa bem os valores da organização.",
          "Demonstra compromisso com a missão e propósito.",
          "Mantém alinhamento com as diretrizes estabelecidas.",
          "Fortalece a cultura da organização com sua presença.",
        ],
        abertas:[]},
      { id:"impacto_lid", title:"Responsabilidade e resultados", icon:"🌱",
        perguntas:[
          "Demonstra responsabilidade com seus compromissos.",
          "Cumpre acordos e prazos estabelecidos.",
          "Demonstra disposição para aprender e crescer.",
          "Busca desenvolvimento pessoal e profissional.",
          "Contribui de forma relevante para os resultados da equipe.",
        ],
        abertas:["Quais são os maiores pontos fortes desta pessoa?","Em qual área você percebe maior potencial de crescimento?"]},
      { id:"sustentabilidade", title:"Saúde e sustentabilidade", icon:"💚",
        perguntas:[
          "Administra adequadamente as pressões.",
          "Mantém limites saudáveis.",
          "Demonstra equilíbrio em sua vida econômica e material.",
          "Demonstra boa disposição física.",
          "Sabe pedir ajuda quando necessário.",
        ],
        abertas:[]},
      { id:"riscos_lid", title:"Riscos e sinais preventivos", icon:"⚠️",
        perguntas:[
          "Percebo sinais de sobrecarga nesta pessoa.",
          "Percebo sinais de isolamento.",
          "Percebo sinais de desgaste emocional.",
          "Percebo perda de motivação.",
          "Percebo tensões relacionais recorrentes.",
          "Esta pessoa se beneficiaria de um acompanhamento mais próximo neste momento.",
        ],
        abertas:[],isRisk:true},
    ]},

  // ── AVALIAÇÃO PELOS LIDERADOS ───────────────────────────────────
  { id:"liderados", title:"Avaliação pelos Liderados", icon:"🌿", subtitle:"Sua perspectiva importa e será tratada com cuidado",
    blocos:[
      { id:"relacionamentos_lid2", title:"Relacionamentos e convivência", icon:"🤝",
        perguntas:[
          "Esta pessoa desenvolve um ambiente seguro para diálogo.",
          "Trata as pessoas com respeito e consideração.",
          "Demonstra cuidado genuíno pelas pessoas.",
          "Lida bem com conflitos de forma justa.",
          "Promove unidade na equipe.",
        ],
        abertas:[]},
      { id:"comunicacao_lid2", title:"Comunicação", icon:"💬",
        perguntas:[
          "Comunica-se com clareza e objetividade.",
          "Escuta as pessoas com atenção genuína.",
          "Dá direcionamentos claros quando necessário.",
          "Fornece feedbacks de forma respeitosa e construtiva.",
        ],
        abertas:[]},
      { id:"maturidade_lid2", title:"Maturidade emocional", icon:"🧘",
        perguntas:[
          "Demonstra equilíbrio emocional diante das pressões.",
          "Reage de forma madura a frustrações.",
          "Demonstra segurança sem arrogância.",
          "Assume responsabilidade pelos erros.",
          "Demonstra coerência entre discurso e prática.",
        ],
        abertas:[]},
      { id:"alinhamento_lid2", title:"Alinhamento e cultura", icon:"⛵",
        perguntas:[
          "Representa bem os valores da organização.",
          "Demonstra compromisso genuíno com a missão.",
          "Evita manipulação ou controle excessivo.",
          "Age de forma íntegra e coerente.",
        ],
        abertas:[]},
      { id:"lideranca_qualidade", title:"Qualidade da liderança", icon:"🧭",
        perguntas:[
          "Inspira e motiva as pessoas ao seu redor.",
          "Delega adequadamente, respeitando as capacidades de cada um.",
          "Investe no desenvolvimento das pessoas que lidera.",
          "Toma decisões de forma equilibrada e justa.",
          "Reconhece as contribuições da equipe.",
        ],
        abertas:["O que esta pessoa faz como líder que mais impacta positivamente você?","Que mudança você acredita que tornaria esta liderança ainda mais efetiva?"]},
      { id:"riscos_lid2", title:"Riscos e sinais preventivos", icon:"⚠️",
        perguntas:[
          "Percebo sinais de sobrecarga nesta pessoa.",
          "Percebo sinais de isolamento.",
          "Percebo sinais de desgaste emocional.",
          "Percebo perda de motivação.",
          "Percebo tensões relacionais recorrentes.",
          "Esta pessoa se beneficiaria de um acompanhamento mais próximo neste momento.",
        ],
        abertas:[],isRisk:true},
    ]},
];

const DEFAULT_FORMS_NEUTRO = [
  { id:"autoavaliacao", title:"Autoavaliação", icon:"🪞", subtitle:"Um espaço honesto e seguro para olhar para si mesmo",
    blocos:[
      { id:"proposito", title:"Propósito e coerência", icon:"🧭",
        perguntas:[
          "Tenho sido fiel aos meus compromissos e responsabilidades.",
          "Tenho sido coerente com minhas palavras e ações.",
          "Tenho reagido a críticas e correções com humildade.",
          "Tenho buscado agir de acordo com os valores da organização.",
          "Minha atuação profissional tem refletido os objetivos definidos no meu planejamento.",
          "Tenho conseguido me manter humilde diante dos sucessos pessoais e ministeriais.",
        ],
        abertas:["Em quais áreas você percebe maior crescimento no último período?","Em quais áreas sente maior fragilidade atualmente?"]},
      { id:"saude_emocional", title:"Saúde emocional", icon:"💙",
        perguntas:[
          "Tenho conseguido lidar de forma saudável com pressões e frustrações.",
          "Tenho conseguido descansar adequadamente.",
          "Tenho percebido equilíbrio entre trabalho, vida pessoal e familiar.",
          "Tenho conseguido pedir ajuda quando necessário.",
          "Tenho chegado às minhas atividades ministeriais com disposição e motivação.",
          "Tenho percebido sinais de desgaste emocional em mim.",
          "Tenho conseguido estabelecer limites saudáveis.",
        ],
        abertas:["Quais são hoje suas maiores fontes de desgaste?","O que mais tem fortalecido você emocionalmente?","Existe alguma área em que você sente necessidade de maior cuidado ou apoio?"]},
      { id:"relacionamentos", title:"Relacionamentos e equipe", icon:"🤝",
        perguntas:[
          "Tenho contribuído para que meus ambientes sejam saudáveis.",
          "Tenho escutado opiniões diferentes sem defensividade.",
          "Tenho lidado bem com conflitos.",
          "Tenho sido acessível e respeitoso nas relações.",
          "Tenho colaborado bem com minha equipe.",
        ],
        abertas:["O que você acredita que mais fortalece suas relações?","Onde você acredita que precisa amadurecer relacionalmente?"]},
      { id:"comunicacao", title:"Comunicação", icon:"💬",
        perguntas:[
          "Tenho me comunicado com clareza.",
          "Tenho dado feedbacks respeitosos e honestos.",
          "Tenho escutado atentamente as pessoas.",
          "Tenho comunicado expectativas de maneira saudável.",
        ],
        abertas:["Em quais situações sua comunicação funciona melhor?","O que você deseja desenvolver na sua comunicação?"]},
      { id:"alinhamento", title:"Alinhamento e cultura", icon:"⛵",
        perguntas:[
          "Tenho representado bem os valores da organização.",
          "Tenho contribuído para a unidade da organização.",
          "Tenho fortalecido a cultura de cuidado e cooperação.",
          "Tenho mantido alinhamento com a liderança e suas diretrizes.",
          "Tenho colaborado para o desenvolvimento da organização.",
        ],
        abertas:["O que mais conecta você ao propósito da organização?","O que hoje dificulta seu alinhamento ou engajamento?"]},
      { id:"impacto", title:"Impacto e resultados", icon:"🌱",
        perguntas:[
          "Tenho produzido impacto positivo nas pessoas ao meu redor.",
          "Tenho contribuído para o desenvolvimento de outras pessoas.",
          "Tenho alcançado as metas estabelecidas no meu planejamento.",
          "Tenho desenvolvido novas habilidades.",
        ],
        abertas:["Onde você percebe maior resultado atualmente?","Onde gostaria de crescer no próximo ciclo?"]},
      { id:"saude_integral_auto", title:"Saúde integral", icon:"💚",
        perguntas:[
          "Minhas relações familiares estão saudáveis.",
          "Tenho descansado adequadamente.",
          "Tenho lidado bem com minhas frustrações.",
        ],
        abertas:[]},
    ]},
  { id:"pares", title:"Avaliação de Pares", icon:"👥", subtitle:"Compartilhe com cuidado e honestidade",
    blocos:[
      { id:"convivencia", title:"Relacionamentos e convivência", icon:"🤝",
        perguntas:["Essa pessoa contribui para um ambiente saudável.","Trata as pessoas com respeito.","Trabalha bem em equipe.","Demonstra humildade nos relacionamentos.","Resolve conflitos com maturidade.","Escuta opiniões diferentes.","Demonstra disposição para cooperar."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"comunicacao_par", title:"Comunicação", icon:"💬",
        perguntas:["Comunica-se de forma clara.","Compartilha informações importantes adequadamente.","Escuta com atenção.","Demonstra abertura ao diálogo.","Quando precisa corrigir ou orientar, faz isso de forma respeitosa e construtiva."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"maturidade", title:"Maturidade emocional", icon:"💙",
        perguntas:["Demonstra equilíbrio emocional diante das pressões.","Reage de forma madura a frustrações.","Assume erros quando necessário.","Ouve críticas sem defensividade excessiva."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"cultura_par", title:"Cultura e propósito", icon:"⛵",
        perguntas:["Representa bem os valores da organização.","Fortalece a unidade.","Demonstra compromisso com a organização.","Atua de forma coerente com a cultura onde está inserida."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"saude_integral_par", title:"Saúde integral", icon:"💚",
        perguntas:["Demonstra abertura e vulnerabilidade saudável.","Demonstra sinais saudáveis nas relações familiares.","Demonstra sinais de descanso adequado.","Demonstra boa disposição física e cuidado com a saúde.","Demonstra maturidade para lidar com frustrações."],
        abertas:[]},
      { id:"riscos_par", title:"Riscos e sinais preventivos", icon:"⚠️", scaleType:"yesno",
        perguntas:["Percebo sinais de sobrecarga.","Percebo sinais de isolamento.","Percebo sinais de desgaste emocional.","Percebo perda de motivação.","Percebo tensões relacionais recorrentes.","Essa pessoa se beneficiaria de um acompanhamento mais próximo neste momento."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
    ]},
  { id:"lideranca_direta", title:"Avaliação pela Liderança", icon:"🧭", subtitle:"Avaliação de quem acompanha de perto",
    blocos:[
      { id:"responsabilidade", title:"Responsabilidade e confiabilidade", icon:"🛡️",
        perguntas:["Demonstra responsabilidade.","Cumpre compromissos e acordos.","Demonstra maturidade nas decisões.","Demonstra confiabilidade.","Demonstra coerência entre discurso e prática."], abertas:[]},
      { id:"aprendizado", title:"Desenvolvimento e aprendizado", icon:"🌱",
        perguntas:["Demonstra disposição para aprender.","Recebe orientações e críticas com maturidade.","Busca desenvolvimento pessoal.","Demonstra adaptabilidade."], abertas:[]},
      { id:"sustentabilidade", title:"Saúde e sustentabilidade", icon:"💙",
        perguntas:["Administra adequadamente as pressões.","Mantém limites saudáveis.","Demonstra equilíbrio em sua vida econômica e material.","Demonstra boa disposição física.","Sabe pedir ajuda quando necessário."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"maturidade_lid", title:"Maturidade emocional", icon:"💜",
        perguntas:["Demonstra equilíbrio emocional diante das pressões.","Reage de forma madura a frustrações.","Demonstra segurança sem arrogância.","Assume erros quando necessário.","Recebe correções sem defensividade excessiva."], abertas:[]},
      { id:"riscos_lid", title:"Riscos e sinais preventivos", icon:"⚠️", scaleType:"yesno",
        perguntas:["Percebo sinais de sobrecarga.","Percebo sinais de isolamento.","Percebo sinais de desgaste emocional.","Percebo perda de motivação.","Percebo tensões relacionais recorrentes.","Essa pessoa se beneficiaria de um acompanhamento mais próximo neste momento."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
    ]},
  { id:"liderados", title:"Avaliação pelos Liderados", icon:"⬆️", subtitle:"Sua perspectiva importa e será tratada com cuidado",
    blocos:[
      { id:"estilo", title:"Estilo de liderança", icon:"🧭",
        perguntas:["Desenvolve ambiente seguro para diálogo.","Demonstra disposição e engajamento.","Escuta as pessoas com atenção.","Trata as pessoas com respeito.","Dá direcionamentos claros quando necessário.","Demonstra equilíbrio nas decisões.","Assume responsabilidade pelos erros.","Demonstra coerência entre discurso e prática."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"saude_relacional", title:"Saúde relacional", icon:"💙",
        perguntas:["Gera e transmite confiança ao seu redor.","Promove unidade.","Lida bem com conflitos.","Evita manipulação ou controle excessivo.","Demonstra abertura para ouvir críticas.","Demonstra cuidado genuíno pelas pessoas."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
      { id:"maturidade_lid2", title:"Maturidade emocional", icon:"💜",
        perguntas:["Demonstra equilíbrio emocional diante das pressões.","Reage de forma madura a frustrações.","Demonstra segurança sem arrogância.","Assume erros quando necessário."], abertas:[]},
      { id:"riscos_lid2", title:"Riscos e sinais preventivos", icon:"⚠️", scaleType:"yesno",
        perguntas:["Percebo sinais de sobrecarga.","Percebo sinais de isolamento.","Percebo sinais de desgaste emocional.","Percebo perda de motivação.","Percebo tensões relacionais recorrentes.","Essa pessoa se beneficiaria de um acompanhamento mais próximo neste momento."],
        abertas:["Algo que você deseja comentar acerca dessa pessoa, em relação a esse tema."]},
    ]},
];


// ─── SUPABASE CLIENT ─────────────────────────────────────────────────
const SB_URL = "https://tegktsjlpjvsbdrrugpp.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlZ2t0c2pscGp2c2JkcnJ1Z3BwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzI5NzAsImV4cCI6MjA5NDgwODk3MH0.Vh58dC61bYKkQJrsDFJBLrt9q3LGER50N0cb4iLzz5c";

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SB_KEY,
      "Authorization": `Bearer ${SB_KEY}`,
      "Content-Type": "application/json",
      "Prefer": opts.prefer !== undefined ? opts.prefer : "return=representation",
    },
    method: opts.method || "GET",
    body: opts.body || undefined,
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`SB ${res.status}: ${t}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function loadOrgs() {
  try {
    const rows = await sbFetch("organizations?select=*");
    const orgs = {};
    (rows || []).forEach(r => {
      orgs[r.id] = {
        id: r.id, name: r.name,
        adminPassword: r.admin_password,
        primaryColor: r.primary_color,
        logoUrl: r.logo_url,
        baseUrl: r.base_url,
        activeCiclo: r.active_ciclo,
        scaleLabels: r.scale_labels,
        scaleModel: r.scale_model || "frequencia",
        yesnoLabels: r.yesno_labels || DEFAULT_YESNO_LABELS,
        slug: r.slug || "",
        createdAt: r.created_at,
        orgType: r.org_type || "religiosa",
        planCustom: r.plan_custom || false,
      };
    });
    return orgs;
  } catch(e) { console.error("loadOrgs:", e); return {}; }
}

async function upsertOrg(org) {
  try {
    await sbFetch("organizations", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify({
        id: org.id, name: org.name,
        admin_password: org.adminPassword,
        primary_color: org.primaryColor || "#2563eb",
        logo_url: org.logoUrl || "",
        base_url: org.baseUrl || "",
        active_ciclo: org.activeCiclo || "2025 - 1º Semestre",
        scale_labels: org.scaleLabels || {},
        scale_model: org.scaleModel || "frequencia",
        slug: org.slug || "",
        yesno_labels: org.yesnoLabels || DEFAULT_YESNO_LABELS,
        org_type: org.orgType || "religiosa",
        plan_custom: org.planCustom || false,
        created_at: org.createdAt || new Date().toISOString(),
      }),
    });
    return true;
  } catch(e) { console.error("upsertOrg:", e); return false; }
}

async function deleteOrgFromDB(orgId) {
  try {
    await sbFetch(`organizations?id=eq.${orgId}`, { method: "DELETE", prefer: "" });
    return true;
  } catch(e) { console.error("deleteOrg:", e); return false; }
}

async function loadResps(orgId) {
  try {
    const rows = await sbFetch(`responses?org_id=eq.${orgId}&select=*&order=submitted_at.desc`);
    return (rows || []).map(r => ({
      id: r.id, ciclo: r.ciclo,
      formId: r.form_id, formTitle: r.form_title,
      scores: r.scores, answers: r.answers,
      openAns: r.open_answers, ts: new Date(r.submitted_at).getTime(),
      avaliadoId: r.avaliado_id || "",
      avaliadoNome: r.avaliado_nome || "",
    }));
  } catch(e) { console.error("loadResps:", e); return []; }
}

async function saveResp(orgId, entry) {
  try {
    await sbFetch("responses", {
      method: "POST", prefer: "return=minimal",
      body: JSON.stringify({
        id: entry.id, org_id: orgId,
        ciclo: entry.ciclo, form_id: entry.formId,
        form_title: entry.formTitle, scores: entry.scores,
        answers: entry.answers, open_answers: entry.openAns || {},
        avaliado_id: entry.avaliadoId || "",
        avaliado_nome: entry.avaliadoNome || "",
      }),
    });
    return true;
  } catch(e) { console.error("saveResp:", e); return false; }
}

async function loadForms(orgId, orgType) {
  try {
    const rows = await sbFetch(`org_forms?org_id=eq.${orgId}&select=forms_data&limit=1`);
    if (rows && rows.length > 0) return rows[0].forms_data;
    // Retorna forms adaptados ao tipo de org
    const baseAuto = getDefaultFormsForOrg(orgType);
    const outros = DEFAULT_FORMS.filter(f => f.id !== "autoavaliacao");
    return JSON.parse(JSON.stringify([...baseAuto, ...outros]));
  } catch(e) {
    const baseAuto = getDefaultFormsForOrg(orgType);
    const outros = DEFAULT_FORMS.filter(f => f.id !== "autoavaliacao");
    return JSON.parse(JSON.stringify([...baseAuto, ...outros]));
  }
}

async function saveForms2(orgId, forms) {
  try {
    const existing = await sbFetch(`org_forms?org_id=eq.${orgId}&select=id&limit=1`);
    if (existing && existing.length > 0) {
      await sbFetch(`org_forms?org_id=eq.${orgId}`, {
        method: "PATCH", prefer: "return=minimal",
        body: JSON.stringify({ forms_data: forms, updated_at: new Date().toISOString() }),
      });
    } else {
      await sbFetch("org_forms", {
        method: "POST", prefer: "return=minimal",
        body: JSON.stringify({ org_id: orgId, forms_data: forms }),
      });
    }
    return true;
  } catch(e) { console.error("saveForms2:", e); return false; }
}

async function loadCustomLinks2(orgId) {
  try {
    const rows = await sbFetch(`org_custom_links?org_id=eq.${orgId}&select=links_data&limit=1`);
    if (rows && rows.length > 0) return rows[0].links_data;
    return [];
  } catch(e) { return []; }
}

async function saveSharedReport(orgId, data) {
  try {
    const id = Math.random().toString(36).slice(2,10);
    await sbFetch("shared_reports", {
      method: "POST", prefer: "return=minimal",
      body: JSON.stringify({ id, org_id: orgId, data }),
    });
    return id;
  } catch(e) { console.error("saveSharedReport:", e); return null; }
}

// ─── CUPONS ──────────────────────────────────────────────────────
async function loadCupons() {
  try {
    const rows = await sbFetch("cupons?select=*&order=created_at.desc");
    return rows || [];
  } catch(e) { return []; }
}

async function saveCupom(c) {
  try {
    await sbFetch("cupons", {
      method:"POST", prefer:"resolution=merge-duplicates,return=minimal",
      body:JSON.stringify(c),
    });
    return true;
  } catch(e) { console.error("saveCupom:",e); return false; }
}

async function toggleCupomAtivo(id, ativo) {
  try {
    await sbFetch(`cupons?id=eq.${id}`, {
      method:"PATCH", prefer:"return=minimal",
      body:JSON.stringify({ ativo }),
    });
    return true;
  } catch(e) { return false; }
}

async function deleteCupom(id) {
  try {
    await sbFetch(`cupons?id=eq.${id}`, { method:"DELETE", prefer:"" });
    return true;
  } catch(e) { return false; }
}

// Validação pública de cupom (chamada pela landing via /api/validate-cupom)
// Esta função é usada no App.jsx para validar cupom no upgrade do Plano Personalizado
async function validarCupomUpgrade(codigo) {
  try {
    const rows = await sbFetch(`cupons?codigo=eq.${encodeURIComponent(codigo.toUpperCase())}&ativo=eq.true&select=*&limit=1`);
    if (!rows || rows.length === 0) return null;
    const c = rows[0];
    if (!["upgrade","ambos"].includes(c.aplicavel_em)) return null;
    if (c.usos_max !== null && c.usos >= c.usos_max) return null;
    return c;
  } catch(e) { return null; }
}

// ─── FUNÇÕES / CARGOS ────────────────────────────────────────────
async function loadFuncoes(orgId) {
  try {
    const rows = await sbFetch(`org_funcoes?org_id=eq.${orgId}&select=*&order=nome.asc`);
    return rows || [];
  } catch(e) { return []; }
}

async function saveFuncao(f) {
  try {
    await sbFetch("org_funcoes", {
      method:"POST", prefer:"resolution=merge-duplicates,return=minimal",
      body:JSON.stringify(f),
    });
    return true;
  } catch(e) {
    console.error("saveFuncao error:", e.message);
    alert("Erro ao salvar função: " + e.message);
    return false;
  }
}

async function deleteFuncao(id) {
  try {
    await sbFetch(`org_funcoes?id=eq.${id}`, { method:"DELETE" });
    return true;
  } catch(e) {
    console.error("deleteFuncao error:", e.message);
    return false;
  }
}

async function updateFuncaoRelacoes(funcaoId, avalia, avaliada_por) {
  try {
    await sbFetch(`org_funcoes?id=eq.${funcaoId}`, {
      method:"PATCH", prefer:"return=minimal",
      body:JSON.stringify({ avalia, avaliada_por }),
    });
    return true;
  } catch(e) {
    console.error("updateFuncaoRelacoes error:", e.message);
    return false;
  }
}

async function gerarAtribuicoesAutomaticas(orgId, usuarios, funcoes, ciclo, forms) {
  const atribuicoes = [];
  // Só usuários que participam do ciclo
  const participantes = usuarios.filter(u => u.participa_ciclo !== false);

  for (const u of participantes) {
    if (!u.funcao_id) continue;
    const funcaoU = funcoes.find(f => f.id === u.funcao_id);
    if (!funcaoU) continue;

    // Autoavaliação — sempre
    const autoForm = forms.find(f => f.id === "autoavaliacao");
    if (autoForm) {
      atribuicoes.push({
        id: genId(12), org_id: orgId, usuario_id: u.id,
        avaliado_id: u.id, avaliado_nome: u.nome,
        form_id: "autoavaliacao", ciclo, concluida: false,
      });
    }

    // Pares — mesma função, excluindo si mesmo
    const paresForm = forms.find(f => f.id === "pares");
    if (paresForm) {
      const pares = participantes.filter(p => p.id !== u.id && p.funcao_id === u.funcao_id);
      for (const par of pares) {
        atribuicoes.push({
          id: genId(12), org_id: orgId, usuario_id: u.id,
          avaliado_id: par.id, avaliado_nome: par.nome,
          form_id: "pares", ciclo, concluida: false,
        });
      }
    }

    // Liderança — avalia funções que esta função lidera (avalia[])
    const lidForm = forms.find(f => f.id === "lideranca" || f.id === "lideranca_direta");
    if (lidForm && funcaoU.avalia && funcaoU.avalia.length > 0) {
      const liderados = participantes.filter(p => funcaoU.avalia.includes(p.funcao_id));
      for (const liderado of liderados) {
        atribuicoes.push({
          id: genId(12), org_id: orgId, usuario_id: u.id,
          avaliado_id: liderado.id, avaliado_nome: liderado.nome,
          form_id: lidForm.id, ciclo, concluida: false,
        });
      }
    }

    // Pelos liderados — avalia quem a lidera (avaliada_por[])
    const lidadosForm = forms.find(f => f.id === "liderados");
    if (lidadosForm && funcaoU.avaliada_por && funcaoU.avaliada_por.length > 0) {
      const lideres = participantes.filter(p => funcaoU.avaliada_por.includes(p.funcao_id));
      for (const lider of lideres) {
        atribuicoes.push({
          id: genId(12), org_id: orgId, usuario_id: u.id,
          avaliado_id: lider.id, avaliado_nome: lider.nome,
          form_id: "liderados", ciclo, concluida: false,
        });
      }
    }
  }
  return atribuicoes;
}

async function loadSharedReport(id) {
  try {
    const rows = await sbFetch(`shared_reports?id=eq.${id}&select=data&limit=1`);
    if (rows && rows.length > 0) return rows[0].data;
    return null;
  } catch(e) { return null; }
}

async function loadAvaliados(orgId) {
  try {
    const rows = await sbFetch(`avaliados?org_id=eq.${orgId}&ativo=eq.true&select=*&order=nome.asc`);
    return rows || [];
  } catch(e) { console.error("loadAvaliados:", e); return []; }
}

async function saveAvaliado(avaliado) {
  try {
    await sbFetch("avaliados", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(avaliado),
    });
    return true;
  } catch(e) { console.error("saveAvaliado:", e); return false; }
}

async function deleteAvaliado(id) {
  try {
    await sbFetch(`avaliados?id=eq.${id}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ ativo: false }),
    });
    return true;
  } catch(e) { return false; }
}

// ─── USUARIOS & ATRIBUICOES ──────────────────────────────────────────
async function loadUsuarios(orgId) {
  try {
    const rows = await sbFetch(`usuarios?org_id=eq.${orgId}&ativo=eq.true&select=*&order=nome.asc`);
    return rows || [];
  } catch(e) { return []; }
}

async function saveUsuario(u) {
  // Tenta payload completo primeiro
  try {
    await sbFetch("usuarios", {
      method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(u),
    });
    return true;
  } catch(e) {
    // Fallback: tenta sem funcao_id (caso coluna não exista ainda)
    if (e.message && e.message.includes("funcao_id")) {
      try {
        const { funcao_id, ...uSemFuncao } = u;
        await sbFetch("usuarios", {
          method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
          body: JSON.stringify(uSemFuncao),
        });
        console.warn("saveUsuario: funcao_id ignorado — coluna não existe na tabela");
        return true;
      } catch(e2) {
        console.error("saveUsuario fallback error:", e2.message);
        alert("Erro ao salvar usuário: " + e2.message);
        return false;
      }
    }
    console.error("saveUsuario error:", e.message);
    if(e.message && e.message.includes("usuarios_email_org_id_key")) {
      alert("❌ Este email já está cadastrado nesta organização. Use um email diferente.");
    } else {
      alert("Erro ao salvar usuário: " + e.message);
    }
    return false;
  }
}

async function deleteUsuario(id) {
  try {
    await sbFetch(`usuarios?id=eq.${id}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ ativo: false }),
    });
    return true;
  } catch(e) { return false; }
}

async function loginUsuario(orgId, email, senha) {
  try {
    const hash = simpleHash(senha);
    const rows = await sbFetch(`usuarios?org_id=eq.${orgId}&email=eq.${encodeURIComponent(email)}&ativo=eq.true&select=*&limit=1`);
    if (!rows || rows.length === 0) return null;
    if (rows[0].senha_hash !== hash) return null;
    return rows[0];
  } catch(e) { return null; }
}

async function loadAtribuicoes(usuarioId, ciclo) {
  const FORM_TITLES = {
    "autoavaliacao": "🪞 Autoavaliação",
    "pares": "🤝 Avaliação de Pares",
    "lideranca": "🧭 Avaliação pela Liderança",
    "lideranca_direta": "🧭 Avaliação pela Liderança",
    "liderados": "🌱 Avaliação pelos Liderados",
    "pastoral": "⛪ Avaliação Pastoral",
  };
  try {
    const rows = await sbFetch(`atribuicoes?usuario_id=eq.${usuarioId}&ciclo=eq.${encodeURIComponent(ciclo)}&select=*`);
    return (rows || []).map(r => ({
      id: r.id,
      ciclo: r.ciclo,
      form_id: r.form_id,
      formTitle: FORM_TITLES[r.form_id] || r.form_id,
      usuario_id: r.usuario_id,
      avaliado_id: r.avaliado_id || "",
      avaliado_nome: r.avaliado_nome || "",
      avaliado_funcao: r.avaliado_funcao || "",
      concluida: r.concluida || false,
    }));
  } catch(e) { return []; }
}

async function saveAtribuicao(a) {
  try {
    await sbFetch("atribuicoes", {
      method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(a),
    });
    return true;
  } catch(e) { return false; }
}

async function deleteAtribuicoesByUsuario(usuarioId, ciclo) {
  try {
    await sbFetch(`atribuicoes?usuario_id=eq.${usuarioId}&ciclo=eq.${encodeURIComponent(ciclo)}`, {
      method: "DELETE", prefer: "",
    });
    return true;
  } catch(e) { return false; }
}

async function marcarAtribuicaoConcluida(atribId) {
  try {
    await sbFetch(`atribuicoes?id=eq.${atribId}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ concluida: true }),
    });
    return true;
  } catch(e) { return false; }
}

async function resetAtribuicao(atribId) {
  try {
    await sbFetch(`atribuicoes?id=eq.${atribId}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ concluida: false }),
    });
    return true;
  } catch(e) { return false; }
}

// ─── FORM PROGRESS ───────────────────────────────────────────
async function saveProgress(usuarioId, atribuicaoId, orgId, blocoAtual, answers, openAnswers) {
  try {
    const id = `${usuarioId}_${atribuicaoId}`;
    const existing = await sbFetch(`form_progress?id=eq.${encodeURIComponent(id)}&select=id&limit=1`).catch(()=>null);
    if (existing && existing.length > 0) {
      await sbFetch(`form_progress?id=eq.${encodeURIComponent(id)}`, {
        method: "PATCH", prefer: "return=minimal",
        body: JSON.stringify({ bloco_atual: blocoAtual, answers, open_answers: openAnswers, updated_at: new Date().toISOString() }),
      });
    } else {
      await sbFetch("form_progress", {
        method: "POST", prefer: "return=minimal",
        body: JSON.stringify({ id, org_id: orgId, usuario_id: usuarioId, atribuicao_id: atribuicaoId, bloco_atual: blocoAtual, answers, open_answers: openAnswers }),
      });
    }
    return true;
  } catch(e) { console.error("saveProgress:", e); return false; }
}

async function loadProgress(usuarioId, atribuicaoId) {
  try {
    const id = `${usuarioId}_${atribuicaoId}`;
    const rows = await sbFetch(`form_progress?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    if (rows && rows.length > 0) return rows[0];
    return null;
  } catch(e) { return null; }
}

async function deleteProgress(usuarioId, atribuicaoId) {
  try {
    const id = `${usuarioId}_${atribuicaoId}`;
    await sbFetch(`form_progress?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", prefer: "" });
    return true;
  } catch(e) { return false; }
}

// ─── USUARIO SENHA ───────────────────────────────────────────
async function updateUsuarioSenha(usuarioId, novaSenha) {
  try {
    await sbFetch(`usuarios?id=eq.${usuarioId}`, {
      method: "PATCH", prefer: "return=minimal",
      body: JSON.stringify({ senha_hash: simpleHash(novaSenha) }),
    });
    return true;
  } catch(e) { return false; }
}

// ─── IMPORTAÇÃO EM MASSA ─────────────────────────────────────
// Importa lista de {nome, email, funcao} — cria usuario + avaliado vinculados
async function importarUsuarios(orgId, lista, orgSlug) {
  const SENHA_PADRAO = "avalie360";
  const hash = simpleHash(SENHA_PADRAO);
  const resultados = { criados: 0, erros: [] };

  for (const item of lista) {
    try {
      const usuarioId = genId(10);
      const avaliadoId = slugify(item.nome).slice(0, 30) + "-" + genId(4);

      // Criar usuário
      await sbFetch("usuarios", {
        method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          id: usuarioId, org_id: orgId,
          nome: san(item.nome), email: item.email.toLowerCase().trim(),
          senha_hash: hash, ativo: true,
          created_at: new Date().toISOString(),
        }),
      });

      // Criar avaliado vinculado ao usuário
      await sbFetch("avaliados", {
        method: "POST", prefer: "resolution=merge-duplicates,return=minimal",
        body: JSON.stringify({
          id: avaliadoId, org_id: orgId,
          nome: san(item.nome), funcao: san(item.funcao || ""),
          usuario_id: usuarioId, ativo: true,
          created_at: new Date().toISOString(),
        }),
      });

      resultados.criados++;
    } catch(e) {
      resultados.erros.push({ nome: item.nome, email: item.email, erro: e.message });
    }
  }
  return resultados;
}

// Busca usuários existentes por email para detectar duplicatas
async function verificarEmailsExistentes(orgId, emails) {
  try {
    const rows = await sbFetch(`usuarios?org_id=eq.${orgId}&ativo=eq.true&select=email,nome`);
    const existentes = new Set((rows || []).map(r => r.email.toLowerCase()));
    return emails.filter(e => existentes.has(e.toLowerCase()));
  } catch(e) { return []; }
}

async function loadOrgBySlug(slug) {
  try {
    // Try exact slug match first
    let rows = await sbFetch(`organizations?slug=eq.${encodeURIComponent(slug)}&select=*&limit=1`);
    // Fallback: try matching by ID prefix (for orgs without slug set yet)
    if(!rows || rows.length === 0) {
      rows = await sbFetch(`organizations?id=like.${encodeURIComponent(slug)}*&select=*&limit=1`);
    }
    if (rows && rows.length > 0) {
      const r = rows[0];
      return {
        id: r.id, name: r.name,
        adminPassword: r.admin_password,
        primaryColor: r.primary_color,
        logoUrl: r.logo_url,
        baseUrl: r.base_url,
        activeCiclo: r.active_ciclo,
        scaleLabels: r.scale_labels,
        scaleModel: r.scale_model || "frequencia",
        yesnoLabels: r.yesno_labels || DEFAULT_YESNO_LABELS,
        slug: r.slug,
        createdAt: r.created_at,
      };
    }
    return null;
  } catch(e) { console.error("loadOrgBySlug:", e); return null; }
}

function simpleHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
    h = h >>> 0;
  }
  return h.toString(16);
}

async function saveCustomLinks2(orgId, links) {
  try {
    const existing = await sbFetch(`org_custom_links?org_id=eq.${orgId}&select=id&limit=1`);
    if (existing && existing.length > 0) {
      await sbFetch(`org_custom_links?org_id=eq.${orgId}`, {
        method: "PATCH", prefer: "return=minimal",
        body: JSON.stringify({ links_data: links, updated_at: new Date().toISOString() }),
      });
    } else {
      await sbFetch("org_custom_links", {
        method: "POST", prefer: "return=minimal",
        body: JSON.stringify({ org_id: orgId, links_data: links }),
      });
    }
    return true;
  } catch(e) { return false; }
}

// ─── UTILS ───────────────────────────────────────────────────────────
function bAvg(b,r){const v=b.perguntas.map((_,i)=>r[`${b.id}_${i}`]||0).filter(x=>x>0);return v.length?v.reduce((a,x)=>a+x,0)/v.length:0;}
function sColor(s){
  return s>=4?"#10b981":s>=3?"#3b82f6":s>=2?"#f59e0b":"#ef4444";
}
function clone(o){return JSON.parse(JSON.stringify(o));}
function slugify(s){return s.toLowerCase().replace(/[^a-z0-9]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
function genId(n=8){return Math.random().toString(36).slice(2,2+n);}
function san(s){return String(s).replace(/<[^>]*>/g,"").trim().slice(0,500);}
function copyText(t){
  try{if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t);return;}}catch{}
  const el=document.createElement("textarea");el.value=t;el.style.cssText="position:fixed;top:-9999px;opacity:0;";
  document.body.appendChild(el);el.focus();el.select();
  try{document.execCommand("copy");}catch{}
  document.body.removeChild(el);
}

// ─── UI COMPONENTS ────────────────────────────────────────────────────
function PoweredBy(){
  return <div style={{textAlign:"center",padding:"14px 0 8px",fontSize:11,color:"#94a3b8"}}>Powered by <strong style={{color:"#64748b"}}>Conectando Gente</strong></div>;
}

function OrgLogo({org,size=72}){
  if(org?.logoUrl) return <img src={org.logoUrl} alt={org?.name||""} style={{width:size,height:size,objectFit:"contain",borderRadius:8,flexShrink:0}}/>;
  const c=org?.primaryColor||"#2563eb";
  return <div style={{width:size,height:size,borderRadius:Math.round(size*0.22),background:`linear-gradient(135deg,${c},${c}cc)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:900,color:"#fff",boxShadow:`0 2px 8px ${c}40`,flexShrink:0}}>{(org?.name||"?").slice(0,2).toUpperCase()}</div>;
}

function LogoUploader({value,onChange,color="#2563eb"}){
  const [drag,setDrag]=useState(false);
  function handle(file){
    if(!file||!file.type.startsWith("image/"))return;
    if(file.size>2097152){alert("Imagem muito grande. Use até 2MB.");return;}
    const r=new FileReader();r.onload=e=>onChange(e.target.result);r.readAsDataURL(file);
  }
  const uid="lu-"+Math.random().toString(36).slice(2,8);
  return(
    <div>
      <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);handle(e.dataTransfer.files[0]);}}
        onClick={()=>document.getElementById(uid).click()}
        style={{border:`2px dashed ${drag?color:"#dbeafe"}`,borderRadius:12,padding:16,textAlign:"center",cursor:"pointer",background:drag?"#eff6ff":"#f8faff",transition:"all 0.2s",minHeight:80,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
        {value?<img src={value} alt="logo" style={{maxHeight:56,maxWidth:160,objectFit:"contain"}}/>:<div style={{fontSize:28}}>🖼️</div>}
        <p style={{fontSize:12,color:"#64748b",margin:0}}>{value?"Clique ou arraste para trocar":"Clique ou arraste o logo aqui"}</p>
        <p style={{fontSize:10,color:"#94a3b8",margin:0}}>PNG, JPG ou SVG · máx 2MB</p>
      </div>
      <input id={uid} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handle(e.target.files[0])}/>
      {value&&<button onClick={e=>{e.stopPropagation();onChange("");}} style={{marginTop:6,padding:"3px 10px",borderRadius:6,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11}}>Remover logo</button>}
    </div>
  );
}

function LinkCard({label,link,color="#2563eb"}){
  const [copied,setCopied]=useState(false);
  const [showTip,setShowTip]=useState(false);

  function handleCopy(){
    if(navigator.clipboard&&window.isSecureContext){
      navigator.clipboard.writeText(link)
        .then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2500);})
        .catch(()=>selectFallback());
      return;
    }
    selectFallback();
  }

  function selectFallback(){
    const id="lc-inp-"+label.replace(/\s/g,"");
    const el=document.getElementById(id);
    if(el){el.select();el.setSelectionRange(0,99999);}
    try{
      const ok=document.execCommand("copy");
      if(ok){setCopied(true);setTimeout(()=>setCopied(false),2500);return;}
    }catch{}
    setShowTip(true);setTimeout(()=>setShowTip(false),5000);
  }

  const short=link.split("#/fill/")[1]||link;
  const inputId="lc-inp-"+label.replace(/\s/g,"");
  return(
    <div style={{background:"#f8faff",borderRadius:14,padding:"12px 16px",border:"1px solid #dbeafe",marginBottom:10}}>
      <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
      <div style={{fontSize:11,color:color,fontWeight:600,marginBottom:8,background:"#eff6ff",borderRadius:6,padding:"3px 10px",display:"inline-block",maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>🔗 {short}</div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input id={inputId} readOnly value={link}
          onClick={e=>e.target.select()}
          style={{flex:1,fontSize:10,color:"#334155",fontFamily:"monospace",background:"#fff",borderRadius:8,padding:"8px 10px",border:"1px solid #e2e8f0",outline:"none",cursor:"text",minWidth:0}}/>
        <button onClick={handleCopy}
          style={{padding:"8px 14px",borderRadius:8,border:"none",background:copied?"#16a34a":color,color:"#fff",cursor:"pointer",fontSize:12,fontWeight:700,whiteSpace:"nowrap",minWidth:95,transition:"background 0.2s",flexShrink:0}}>
          {copied?"✓ Copiado":"📋 Copiar"}
        </button>
      </div>
      {showTip&&(
        <div style={{marginTop:8,padding:"8px 12px",background:"#fefce8",borderRadius:8,border:"1px solid #fde68a",fontSize:12,color:"#92400e"}}>
          👆 Clique no campo acima para selecionar e pressione <strong>Ctrl+C</strong> (ou Cmd+C no Mac).
        </div>
      )}
    </div>
  );
}

function ScBar({label,score,isRisk}){
  if(isRisk){
    // Blocos de risco: visual invertido — baixo score = positivo
    const semAlerta = score<=1.5;
    return(
      <div style={{marginBottom:12,padding:"10px 14px",borderRadius:10,background:semAlerta?"#f0fdf4":"#fffbeb",border:`1px solid ${semAlerta?"#86efac":"#fde68a"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,color:"#475569",fontWeight:500}}>{label}</span>
          {score>0?(
            <span style={{fontSize:13,fontWeight:700,color:semAlerta?"#059669":"#d97706",display:"flex",alignItems:"center",gap:4}}>
              {semAlerta?"✅ Nenhum sinal de alerta":"⚠️ Atenção"}
            </span>
          ):<span style={{fontSize:13,color:"#94a3b8"}}>—</span>}
        </div>
      </div>
    );
  }
  return(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:13,color:"#475569",fontWeight:500}}>{label}</span>
        <span style={{fontSize:13,fontWeight:700,color:score>0?sColor(score):"#94a3b8"}}>{score>0?score.toFixed(1)+"/5":"—"}</span>
      </div>
      <div style={{background:"#e2e8f0",borderRadius:99,height:8}}><div style={{width:`${(score/5)*100}%`,background:sColor(score),height:8,borderRadius:99,transition:"width 0.6s ease"}}/></div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────
function AtribuicoesEditor({usuario, org, ciclo, pc}){
  const [ats, setAts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    loadAtribuicoes(usuario.id, ciclo).then(r=>{ setAts(r); setLoading(false); });
  },[usuario.id, ciclo]);

  if(loading) return <div style={{padding:16,color:"#94a3b8",fontSize:12}}>Carregando...</div>;

  return(
    <div style={{background:"#f8faff",borderRadius:12,padding:16,marginBottom:12,border:"1px solid #dbeafe"}}>
      <p style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Atribuições de {usuario.nome} — {ciclo}</p>
      <p style={{fontSize:11,color:"#94a3b8",marginBottom:12}}>Estas são as avaliações atribuídas a este colaborador. Use "✕" para remover exceções. Para gerar novas, use o botão ⚡ no topo.</p>
      {ats.length===0?(
        <p style={{fontSize:12,color:"#94a3b8",fontStyle:"italic"}}>Nenhuma atribuição gerada ainda para este ciclo.</p>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {ats.map(at=>(
            <div key={at.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:at.concluida?"#f0fdf4":"#fff",border:`1px solid ${at.concluida?"#86efac":"#e2e8f0"}`}}>
              <span style={{fontSize:11,color:"#64748b",minWidth:140,flexShrink:0}}>{at.formTitle||at.form_id}</span>
              <span style={{fontSize:13,color:"#334155",flex:1,fontWeight:500}}>{at.avaliado_nome||"—"}</span>
              {at.concluida&&<span style={{fontSize:10,color:"#16a34a",fontWeight:700,flexShrink:0}}>✓ Concluída</span>}
              {!at.concluida&&(
                <button onClick={async()=>{
                  if(!window.confirm(`Remover atribuição de ${usuario.nome} → ${at.avaliado_nome}?`))return;
                  await sbFetch(`atribuicoes?id=eq.${at.id}`,{method:"DELETE",prefer:""});
                  setAts(p=>p.filter(a=>a.id!==at.id));
                }} style={{padding:"3px 8px",borderRadius:6,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11,fontWeight:700,flexShrink:0}}>✕ Remover</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── DESIGN TOKENS ───────────────────────────────────────────────────
const R={sm:8,md:12,lg:16,xl:20,full:9999};
const SH={sm:"0 1px 3px rgba(0,0,0,0.07),0 1px 2px rgba(0,0,0,0.04)",md:"0 4px 16px rgba(0,0,0,0.08),0 2px 6px rgba(0,0,0,0.04)",lg:"0 8px 32px rgba(0,0,0,0.10),0 4px 12px rgba(0,0,0,0.05)"};

// StatusBadge component
function StatusBadge({ok}){
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:R.full,fontSize:11,fontWeight:700,background:ok?"#dcfce7":"#fef9c3",color:ok?"#15803d":"#92400e",border:`1px solid ${ok?"#86efac":"#fde047"}`}}><span style={{fontSize:8}}>●</span>{ok?"Concluída":"Pendente"}</span>;
}

// KpiCard component
function KpiCard({icon,val,label,color}){
  return(<div style={{background:"#fff",borderRadius:R.md,padding:"16px 14px",textAlign:"center",border:"1px solid #e5e7eb"}}>
    <div style={{fontSize:22,fontWeight:700,color:color||"#111827",letterSpacing:"-0.02em",lineHeight:1,marginBottom:4}}>{val}</div>
    <div style={{fontSize:11,color:"#6b7280",fontWeight:500,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</div>
  </div>);
}

// PDF Print function
function printIndividualPDF({org,avaliado,ciclo,formTitle,bStats,mgeral,abList,respsCount}){
  function sc(s){return s>=4?"#10b981":s>=3?"#3b82f6":s>=2?"#f59e0b":"#ef4444";}
  const bstatsNormais=bStats.filter(b=>!b.isRisk);
  const bstatsRisco=bStats.filter(b=>b.isRisk);
  const bars=bstatsNormais.map(b=>`<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:13px;color:#475569">${b.fullName||b.name}</span><span style="font-size:13px;font-weight:700;color:${sc(b.media)}">${b.media>0?b.media.toFixed(1)+"/5":"—"}</span></div><div style="background:#e2e8f0;border-radius:99px;height:10px"><div style="width:${(b.media/5)*100}%;background:${sc(b.media)};height:10px;border-radius:99px"></div></div></div>`).join("");
  const riscoCards=bstatsRisco.length>0?`<div style="margin-top:24px;margin-bottom:16px"><p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px">Sinais preventivos</p>${bstatsRisco.map(b=>{const semAlerta=b.media<=1.5||b.media===0;return`<div style="margin-bottom:8px;padding:10px 14px;border-radius:10px;background:${semAlerta?"#f0fdf4":"#fffbeb"};border:1px solid ${semAlerta?"#86efac":"#fde68a"}"><div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:13px;color:#475569">${b.fullName||b.name}</span><span style="font-size:13px;font-weight:700;color:${semAlerta?"#059669":"#d97706"}">${semAlerta?"✅ Nenhum sinal de alerta":"⚠️ Atenção"}</span></div></div>`;}).join("")}</div>`:"";
  const comments=abList.length>0?`<p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin:28px 0 12px">Reflexões abertas (${abList.length})</p>${abList.map(t=>`<div style="background:#f8faff;border-left:3px solid #3b82f6;padding:10px 14px;margin-bottom:8px;font-size:12px;color:#334155;line-height:1.7;border-radius:0 8px 8px 0">"${t}"</div>`).join("")}`:"";
  const logoHtml=org.logoUrl?`<img src="${org.logoUrl}" style="height:44px;object-fit:contain"/>`:`<div style="width:44px;height:44px;border-radius:10px;background:#1e3a8a;display:inline-flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff">${(org.name||"?").slice(0,2).toUpperCase()}</div>`;
  const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório — ${avaliado}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:#1e293b;padding:40px;max-width:800px;margin:0 auto}.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:24px;border-bottom:3px solid #1e3a8a;margin-bottom:28px}.badge{background:#f0fdf4;border:1px solid #86efac;color:#15803d;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0 28px}.kpi{background:#f8faff;border:1px solid #dbeafe;border-radius:10px;padding:14px;text-align:center}.kpi-val{font-size:22px;font-weight:800;color:#1e3a8a}.kpi-lbl{font-size:10px;color:#64748b;margin-top:3px;text-transform:uppercase;letter-spacing:0.05em}.footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0}.lgpd{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px 14px;font-size:11px;color:#15803d;margin-top:32px}@media print{body{padding:20px}}</style></head><body>
  <div class="hdr"><div>${logoHtml}<div style="margin-top:10px"><strong style="font-size:15px;color:#1e3a8a">${org.name||""}</strong><div style="font-size:11px;color:#64748b;margin-top:2px">Avaliação 360°</div></div></div><div style="text-align:right"><span class="badge">LGPD conforme</span><div style="font-size:11px;color:#94a3b8;margin-top:8px">Gerado em ${new Date().toLocaleDateString("pt-BR")}</div></div></div>
  <h1 style="font-size:22px;font-weight:800;color:#1e3a8a;margin-bottom:4px">${avaliado}</h1>
  <div style="font-size:13px;color:#64748b;margin-bottom:4px">${formTitle} · ${ciclo}</div>
  <div style="font-size:12px;color:#94a3b8;margin-bottom:16px">${respsCount} pessoa${respsCount!==1?"s":""} responderam sobre ${avaliado}</div>
  <div class="kpis"><div class="kpi"><div class="kpi-val">${mgeral}/5</div><div class="kpi-lbl">Média geral</div></div><div class="kpi"><div class="kpi-val">${respsCount}</div><div class="kpi-lbl">Respondentes</div></div><div class="kpi"><div class="kpi-val">${bstatsNormais.length}</div><div class="kpi-lbl">Dimensões</div></div></div>
  <p style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:16px">Pontuação por dimensão</p>${bars}${riscoCards}${comments}
  <div class="lgpd">🔒 Este relatório não contém dados pessoais identificáveis. Respostas exibidas de forma agregada conforme a LGPD (Lei nº 13.709/2018).</div>
  <div class="footer">Powered by Conectando Gente — Avaliação 360°</div>
  </body></html>`;
  const w=window.open("","_blank","width=900,height=700");
  if(w){w.document.write(html);w.document.close();w.onload=()=>{w.focus();w.print();};}
}

// loadAtribuicoesOrg - carregar todas atribuições de uma org+ciclo
async function loadAtribuicoesOrg(orgId,ciclo){
  try{const rows=await sbFetch(`atribuicoes?org_id=eq.${orgId}&ciclo=eq.${encodeURIComponent(ciclo)}&select=*`);return rows||[];}
  catch(e){return[];}
}

export default function App(){
  const [screen,setScreen]=useState("loading");
  const [orgs,setOrgs]=useState({});
  const [org,setOrg]=useState(null);
  const [forms,setForms]=useState([]);
  const [resps,setResps]=useState([]);
  const [superP,setSuperP]=useState("");const [superE,setSuperE]=useState(false);
  const [orgP,setOrgP]=useState("");const [orgE,setOrgE]=useState(false);
  const [ffi,setFfi]=useState(0);const [fbi,setFbi]=useState(0);
  const [answers,setAnswers]=useState({});const [openAns,setOpenAns]=useState({});
  const [ciclo,setCiclo]=useState(CICLOS[0]);const [lgpd,setLgpd]=useState(false);
  const [saving,setSaving]=useState(false);
  const [dfi,setDfi]=useState(0);const [dci,setDci]=useState(CICLOS[0]);const [repCopied,setRepCopied]=useState(false);
  const [showLinks,setShowLinks]=useState(false);
  const [efi,setEfi]=useState(0);const [ebi,setEbi]=useState(0);
  const [nOrg,setNOrg]=useState({name:"",adminPassword:"",primaryColor:"#2563eb",logoUrl:"",orgType:"religiosa"});const [nOrgE,setNOrgE]=useState("");
  const [editingOrg,setEditingOrg]=useState(null); // org being edited in super admin
  const [cfg,setCfg]=useState(null);
  const [showAdminPass,setShowAdminPass]=useState(false);
  const [showUpgradeModal,setShowUpgradeModal]=useState(false);
  const [funcoes,setFuncoes]=useState([]); // [{id, nome, avalia:[], avaliada_por:[]}]
  const [newFuncao,setNewFuncao]=useState("");
  const [cupons,setCupons]=useState([]);
  const [newCupom,setNewCupom]=useState({codigo:"",desconto_pct:100,aplicavel_em:"ambos",usos_max:""});
  const [loadingCupons,setLoadingCupons]=useState(false);
  const [upgradeCupomCode,setUpgradeCupomCode]=useState("");
  const [upgradeCupomMsg,setUpgradeCupomMsg]=useState(null);
  const [upgradeCupomAplicado,setUpgradeCupomAplicado]=useState(null);
  const [showUpgradeCupom,setShowUpgradeCupom]=useState(false);
  const [customLinks,setCustomLinks]=useState([]);  // [{formId, label, id}]
  const [urlCustomLabel,setUrlCustomLabel]=useState(null); // custom title from URL link
  const [urlAvaliadoNome,setUrlAvaliadoNome]=useState(null); // avaliado name from URL
  const [urlAvaliadoId,setUrlAvaliadoId]=useState(null); // avaliado id from URL
  const [avaliados,setAvaliados]=useState([]); // list of avaliados for current org
  const [newAvaliado,setNewAvaliado]=useState({nome:"",funcao:""});
  // Login por pessoa
  const [usuarioLogado,setUsuarioLogado]=useState(null);
  const [atribuicoes,setAtribuicoes]=useState([]);
  const [atribucaoAtual,setAtribucaoAtual]=useState(null);
  const [usuarios,setUsuarios]=useState([]);
  const [newUsuario,setNewUsuario]=useState({nome:"",email:"",senha:"avalie360"});
  const [loginEmail,setLoginEmail]=useState("");
  const [loginSenha,setLoginSenha]=useState("");
  const [loginErr,setLoginErr]=useState("");
  const [showPwd,setShowPwd]=useState(false);
  const [forgotMode,setForgotMode]=useState(false);
  const [showAtribuicoes,setShowAtribuicoes]=useState(null); // usuarioId being configured
  const [editingUsuario,setEditingUsuario]=useState(null); // {id, nome, email, novaSenha}
  const [scaleLabels,setScaleLabels]=useState(DEFAULT_SCALE_LABELS);
  const [scaleModel,setScaleModel]=useState("frequencia");
  const [yesnoLabels,setYesnoLabels]=useState(DEFAULT_YESNO_LABELS);
  const [notifSending,setNotifSending]=useState(false);
  const [progressSaving,setProgressSaving]=useState(false);
  // Dashboard tabs & novas features
  const [dashTab,setDashTab]=useState("resultados");
  const [dAvaliado,setDAvaliado]=useState("");
  const [statusData,setStatusData]=useState(null);
  const [loadingStatus,setLoadingStatus]=useState(false);
  // Importação Excel
  const [importando,setImportando]=useState(false);
  const [importPreview,setImportPreview]=useState(null);
  const [importDuplicatas,setImportDuplicatas]=useState([]);
  const [importDecisoes,setImportDecisoes]=useState({});
  const [importFinalResult,setImportFinalResult]=useState(null);
  // Troca de senha do usuário
  const [showTrocaSenha,setShowTrocaSenha]=useState(false);
  const [novaSenha,setNovaSenha]=useState("");
  const [confirmaSenha,setConfirmaSenha]=useState("");
  const [trocaSenhaMsg,setTrocaSenhaMsg]=useState("");
  // Onboarding
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [onboardingStep,setOnboardingStep]=useState(0);
  // Tela Equipe — helps
  const [showHelpFuncoes,setShowHelpFuncoes]=useState(false);
  const [showHelpUsuarios,setShowHelpUsuarios]=useState(false);
  // Notificações
  const [notifTab,setNotifTab]=useState("convite");
  const [notifMsg,setNotifMsg]=useState("");
  useEffect(()=>{
    async function init(){
      const ao=await loadOrgs();setOrgs(ao);
      // Clean URL routing: /orgSlug/ciclo/formId/avaliadoId
      const pathParts = window.location.pathname.replace(/^\//, "").split("/").filter(Boolean);
      const urlParams = new URLSearchParams(window.location.search);

      // Handle retorno do Stripe — nova contratação
      if(urlParams.get("success")==="1"){
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(()=>alert("🎉 Pagamento confirmado! Sua conta foi criada com sucesso.\n\nVerifique seu email — você receberá as credenciais de acesso em instantes.\n\nPara acessar o painel: clique em \"Acessar painel\" abaixo."), 600);
      }
      // Handle retorno do Stripe — plano personalizado
      if(urlParams.get("custom_upgrade")==="1"){
        window.history.replaceState({}, "", window.location.pathname);
        setTimeout(()=>alert("✅ Plano Personalizado ativado com sucesso!\n\nAcesse o painel admin → clique em Formulários para começar a personalizar suas perguntas."), 600);
      }

      // Handle login URL: /sepal/login
      if(pathParts.length >= 2 && pathParts[1] === "login") {
        const orgData = await loadOrgBySlug(pathParts[0]);
        if(orgData) { setOrg(orgData); setScreen("user_login"); return; }
      }

      // Handle clean URL: /sepal/2025-s1/pares/cassiano-luz
      if(pathParts.length >= 3 && ![""].includes(pathParts[0])) {
        const orgData = await loadOrgBySlug(pathParts[0]);
        if(orgData) {
          setOrg(orgData);
          const f = await loadForms(orgData.id, orgData.orgType);
          setForms(f);
          const sm1 = orgData.scaleModel||"frequencia";
          setScaleModel(sm1);
          setScaleLabels(getScaleLabels(sm1));
          setYesnoLabels((orgData.yesnoLabels)||DEFAULT_YESNO_LABELS);
          const cicloRaw = pathParts[1] || "";
          const shortMatch = cicloRaw.match(/^(\d{4})-s([12])$/);
          let cDecoded;
          if(shortMatch){ const sem=shortMatch[2]==="1"?"1º":"2º"; cDecoded=`${shortMatch[1]} - ${sem} Semestre`; }
          else { cDecoded = decodeURIComponent(cicloRaw).replace(/-/g," "); }
          setCiclo(cDecoded);
          const idx2 = f.findIndex(x=>x.id===pathParts[2]);
          if(pathParts[3]) {
            const avs = await loadAvaliados(orgData.id);
            const found = avs.find(a=>a.id===pathParts[3]);
            if(found){ setUrlAvaliadoNome(found.nome); setUrlAvaliadoId(found.id); }
          }
          if(idx2>=0){ setFfi(idx2); setScreen("lgpd"); return; }
        }
      }

      const h=window.location.hash||"";
      const pts=h.replace(/^#\//, "").split("/");
      if(pts[0]==="fill"&&pts[1]&&pts[2]&&pts[3]){
        const o=ao[pts[1]];
        if(o){
          setOrg(o);const f=await loadForms(pts[1]);setForms(f);
          const sm2 = o.scaleModel||"frequencia";
          setScaleModel(sm2);
          setScaleLabels(getScaleLabels(sm2));
          // Decode ciclo from URL slug
          // Handles: "2025-s1" -> "2025 - 1º Semestre"
          // Also handles encoded versions like "2025---1%C2%BA-Semestre"
          let rawCiclo = decodeURIComponent(pts[2]);
          let cDecoded;
          const shortMatch = rawCiclo.match(/^(\d{4})-s([12])$/);
          if(shortMatch){
            const sem = shortMatch[2]==="1"?"1º":"2º";
            cDecoded = `${shortMatch[1]} - ${sem} Semestre`;
          } else {
            // Try to match against known CICLOS values
            const cleaned = rawCiclo.replace(/-+/g," ").replace(/\s+/g," ").trim();
            const found = CICLOS.find(ci=>ci.replace(/[^\w]/g,"").toLowerCase()===cleaned.replace(/[^\w]/g,"").toLowerCase());
            cDecoded = found || cleaned;
          }
          setCiclo(cDecoded);
          const idx=f.findIndex(x=>x.id===pts[3]);
          // pts[4] = optional linkId for custom label
          // pts[5] = optional avaliadoId
          if(pts[4]){
            const orgLinks = await loadCustomLinks2(pts[1]);
            const found = orgLinks.find(l=>l.id===pts[4]);
            if(found) setUrlCustomLabel(found.label);
          }
          if(pts[5]){
            const avs = await loadAvaliados(pts[1]);
            const found = avs.find(a=>a.id===pts[5]);
            if(found){ setUrlAvaliadoNome(found.nome); setUrlAvaliadoId(found.id); }
          }
          if(idx>=0){setFfi(idx);setScreen("lgpd");}else setScreen("404");}
        else setScreen("404");
      }else if(pts[0]==="report"&&pts[1]){
        try{
          // Try loading from Supabase first (short ID)
          const d = await loadSharedReport(pts[1]);
          if(d){ window._rd=d; setOrg({name:d.orgName,primaryColor:"#2563eb"}); setScreen("pub_report"); }
          else {
            // Fallback: try base64 decode (legacy links)
            try{
              const d2=JSON.parse(decodeURIComponent(atob(pts[1])));
              window._rd=d2; setOrg({name:d2.orgName,primaryColor:"#2563eb"}); setScreen("pub_report");
            }catch{ setScreen("404"); }
          }
        }catch{ setScreen("404"); }
      }else setScreen("home");
    }
    init();
  },[]);

  const fForm=forms[ffi];const fBloc=fForm?.blocos[fbi];const isLast=fForm&&fbi===fForm.blocos.length-1;
  const dForm=forms[dfi];
  const dData=resps.filter(r=>r.ciclo===dci&&r.formId===dForm?.id&&(dAvaliado===""||r.avaliadoId===dAvaliado));
  const bStats=dForm&&dData.length>0?dForm.blocos.map(b=>{const isRisk=b.scaleType==="yesno"||(b.id&&b.id.startsWith("riscos_"));const sc=dData.map(r=>bAvg(b,r.answers)).filter(v=>v>0);return{name:b.title.slice(0,16),fullName:b.title,media:sc.length?parseFloat((sc.reduce((a,x)=>a+x,0)/sc.length).toFixed(2)):0,isRisk};}):[];
  const mgeral=bStats.length?(bStats.filter(b=>!b.isRisk).reduce((a,b)=>a+b.media,0)/Math.max(1,bStats.filter(b=>!b.isRisk).length)).toFixed(1):"—";
  const abList=[];dData.forEach(r=>Object.values(r.openAns||{}).forEach(v=>{if(v?.trim())abList.push(v.trim());}));
  const dist=[1,2,3,4,5].map(v=>{let c=0;dData.forEach(r=>Object.values(r.answers||{}).forEach(x=>{if(x===v)c++;}));return{name:(scaleLabels[v]||DEFAULT_SCALE_LABELS[v]).slice(0,12),count:c};});
  // Dados para gráfico Radar
  const radarData=bStats.filter(b=>!b.isRisk).map(b=>({subject:b.name,fullName:b.fullName,value:b.media,fullMark:5}));
  // Comparativo Autoavaliação vs Outros (só quando avaliado selecionado)
  const autoVsOutrosData=dAvaliado&&dForm?(()=>{
    const autoResps=resps.filter(r=>r.ciclo===dci&&r.formId==="autoavaliacao"&&r.avaliadoId===dAvaliado);
    const outrosResps=dData.filter(r=>r.formId!=="autoavaliacao");
    if(autoResps.length===0&&outrosResps.length===0) return null;
    // Usar os blocos do formulário atual para cruzar com auto
    const formsAll=forms;
    const autoForm=formsAll.find(f=>f.id==="autoavaliacao");
    if(!autoForm) return null;
    return autoForm.blocos.filter(b=>!b.id?.startsWith("riscos_")&&b.scaleType!=="yesno").map(b=>{
      const autoSc=autoResps.map(r=>bAvg(b,r.answers)).filter(v=>v>0);
      const autoMedia=autoSc.length?parseFloat((autoSc.reduce((a,x)=>a+x,0)/autoSc.length).toFixed(2)):0;
      // Tentar achar o bloco correspondente no formulário atual (por id ou título similar)
      const blocoAtual=dForm.blocos.find(x=>x.id===b.id||x.title===b.title);
      const outrosSc=blocoAtual?outrosResps.map(r=>bAvg(blocoAtual,r.answers)).filter(v=>v>0):[];
      const outrosMedia=outrosSc.length?parseFloat((outrosSc.reduce((a,x)=>a+x,0)/outrosSc.length).toFixed(2)):0;
      return{name:b.title.slice(0,14),fullName:b.title,auto:autoMedia,outros:outrosMedia};
    }).filter(d=>d.auto>0||d.outros>0);
  })():null;
  // Comparativo entre ciclos
  const COMP_COLORS=["#2563eb","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4"];
  const ciclosComDados=dForm&&dAvaliado?CICLOS.filter(c=>resps.some(r=>r.ciclo===c&&r.formId===dForm.id&&r.avaliadoId===dAvaliado)):[];
  const comparativoData=dForm&&dAvaliado&&ciclosComDados.length>=2?dForm.blocos.map(b=>({
    name:b.title.slice(0,14),fullName:b.title,
    ...Object.fromEntries(ciclosComDados.map(c=>{
      const cData=resps.filter(r=>r.ciclo===c&&r.formId===dForm.id&&r.avaliadoId===dAvaliado);
      const sc=cData.map(r=>bAvg(b,r.answers)).filter(v=>v>0);
      return[c.replace(" - ","·").replace(" Semestre",""),sc.length?parseFloat((sc.reduce((a,x)=>a+x,0)/sc.length).toFixed(2)):0];
    }))
  })):null;
  const pc=org?.primaryColor||"#2563eb";

  function getBaseUrl(){
    // Use configured baseUrl if set, otherwise current origin only (not full href with Claude params)
    if(org?.baseUrl) return org.baseUrl.replace(/\/$/,"");
    try{ return window.location.origin; }catch{ return ""; }
  }

  function getLinks(){
    const base=getBaseUrl();
    const activeCiclo=org?.activeCiclo||CICLOS[0];
    const cicloSlug=activeCiclo
      .replace("1º Semestre","s1").replace("2º Semestre","s2")
      .replace(/[^a-zA-Z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").toLowerCase();
    const result=[];
    forms.forEach(f=>{
      const custom=customLinks.filter(l=>l.formId===f.id);
      const linkLabels = custom.length>0 ? custom : [{id:null, label:f.title}];
      linkLabels.forEach(l=>{
        // If avaliados exist for this form type, generate one link per avaliado
        const needsAvaliado = ["liderados","lideranca_direta","lideranca","pares","pastoral"].includes(f.id);
        if(needsAvaliado && avaliados.length>0){
          avaliados.forEach(av=>{
            const linkId = l.id ? `/${l.id}` : "";
            const link=`${base}#/fill/${org?.id}/${cicloSlug}/${f.id}${linkId}/${av.id}`;
            result.push({
              title:`${l.label} — ${av.nome}`,
              icon:f.icon, formId:f.id,
              id:`${l.id||f.id}-${av.id}`,
              link,
              avaliado:av,
            });
          });
        } else {
          const linkId = l.id ? `/${l.id}` : "";
          const link=`${base}#/fill/${org?.id}/${cicloSlug}/${f.id}${linkId}`;
          result.push({title:l.label,icon:f.icon,formId:f.id,id:l.id||f.id,link});
        }
      });
    });
    return result;
  }

  async function saveLinks(updated){
    setCustomLinks(updated);
    await saveCustomLinks2(org.id,updated);
  }

  function exportCSV(){
    if(!dData.length)return;
    const rows=[["Ciclo","Formulário","Data","Área","Média"]];
    dData.forEach(r=>r.scores?.forEach(s=>rows.push([r.ciclo,r.formTitle,new Date(r.ts).toLocaleDateString("pt-BR"),s.label,s.score.toFixed(2)])));
    const csv=rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\uFEFF"+csv],{type:"text/csv;charset=utf-8;"}));
    a.download=`avaliacao-${org?.name||"org"}-${dci.replace(/ /g,"-")}.csv`;a.click();
  }

  function exportXLSX(){
    if(!dData.length)return;
    // Gera XLSX sem biblioteca externa — formato XML SpreadsheetML (suportado pelo Excel)
    const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const cell=(v,t="String")=>`<Cell><Data ss:Type="${t}">${esc(v)}</Data></Cell>`;
    const row=cells=>`<Row>${cells.join("")}</Row>`;
    // Aba 1: Médias por área
    const rows1=[
      row([cell("Dimensão"),cell("Média"),cell("Respostas")]),
      ...bStats.map(b=>row([cell(b.fullName),cell(b.media>0?b.media.toFixed(2):"—"),cell(dData.length,"Number")])),
      row([cell("MÉDIA GERAL"),cell(mgeral)]),
    ];
    // Aba 2: Dados brutos
    const rows2=[
      row([cell("Ciclo"),cell("Formulário"),cell("Avaliado"),cell("Data"),cell("Área"),cell("Média")]),
      ...dData.flatMap(r=>
        (r.scores||[]).map(s=>row([
          cell(r.ciclo),cell(r.formTitle),cell(r.avaliadoNome||"—"),
          cell(new Date(r.ts).toLocaleDateString("pt-BR")),
          cell(s.label),cell(s.score>0?s.score.toFixed(2):"—"),
        ]))
      ),
    ];
    // Aba 3: Reflexões abertas
    const rows3=[
      row([cell("Reflexão")]),
      ...abList.map(t=>row([cell(t)])),
    ];
    const xml=`<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Médias por área"><Table>${rows1.join("")}</Table></Worksheet>
 <Worksheet ss:Name="Dados brutos"><Table>${rows2.join("")}</Table></Worksheet>
 <Worksheet ss:Name="Reflexões abertas"><Table>${rows3.join("")}</Table></Worksheet>
</Workbook>`;
    const blob=new Blob([xml],{type:"application/vnd.ms-excel;charset=utf-8"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`avaliacao-${(org?.name||"org").replace(/\s/g,"-")}-${dci.replace(/ /g,"-")}.xls`;
    a.click();
  }
  function exportHTML(){
    if(!dData.length)return;
    const bNormais=bStats.filter(b=>!b.isRisk);
    const bRisco=bStats.filter(b=>b.isRisk);
    const rowsH=bNormais.map(b=>`<tr><td style="padding:10px;border-bottom:1px solid #e2e8f0">${b.fullName}</td><td style="padding:10px;border-bottom:1px solid #e2e8f0;font-weight:700;color:${sColor(b.media)}">${b.media.toFixed(1)}/5</td><td style="padding:10px;border-bottom:1px solid #e2e8f0"><div style="background:#e2e8f0;border-radius:4px;height:10px;width:180px"><div style="width:${(b.media/5)*100}%;background:${sColor(b.media)};height:10px;border-radius:4px"></div></div></td></tr>`).join("");
    const riscoH=bRisco.length>0?`<h2 style="margin-top:32px;color:#1e3a8a">Sinais preventivos</h2>${bRisco.map(b=>{const ok=b.media<=1.5||b.media===0;return`<div style="margin-bottom:8px;padding:10px 14px;border-radius:8px;background:${ok?"#f0fdf4":"#fffbeb"};border:1px solid ${ok?"#86efac":"#fde68a"};display:flex;justify-content:space-between"><span>${b.fullName}</span><span style="font-weight:700;color:${ok?"#059669":"#d97706"}">${ok?"✅ Nenhum sinal de alerta":"⚠️ Atenção"}</span></div>`;}).join("")}`:"";
    const absH=abList.map(t=>`<li style="margin-bottom:8px;color:#334155;line-height:1.6">${t}</li>`).join("");
    const html=`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Relatório 360°</title><style>body{font-family:system-ui,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#1e293b}h1{color:#1e3a8a}table{width:100%;border-collapse:collapse}.footer{margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}</style></head><body><h1>📊 Relatório de Avaliação 360°</h1><p><strong>${org?.name}</strong> · ${dci} · ${dForm?.title}</p><p style="background:#f0fdf4;border-radius:8px;padding:10px 16px;font-size:12px;color:#166534">🔒 Em conformidade com a LGPD · ${dData.length} respondentes</p><h2 style="margin-top:32px">Pontuação por área</h2><table><tbody>${rowsH}</tbody></table><p style="margin-top:16px;font-size:14px">Média geral: <strong style="font-size:22px;color:#1e3a8a">${mgeral}/5</strong></p>${riscoH}${abList.length>0?`<h2 style="margin-top:32px">Reflexões abertas</h2><ul style="padding-left:20px">${absH}</ul>`:""}<div class="footer">Powered by Conectando Gente · Gerado em ${new Date().toLocaleDateString("pt-BR")}</div></body></html>`;
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8;"}));
    a.download=`relatorio-${org?.name||"org"}-${dci.replace(/ /g,"-")}.html`;a.click();
  }

  async function shareReport(){
    setRepCopied("saving");
    const data={orgName:org?.name,ciclo:dci,formTitle:dForm?.title,total:dData.length,bStats,mgeral,abList,at:new Date().toISOString()};
    const id = await saveSharedReport(org?.id, data);
    if(!id){ alert("Erro ao gerar link. Tente novamente."); setRepCopied(false); return; }
    const base=getBaseUrl();
    const link=`${base}#/report/${id}`;
    copyText(link);
    setRepCopied(true);setTimeout(()=>setRepCopied(false),3000);
  }
  async function loadStatusData(){
    if(!org||!dForm)return;
    setLoadingStatus(true);
    const[allAtribs,allUsrs]=await Promise.all([loadAtribuicoesOrg(org.id,dci),loadUsuarios(org.id)]);
    const filtered=allAtribs.filter(a=>a.form_id===dForm.id&&(dAvaliado===""||a.avaliado_id===dAvaliado));
    const userMap={};allUsrs.forEach(u=>{userMap[u.id]=u;});
    setStatusData({atribs:filtered,userMap});
    setLoadingStatus(false);
  }

  async function loginSuper(){if(superP===SUPER_ADMIN_PASSWORD){setSuperE(false);setScreen("super");}else setSuperE(true);}
  async function loginOrg(o){
    if(orgP===o.adminPassword){
      setOrgE(false);setOrg(o);
      const f=await loadForms(o.id,o.orgType);const r=await loadResps(o.id);
        const fns=await loadFuncoes(o.id);setFuncoes(fns);
      const cl=await loadCustomLinks2(o.id);
      const sl=o.scaleLabels||DEFAULT_SCALE_LABELS;
      const sm=o.scaleModel||"frequencia";
      const yl=o.yesnoLabels||DEFAULT_YESNO_LABELS;
      setYesnoLabels(yl);
      const av=await loadAvaliados(o.id);
      const us=await loadUsuarios(o.id);
      setForms(f);setResps(r);setCfg(clone(o));setCustomLinks(cl);
      setScaleModel(sm);setScaleLabels(getScaleLabels(sm));
      setAvaliados(av);setUsuarios(us);setDci(o.activeCiclo||CICLOS[0]);
      // Detectar primeiro acesso: sem avaliados e sem usuários
      const isPrimeiroAcesso = av.length===0 && us.length===0 && r.length===0;
      if(isPrimeiroAcesso){ setOnboardingStep(0); setShowOnboarding(true); }
      setScreen("dash");
    }else setOrgE(true);
  }
  async function createOrg(){
    if(!nOrg.name.trim()){setNOrgE("Nome obrigatório");return;}
    if(!nOrg.adminPassword.trim()){setNOrgE("Senha obrigatória");return;}
    // Use custom slug if provided, else derive from name (max 12 chars)
    const baseSlug = nOrg.slug ? slugify(nOrg.slug) : slugify(nOrg.name).slice(0,12);
    const id=baseSlug+"-"+genId(4);
    const o={id,name:san(nOrg.name),adminPassword:nOrg.adminPassword,primaryColor:nOrg.primaryColor,logoUrl:nOrg.logoUrl,createdAt:new Date().toISOString(),activeCiclo:CICLOS[0],orgType:nOrg.orgType||"religiosa"};
    const ok = await upsertOrg(o);
    if(!ok){setNOrgE("Erro ao salvar. Verifique a conexão.");return;}
    const u={...orgs,[id]:o};setOrgs(u);
    setNOrg({name:"",adminPassword:"",primaryColor:"#2563eb",logoUrl:"",orgType:"religiosa"});setNOrgE("");
  }
  async function delOrg(id){
    if(!confirm("Remover esta organização? Todos os dados serão perdidos."))return;
    await deleteOrgFromDB(id);
    const u={...orgs};delete u[id];setOrgs(u);
  }
  async function saveCfg(){
    const updated={...cfg,scaleLabels:getScaleLabels(scaleModel),scaleModel:scaleModel,yesnoLabels:yesnoLabels,slug:cfg.slug||""};
    const ok = await upsertOrg(updated);
    if(!ok){alert("Erro ao salvar configurações.");return;}
    const u={...orgs,[org.id]:updated};setOrgs(u);setOrg(updated);setCfg(updated);
    // Recarregar forms se tipo de org mudou (para atualizar linguagem)
    const orgTypeChanged = cfg.orgType !== org.orgType;
    if(orgTypeChanged || !forms.length){
      const f = await loadForms(updated.id, updated.orgType);
      setForms(f);
    }
    alert("Configurações salvas!");
  }
  async function saveFormsBtn(){await saveForms2(org.id,forms);alert("Formulários salvos!");}
  async function handleUserLogin(){
    setLoginErr("");
    if(!loginEmail.trim()||!loginSenha.trim()){setLoginErr("Preencha email e senha.");return;}
    const u = await loginUsuario(org.id, loginEmail.trim(), loginSenha);
    if(!u){setLoginErr("Email ou senha incorretos.");return;}
    setUsuarioLogado(u);
    const f = await loadForms(org.id, org.orgType);
    setForms(f);
    const smU = org.scaleModel||"frequencia";
    setScaleModel(smU);
    setScaleLabels(getScaleLabels(smU));
    const ats = await loadAtribuicoes(u.id, org.activeCiclo||CICLOS[0]);
    setAtribuicoes(ats);
    setScreen("user_dash");
  }

  async function submitForm(){
    setSaving(true);
    await saveResp(org.id,{
      id:genId(16),ts:Date.now(),ciclo,
      formId:fForm.id,formTitle:fForm.title,
      scores:fForm.blocos.map(b=>({label:b.title,score:bAvg(b,answers)})),
      answers,openAns,
      avaliadoId:urlAvaliadoId||"",
      avaliadoNome:urlAvaliadoNome||"",
    });
    // Mark atribuição as done if came from user dashboard
    if(atribucaoAtual){
      await marcarAtribuicaoConcluida(atribucaoAtual.id);
      // Limpar progresso salvo
      if(usuarioLogado) await deleteProgress(usuarioLogado.id, atribucaoAtual.id);
      setAtribuicoes(p=>p.map(a=>a.id===atribucaoAtual.id?{...a,concluida:true}:a));
      setAtribucaoAtual(null);
    }
    setSaving(false);setScreen(usuarioLogado?"user_dash":"result");
  }
  function updQ(fi,bi,qi,v){const f=clone(forms);f[fi].blocos[bi].perguntas[qi]=san(v);setForms(f);}
  function delQ(fi,bi,qi){const f=clone(forms);f[fi].blocos[bi].perguntas.splice(qi,1);setForms(f);}
  function addQ(fi,bi){const f=clone(forms);f[fi].blocos[bi].perguntas.push("Nova pergunta…");setForms(f);}
  function updAb(fi,bi,ai,v){const f=clone(forms);f[fi].blocos[bi].abertas[ai]=san(v);setForms(f);}
  function delAb(fi,bi,ai){const f=clone(forms);f[fi].blocos[bi].abertas.splice(ai,1);setForms(f);}
  function addAb(fi,bi){const f=clone(forms);f[fi].blocos[bi].abertas.push("Nova pergunta aberta…");setForms(f);}
  function updBT(fi,bi,v){const f=clone(forms);f[fi].blocos[bi].title=san(v);setForms(f);}

  const pg={minHeight:"100vh",background:"#f8f9fa",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"};
  const card={background:"#fff",borderRadius:R.lg,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",border:"1px solid #e8ecf0"};
  const btn=(c=pc)=>({padding:"10px 20px",borderRadius:R.md,border:"none",background:c,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,letterSpacing:"0.01em",transition:"opacity 0.15s"});
  const btnO={padding:"10px 20px",borderRadius:R.md,border:"1.5px solid #dbeafe",background:"#fff",color:"#475569",cursor:"pointer",fontWeight:600,fontSize:13};
  const inp={width:"100%",padding:"10px 14px",borderRadius:R.md,border:"1.5px solid #dbeafe",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit",background:"#fff"};
  const hdr=(c=pc)=>({background:c,color:"#fff",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,boxShadow:"none",borderBottom:"1px solid rgba(0,0,0,0.08)"});
  const hBtn={border:"1.5px solid rgba(255,255,255,0.28)",color:"#fff",borderRadius:R.sm,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.12)"};
  const tabBtn=(active)=>({padding:"8px 18px",borderRadius:R.sm,border:"none",background:active?pc:"transparent",color:active?"#fff":"#64748b",cursor:"pointer",fontWeight:active?700:500,fontSize:13,transition:"all 0.15s"});

  if(screen==="loading") return(
    <div style={{...pg,alignItems:"center",justifyContent:"center",background:"linear-gradient(155deg,#eef2ff,#e0e7ff,#eff6ff)"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:14}}>
        <div style={{width:52,height:52,borderRadius:14,background:"linear-gradient(135deg,#2563eb,#1e40af)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,boxShadow:"0 4px 20px #2563eb44",letterSpacing:0}}>◎</div>
        <div style={{fontSize:13,color:"#94a3b8",letterSpacing:"0.04em"}}>Carregando…</div>
      </div>
    </div>
  );

  if(screen==="404") return(
    <div style={{...pg,alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{...card,maxWidth:360,textAlign:"center"}}><div style={{fontSize:48,marginBottom:12}}>🔍</div><h2 style={{color:"#1e3a8a"}}>Link não encontrado</h2><p style={{color:"#64748b",fontSize:13,marginTop:8}}>Este link não existe ou expirou.</p></div>
      <PoweredBy/>
    </div>
  );

  if(screen==="pub_report"){
    const d=window._rd||{};
    return(
      <div style={{...pg,padding:0}}>
        <div style={hdr("#1e3a8a")}><div><div style={{fontWeight:800,fontSize:15}}>📊 Relatório Público — {d.orgName}</div><div style={{fontSize:11,color:"#93c5fd"}}>Dados anônimos · LGPD conforme · {d.total} respondentes</div></div></div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"24px 16px 40px",width:"100%"}}>
          <div style={{...card,marginBottom:16}}><p style={{fontSize:13,color:"#64748b",marginBottom:8}}><strong>{d.orgName}</strong> · {d.ciclo} · {d.formTitle}</p><div style={{background:"#f0fdf4",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#166534"}}>🔒 Este relatório não contém dados pessoais identificáveis · LGPD conforme</div></div>
          <div style={{...card,marginBottom:16}}>
            <h3 style={{color:"#1e3a8a",marginBottom:16,fontSize:15}}>Pontuação por área</h3>
            {(d.bStats||[]).map((b,i)=><ScBar key={i} label={b.fullName||b.name} score={b.media} isRisk={b.isRisk}/>)}
            <p style={{fontSize:14,color:"#64748b",marginTop:16}}>Média geral: <strong style={{fontSize:22,color:"#1e3a8a"}}>{d.mgeral}/5</strong></p>
          </div>
          {d.abList?.length>0&&<div style={{...card}}><h3 style={{color:"#1e3a8a",marginBottom:12,fontSize:15}}>💬 Reflexões ({d.abList.length})</h3>{d.abList.map((t,i)=><div key={i} style={{background:"#f8faff",borderRadius:10,padding:"10px 14px",borderLeft:"3px solid #3b82f6",fontSize:13,color:"#334155",marginBottom:8,lineHeight:1.6}}>"{t}"</div>)}</div>}
        </div>
        <PoweredBy/>
      </div>
    );
  }

  if(screen==="home") return(
    <div style={{minHeight:"100vh",background:"#ffffff",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:380,width:"100%",textAlign:"center"}}>
        {/* Logo */}
        <div style={{width:64,height:64,borderRadius:18,background:"#2563eb",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,margin:"0 auto 20px",color:"#fff",fontWeight:300,lineHeight:1}}>◎</div>
        <h1 style={{fontSize:24,fontWeight:700,color:"#111827",margin:"0 0 8px",letterSpacing:"-0.02em"}}>Avalie360</h1>
        <p style={{color:"#6b7280",fontSize:14,margin:"0 0 36px",lineHeight:1.6}}>A forma mais simples de implantar avaliação 360° de verdade.</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <button onClick={()=>setScreen("org_list")}
            style={{padding:"12px 20px",borderRadius:R.md,border:"none",background:"#2563eb",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:14}}>
            Acessar painel
          </button>
          <button onClick={()=>setScreen("super_login")}
            style={{padding:"10px 20px",borderRadius:R.md,border:"1px solid #e5e7eb",background:"#fff",color:"#9ca3af",cursor:"pointer",fontWeight:400,fontSize:12}}>
            Super Admin
          </button>
        </div>
      </div>
      <PoweredBy/>
    </div>
  );

  
  if(screen==="super_login") return(
    <div style={{...pg,alignItems:"center",justifyContent:"center",padding:24,background:"#0f172a"}}>
      <div style={{...card,maxWidth:360,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:40,marginBottom:12}}>🔒</div><h2 style={{color:"#1e3a8a",marginBottom:4}}>Super Admin</h2><p style={{color:"#64748b",fontSize:12,marginBottom:24}}>Conectando Gente</p>
        <input type="password" placeholder="Senha master" value={superP} onChange={e=>setSuperP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loginSuper()} style={{...inp,border:`2px solid ${superE?"#ef4444":"#dbeafe"}`,marginBottom:6}}/>
        {superE&&<p style={{color:"#ef4444",fontSize:12,marginBottom:8}}>Senha incorreta</p>}
        <div style={{display:"flex",gap:10,marginTop:12}}><button onClick={()=>setScreen("home")} style={{...btnO,flex:1}}>Voltar</button><button onClick={loginSuper} style={{...btn("#1e3a8a"),flex:2}}>Entrar</button></div>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="super") return(
    <div style={{...pg,padding:0}}>
      <div style={hdr("#1e3a8a")}><div><div style={{fontWeight:800,fontSize:16}}>🔒 Super Admin — Conectando Gente</div><div style={{fontSize:11,color:"#93c5fd"}}>{Object.keys(orgs).length} organização(ões)</div></div><button onClick={()=>setScreen("home")} style={hBtn}>Sair</button></div>
      <div style={{maxWidth:860,margin:"0 auto",padding:"24px 16px 40px",width:"100%"}}>
        <div style={{...card,marginBottom:24}}>
          <h3 style={{color:"#1e3a8a",marginBottom:20,fontSize:15}}>➕ Nova Organização</h3>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOME *</label><input value={nOrg.name} onChange={e=>setNOrg(p=>({...p,name:e.target.value}))} style={inp} placeholder="Ex: Sepal — Servindo aos que Servem"/></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>SENHA DO ADMIN *</label><input type="password" value={nOrg.adminPassword} onChange={e=>setNOrg(p=>({...p,adminPassword:e.target.value}))} style={inp} placeholder="Senha"/></div>
            <div style={{gridColumn:"1 / -1"}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Identificador da URL <span style={{fontWeight:400,color:"#94a3b8",textTransform:"none"}}>(ex: "sepal" → avalie360.vercel.app/sepal/login)</span></label><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:12,color:"#94a3b8",whiteSpace:"nowrap"}}>sepal360.vercel.app/#/fill/</span><input value={nOrg.slug||""} onChange={e=>setNOrg(p=>({...p,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-")}))} style={{...inp,flex:1}} placeholder="sepal"/></div></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>COR PRINCIPAL</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={nOrg.primaryColor} onChange={e=>setNOrg(p=>({...p,primaryColor:e.target.value}))} style={{width:44,height:38,borderRadius:8,border:"2px solid #dbeafe",cursor:"pointer",padding:2}}/><input value={nOrg.primaryColor} onChange={e=>setNOrg(p=>({...p,primaryColor:e.target.value}))} style={{...inp,flex:1}}/></div></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>TIPO DE ORGANIZAÇÃO</label><select value={nOrg.orgType||"religiosa"} onChange={e=>setNOrg(p=>({...p,orgType:e.target.value}))} style={inp}><option value="religiosa">⛪ Religiosa (Igreja, agência missionária, ministério)</option><option value="nao_religiosa">🏢 Não-religiosa (Empresa, ONG, escola)</option></select></div>
            <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:6}}>LOGOMARCA</label><LogoUploader value={nOrg.logoUrl} onChange={url=>setNOrg(p=>({...p,logoUrl:url}))} color={nOrg.primaryColor}/></div>
          </div>
          {nOrgE&&<p style={{color:"#ef4444",fontSize:12,marginBottom:8}}>⚠️ {nOrgE}</p>}
          <button onClick={createOrg} style={{...btn("#16a34a")}}>Criar organização</button>
        </div>
        <div style={{...card}}>
          <h3 style={{color:"#1e3a8a",marginBottom:20,fontSize:15}}>🏢 Organizações cadastradas</h3>
          {Object.keys(orgs).length===0?<p style={{color:"#94a3b8",textAlign:"center",padding:"24px 0"}}>Nenhuma organização cadastrada.</p>:
            Object.values(orgs).map(o=>(
              <div key={o.id}>
                {/* Row */}
                <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 0",borderBottom:editingOrg?.id===o.id?"none":"1px solid #f1f5f9",flexWrap:"wrap"}}>
                  <OrgLogo org={o} size={44}/>
                  <div style={{flex:1,minWidth:160}}>
                    <div style={{fontWeight:700,color:"#1e3a8a",fontSize:14}}>{o.name}</div>
                    <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>ID: {o.id} · {new Date(o.createdAt).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>setEditingOrg(editingOrg?.id===o.id?null:clone(o))}
                      style={{padding:"6px 12px",borderRadius:8,border:"2px solid #dbeafe",background:editingOrg?.id===o.id?"#eff6ff":"#fff",color:"#2563eb",cursor:"pointer",fontSize:12,fontWeight:600}}>
                      {editingOrg?.id===o.id?"✕ Fechar":"✏️ Editar"}
                    </button>
                    <button onClick={()=>delOrg(o.id)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:600}}>Remover</button>
                  </div>
                </div>
                {/* Inline editor */}
                {editingOrg?.id===o.id&&(
                  <div style={{background:"#f8faff",borderRadius:14,padding:20,border:"1px solid #dbeafe",marginBottom:12}}>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOME</label>
                        <input value={editingOrg.name} onChange={e=>setEditingOrg(p=>({...p,name:e.target.value}))} style={inp}/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>PLANO PERSONALIZADO (formulários editáveis)</label>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                          <input type="checkbox" id="planCustom" checked={editingOrg.planCustom||false} onChange={e=>setEditingOrg(p=>({...p,planCustom:e.target.checked}))} style={{width:16,height:16,cursor:"pointer"}}/>
                          <label htmlFor="planCustom" style={{fontSize:13,color:"#334155",cursor:"pointer"}}>
                            {editingOrg.planCustom ? "✅ Ativo — org pode editar formulários (R$300/ciclo pago)" : "🔒 Inativo — formulários bloqueados para edição"}
                          </label>
                        </div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOVA SENHA DO ADMIN</label>
                        <input type="password" value={editingOrg.adminPassword||""} onChange={e=>setEditingOrg(p=>({...p,adminPassword:e.target.value}))} style={inp} placeholder="Deixe em branco para manter"/>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>COR PRINCIPAL</label>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          <input type="color" value={editingOrg.primaryColor||"#2563eb"} onChange={e=>setEditingOrg(p=>({...p,primaryColor:e.target.value}))} style={{width:44,height:38,borderRadius:8,border:"2px solid #dbeafe",cursor:"pointer",padding:2}}/>
                          <input value={editingOrg.primaryColor||"#2563eb"} onChange={e=>setEditingOrg(p=>({...p,primaryColor:e.target.value}))} style={{...inp,flex:1}}/>
                        </div>
                      </div>
                      <div>
                        <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:6}}>LOGOMARCA</label>
                        <LogoUploader value={editingOrg.logoUrl||""} onChange={url=>setEditingOrg(p=>({...p,logoUrl:url}))} color={editingOrg.primaryColor||"#2563eb"}/>
                        <input value={editingOrg.logoUrl||""} onChange={e=>setEditingOrg(p=>({...p,logoUrl:e.target.value}))} style={{...inp,marginTop:6,fontSize:11}} placeholder="Ou cole uma URL…"/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={async()=>{
                        await upsertOrg(editingOrg);
                        const updated={...orgs,[editingOrg.id]:editingOrg};
                        setOrgs(updated);setEditingOrg(null);
                      }} style={{...btn("#16a34a")}}>💾 Salvar alterações</button>
                      <button onClick={()=>setEditingOrg(null)} style={{...btnO}}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))
          }
        </div>
        <div style={{...card,marginTop:24}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <h3 style={{color:"#1e3a8a",fontSize:15,margin:0}}>🎟️ Cupons de desconto</h3>
            <button onClick={async()=>{setLoadingCupons(true);const c=await loadCupons();setCupons(c);setLoadingCupons(false);}}
              style={{padding:"6px 14px",borderRadius:8,border:"1.5px solid #dbeafe",background:"#fff",color:"#2563eb",cursor:"pointer",fontSize:12,fontWeight:600}}>
              {loadingCupons?"⏳ Carregando…":"↻ Carregar cupons"}
            </button>
          </div>
          {/* Criar cupom */}
          <div style={{background:"#f8faff",borderRadius:12,padding:16,border:"1px solid #dbeafe",marginBottom:20}}>
            <p style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:12}}>Novo cupom</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>CÓDIGO *</label>
                <input value={newCupom.codigo} onChange={e=>setNewCupom(p=>({...p,codigo:e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g,"")}))} style={inp} placeholder="Ex: SEPAL2026"/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>DESCONTO (%)</label>
                <input type="number" min="1" max="100" value={newCupom.desconto_pct} onChange={e=>setNewCupom(p=>({...p,desconto_pct:Math.min(100,Math.max(1,parseInt(e.target.value)||1))}))} style={inp}/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>APLICÁVEL EM</label>
                <select value={newCupom.aplicavel_em} onChange={e=>setNewCupom(p=>({...p,aplicavel_em:e.target.value}))} style={inp}>
                  <option value="ambos">Contratação + Upgrade</option>
                  <option value="contratacao">Só contratação</option>
                  <option value="upgrade">Só upgrade R$300</option>
                </select>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>USOS MÁXIMOS <span style={{fontWeight:400,color:"#94a3b8"}}>(em branco = ilimitado)</span></label>
                <input type="number" min="1" value={newCupom.usos_max} onChange={e=>setNewCupom(p=>({...p,usos_max:e.target.value}))} style={inp} placeholder="Ilimitado"/>
              </div>
            </div>
            <button onClick={async()=>{
              if(!newCupom.codigo.trim()){alert("Código obrigatório.");return;}
              const c={id:genId(10),codigo:newCupom.codigo.trim(),desconto_pct:newCupom.desconto_pct,aplicavel_em:newCupom.aplicavel_em,usos_max:newCupom.usos_max?parseInt(newCupom.usos_max):null,usos:0,ativo:true,created_at:new Date().toISOString()};
              const ok=await saveCupom(c);
              if(ok){setCupons(p=>[c,...p]);setNewCupom({codigo:"",desconto_pct:100,aplicavel_em:"ambos",usos_max:""});alert(`✅ Cupom "${c.codigo}" criado!`);}
              else alert("Erro ao criar cupom.");
            }} style={{...btn("#16a34a")}}>Criar cupom</button>
          </div>
          {/* Lista */}
          {cupons.length===0?(
            <p style={{color:"#94a3b8",textAlign:"center",padding:"16px 0",fontSize:13}}>Clique em "Carregar cupons" para ver os existentes.</p>
          ):(
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {cupons.map(c=>(
                <div key={c.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:10,border:`1px solid ${c.ativo?"#dbeafe":"#e2e8f0"}`,background:c.ativo?"#f8faff":"#f8f8f8",flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <div style={{fontWeight:700,fontSize:14,color:c.ativo?"#1e3a8a":"#94a3b8",fontFamily:"monospace"}}>{c.codigo}</div>
                    <div style={{fontSize:11,color:"#64748b",marginTop:2}}>
                      {c.desconto_pct===100?"Gratuito":`${c.desconto_pct}% off`} · {c.aplicavel_em==="ambos"?"Contratação+Upgrade":c.aplicavel_em==="contratacao"?"Só contratação":"Só upgrade"} · {c.usos} uso{c.usos!==1?"s":""}
                      {c.usos_max?` / ${c.usos_max} máx`:" (ilimitado)"}
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    <button onClick={async()=>{const ok=await toggleCupomAtivo(c.id,!c.ativo);if(ok)setCupons(p=>p.map(x=>x.id===c.id?{...x,ativo:!x.ativo}:x));}}
                      style={{padding:"5px 10px",borderRadius:6,border:`1.5px solid ${c.ativo?"#f59e0b":"#16a34a"}`,background:c.ativo?"#fffbeb":"#f0fdf4",color:c.ativo?"#d97706":"#16a34a",cursor:"pointer",fontSize:11,fontWeight:600}}>
                      {c.ativo?"⏸ Desativar":"▶ Ativar"}
                    </button>
                    <button onClick={async()=>{if(!confirm(`Remover cupom "${c.codigo}"?`))return;const ok=await deleteCupom(c.id);if(ok)setCupons(p=>p.filter(x=>x.id!==c.id));}}
                      style={{padding:"5px 10px",borderRadius:6,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11,fontWeight:600}}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="org_list") return(
    <div style={{...pg,alignItems:"center",justifyContent:"center",padding:24,background:"#f8f9fa"}}>
      <div style={{maxWidth:440,width:"100%"}}>
        <div style={{...card,marginBottom:16}}>
          <h2 style={{color:"#1e3a8a",marginBottom:4,fontSize:18}}>🏢 Acesso Organizacional</h2>
          <p style={{color:"#64748b",fontSize:13,marginBottom:20}}>Selecione sua organização:</p>
          {Object.keys(orgs).length===0?<p style={{color:"#94a3b8",textAlign:"center",padding:"24px 0",fontSize:13}}>Nenhuma organização disponível.</p>:
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {Object.values(orgs).map(o=>(
                <button key={o.id} onClick={()=>{setOrg(o);setOrgP("");setOrgE(false);setScreen("org_login");}} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#f8faff",borderRadius:14,border:`2px solid ${o.primaryColor||"#dbeafe"}33`,cursor:"pointer",textAlign:"left"}}>
                  <OrgLogo org={o} size={40}/><div style={{fontWeight:700,color:"#1e3a8a",fontSize:14}}>{o.name}</div><span style={{marginLeft:"auto",color:"#bfdbfe",fontSize:18}}>›</span>
                </button>
              ))}
            </div>}
        </div>
        <button onClick={()=>setScreen("home")} style={{...btnO,width:"100%"}}>← Voltar</button>
        <PoweredBy/>
      </div>
    </div>
  );

  if(screen==="org_login"&&org) return(
    <div style={{...pg,alignItems:"center",justifyContent:"center",padding:24,background:"#f8f9fa"}}>
      <div style={{...card,maxWidth:360,width:"100%",textAlign:"center"}}>
        <OrgLogo org={org} size={64}/><h2 style={{color:"#1e3a8a",margin:"14px 0 4px",fontSize:18}}>{org.name}</h2><p style={{color:"#64748b",fontSize:12,marginBottom:24}}>Painel administrativo</p>
        <div style={{position:"relative",marginBottom:6}}>
          <input type={showPwd?"text":"password"} placeholder="Senha do administrador" value={orgP}
            onChange={e=>setOrgP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&loginOrg(org)}
            style={{...inp,border:`2px solid ${orgE?"#ef4444":"#dbeafe"}`,paddingRight:48}}/>
          <button onClick={()=>setShowPwd(p=>!p)}
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:18,color:"#94a3b8",padding:4}}>
            {showPwd?"🙈":"👁️"}
          </button>
        </div>
        {orgE&&<p style={{color:"#ef4444",fontSize:12,marginBottom:8}}>Senha incorreta</p>}
        <div style={{display:"flex",gap:10,marginTop:12}}><button onClick={()=>setScreen("org_list")} style={{...btnO,flex:1}}>Voltar</button><button onClick={()=>loginOrg(org)} style={{...btn(org.primaryColor||"#2563eb"),flex:2}}>Entrar</button></div>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="dash"&&org){
    const links=getLinks();
    return(<div style={{minHeight:"100vh",background:"#f8f9fa",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",padding:0}}>
      {/* Header */}
      <div style={{background:pc,color:"#fff",padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8,boxShadow:"0 2px 10px rgba(0,0,0,0.14)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><OrgLogo org={org} size={36}/><div><div style={{fontWeight:800,fontSize:15,letterSpacing:"-0.01em"}}>{org.name}</div><div style={{fontSize:11,opacity:0.8,marginTop:1}}>Painel administrativo · Avaliação 360°</div></div></div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <button onClick={()=>setScreen("editor")} style={{border:"1.5px solid rgba(255,255,255,0.28)",color:"#fff",borderRadius:R.sm,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.12)"}}>✏️ Formulários</button>
          
          <button onClick={async()=>{const fns=await loadFuncoes(org.id);setFuncoes(fns);const u=await loadUsuarios(org.id);setUsuarios(u);setScreen("equipe");}} style={{border:"1.5px solid rgba(255,255,255,0.28)",color:"#fff",borderRadius:R.sm,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.12)"}}>👥 Equipe</button>
          <button onClick={()=>setScreen("settings")} style={{border:"1.5px solid rgba(255,255,255,0.28)",color:"#fff",borderRadius:R.sm,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(255,255,255,0.12)"}}>⚙️ Config</button>
          <button onClick={()=>{setScreen("home");setOrg(null);}} style={{border:"1.5px solid rgba(255,255,255,0.18)",color:"#fff",borderRadius:R.sm,padding:"7px 14px",cursor:"pointer",fontSize:12,fontWeight:600,background:"rgba(0,0,0,0.18)"}}>Sair</button>
        </div>
      </div>
      <div style={{maxWidth:960,margin:"0 auto",padding:"24px 16px 48px",width:"100%"}}>
        {/* Links colapsável */}
        <div style={{background:"#fff",borderRadius:R.xl,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><h3 style={{color:"#1e3a8a",fontSize:15,margin:0,fontWeight:700}}>🔗 Links de acesso</h3><p style={{fontSize:11,color:"#94a3b8",marginTop:3}}>Compartilhe com os avaliadores</p></div>
            <button onClick={()=>setShowLinks(p=>!p)} style={{padding:"7px 16px",borderRadius:R.sm,border:"1.5px solid #dbeafe",background:"#fff",color:"#64748b",cursor:"pointer",fontSize:12,fontWeight:600}}>{showLinks?"▲ Ocultar":"▼ Mostrar"}</button>
          </div>
          {showLinks&&(<>
            <div style={{marginTop:16,display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
              <select value={org.activeCiclo||CICLOS[0]} onChange={async e=>{const updated={...org,activeCiclo:e.target.value};await upsertOrg(updated);const u={...orgs,[org.id]:updated};setOrgs(u);setOrg(updated);}} style={{padding:"7px 12px",borderRadius:R.sm,border:"1.5px solid #dbeafe",fontSize:12,outline:"none",fontWeight:600,color:"#334155"}}>{CICLOS.map(c=><option key={c}>{c}</option>)}</select>
              <button onClick={()=>setScreen("links_editor")} style={{padding:"7px 14px",borderRadius:R.sm,border:`1.5px solid ${pc}`,background:"#fff",color:pc,cursor:"pointer",fontSize:12,fontWeight:700}}>✏️ Personalizar</button>
            </div>
            {!org.baseUrl&&<div style={{background:"#fefce8",borderRadius:R.sm,padding:"10px 14px",border:"1px solid #fde68a",margin:"12px 0",fontSize:12,color:"#92400e",display:"flex",alignItems:"center",gap:8}}>⚠️ Configure a <strong>URL do app</strong> nas configurações para gerar links corretos.<button onClick={()=>setScreen("settings")} style={{marginLeft:"auto",padding:"4px 10px",borderRadius:6,border:"none",background:"#f59e0b",color:"#fff",cursor:"pointer",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>Configurar</button></div>}
            {links.map(l=><LinkCard key={l.id} label={`${l.icon} ${l.title}`} link={l.link} color={pc}/>)}
          </>)}
        </div>
        {/* Filtros */}
        <div style={{background:"#fff",borderRadius:R.xl,padding:20,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",marginBottom:20}}>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
            <div style={{flex:1,minWidth:130}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Ciclo</label><select value={dci} onChange={e=>{setDci(e.target.value);setStatusData(null);}} style={{width:"100%",padding:"10px 12px",borderRadius:R.md,border:"1.5px solid #dbeafe",fontSize:13,outline:"none",background:"#fff"}}>{CICLOS.map(c=><option key={c}>{c}</option>)}</select></div>
            <div style={{flex:1,minWidth:130}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Formulário</label><select value={dfi} onChange={e=>{setDfi(Number(e.target.value));setStatusData(null);}} style={{width:"100%",padding:"10px 12px",borderRadius:R.md,border:"1.5px solid #dbeafe",fontSize:13,outline:"none",background:"#fff"}}>{forms.map((f,i)=><option key={f.id} value={i}>{f.icon} {f.title}</option>)}</select></div>
            <div style={{flex:1,minWidth:130}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Avaliado</label><select value={dAvaliado} onChange={e=>{setDAvaliado(e.target.value);setStatusData(null);}} style={{width:"100%",padding:"10px 12px",borderRadius:R.md,border:"1.5px solid #dbeafe",fontSize:13,outline:"none",background:"#fff"}}><option value="">Todos</option>{usuarios.filter(u=>u.participa_ciclo!==false).map(u=><option key={u.id} value={u.id}>{u.nome}{u.funcao_id?` — ${funcoes.find(f=>f.id===u.funcao_id)?.nome||""}`:""}</option>)}</select></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button onClick={exportCSV} style={{padding:"10px 14px",borderRadius:R.md,border:"1.5px solid #dbeafe",background:"#fff",color:"#475569",cursor:"pointer",fontWeight:600,fontSize:12}}>⬇️ CSV</button>
              <button onClick={exportXLSX} style={{padding:"10px 14px",borderRadius:R.md,border:"1.5px solid #16a34a",background:"#f0fdf4",color:"#16a34a",cursor:"pointer",fontWeight:700,fontSize:12}}>📊 Excel</button>
              <button onClick={exportHTML} style={{padding:"10px 14px",borderRadius:R.md,border:"none",background:"#7c3aed",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>📄 HTML</button>
              <button onClick={shareReport} style={{padding:"10px 14px",borderRadius:R.md,border:"none",background:repCopied?"#16a34a":"#0891b2",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12,transition:"background 0.2s"}}>{repCopied==="saving"?"⏳":repCopied?"✓ Link!":"🔗 Compartilhar"}</button>
              {dAvaliado&&dData.length>0&&(
                <button onClick={()=>printIndividualPDF({org,avaliado:usuarios.find(u=>u.id===dAvaliado)?.nome||dAvaliado,ciclo:dci,formTitle:dForm?.title||"",bStats,mgeral,abList,respsCount:dData.length})}
                  style={{padding:"10px 14px",borderRadius:R.md,border:"none",background:"#dc2626",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>🖨️ PDF</button>
              )}
            </div>
          </div>
        </div>
        {/* KPIs */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
          <KpiCard icon="📋" val={dData.length} label="Respostas" color={pc}/>
          <KpiCard icon="⭐" val={mgeral} label="Média Geral" color={mgeral==="—"?"#94a3b8":sColor(Number(mgeral))}/>
          <KpiCard icon="💬" val={abList.length} label="Reflexões" color="#8b5cf6"/>
          <KpiCard icon="👥" val={`${usuarios.length}${org.numColabs?"/"+org.numColabs:""}`} label="Colaboradores" color={org.numColabs&&usuarios.length>org.numColabs?"#dc2626":"#059669"}/>
        </div>
        {/* Abas */}
        <div style={{background:"#fff",borderRadius:R.xl,padding:8,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",marginBottom:20}}>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {[{id:"resultados",label:"📊 Resultados"},{id:"radar",label:"🕸️ Radar"},{id:"autovsoutros",label:"🔄 Auto vs Outros"},{id:"status",label:"👁 Status"},{id:"comparativo",label:"📈 Evolução"}].map(t=>(
              <button key={t.id} onClick={()=>{setDashTab(t.id);if(t.id==="status")loadStatusData();}}
                style={{padding:"8px 14px",borderRadius:R.sm,border:"none",background:dashTab===t.id?pc:"transparent",color:dashTab===t.id?"#fff":"#64748b",cursor:"pointer",fontWeight:dashTab===t.id?700:500,fontSize:12,transition:"all 0.15s"}}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* Resultados */}
        {dashTab==="resultados"&&(dData.length===0?(
          <div style={{background:"#fff",borderRadius:R.xl,padding:56,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",textAlign:"center"}}><div style={{fontSize:48,marginBottom:14}}>📭</div><p style={{color:"#475569",fontSize:15,fontWeight:600}}>Nenhuma resposta ainda</p><p style={{color:"#94a3b8",fontSize:13,marginTop:8}}>Compartilhe os links para coletar respostas.</p></div>
        ):(<>
          <div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",marginBottom:20}}><h3 style={{color:"#1e3a8a",marginBottom:4,fontSize:15,fontWeight:700}}>📊 Média por área</h3><p style={{fontSize:12,color:"#64748b",marginBottom:16}}>{dForm?.title||"Formulário"} · {dAvaliado?usuarios.find(u=>u.id===dAvaliado)?.nome||"Avaliado":"Todos os avaliados"} · Ciclo {dci}</p><ResponsiveContainer width="100%" height={240}><BarChart data={bStats} margin={{top:5,right:10,left:-20,bottom:55}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:10,fill:"#64748b"}} angle={-30} textAnchor="end" interval={0}/><YAxis domain={[0,5]} tick={{fontSize:11}}/><Tooltip formatter={v=>[`${v}/5`,"Média"]} labelFormatter={(_,p)=>p[0]?.payload?.fullName||""}/><Bar dataKey="media" fill={pc} radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></div>
          <div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",marginBottom:20}}><h3 style={{color:"#1e3a8a",marginBottom:4,fontSize:15,fontWeight:700}}>📈 Distribuição das respostas</h3><p style={{fontSize:12,color:"#64748b",marginBottom:16}}>Frequência de cada resposta em todas as perguntas · {dForm?.title||""} · {dci}</p><ResponsiveContainer width="100%" height={190}><BarChart data={dist} margin={{top:5,right:10,left:-20,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip formatter={v=>[v,"Respostas"]}/><Bar dataKey="count" fill="#10b981" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div>
          <div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0",marginBottom:20}}><h3 style={{color:"#1e3a8a",marginBottom:20,fontSize:15,fontWeight:700}}>🎯 Detalhamento por área</h3>{bStats.map((b,i)=><ScBar key={i} label={b.fullName} score={b.media} isRisk={b.isRisk}/>)}</div>
          {abList.length>0&&<div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0"}}><h3 style={{color:"#1e3a8a",marginBottom:6,fontSize:15,fontWeight:700}}>💬 Reflexões abertas</h3><p style={{fontSize:11,color:"#94a3b8",marginBottom:16}}>{abList.length} respostas · anônimas · LGPD conforme</p><div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:400,overflowY:"auto"}}>{abList.map((t,i)=><div key={i} style={{background:"#f8faff",borderRadius:R.md,padding:"12px 16px",borderLeft:`3px solid ${pc}`,fontSize:13,color:"#334155",lineHeight:1.7}}>"{t}"</div>)}</div></div>}
        </>))}
        {/* Radar */}
        {dashTab==="radar"&&(<div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0"}}>
          <h3 style={{color:"#1e3a8a",fontSize:15,margin:"0 0 6px",fontWeight:700}}>🕸️ Radar por Dimensões</h3>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:20}}>{dForm?.title||"Formulário"} · {dAvaliado?usuarios.find(u=>u.id===dAvaliado)?.nome||"Avaliado":"Todos os avaliados"} · Ciclo {dci}</p>
          {radarData.length<3?(<div style={{textAlign:"center",padding:"44px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:12}}>🕸️</div><p style={{fontSize:13}}>São necessárias pelo menos 3 dimensões para exibir o radar.</p></div>):(
            <ResponsiveContainer width="100%" height={360}>
              <RadarChart data={radarData} margin={{top:20,right:30,bottom:20,left:30}}>
                <PolarGrid stroke="#e2e8f0"/>
                <PolarAngleAxis dataKey="subject" tick={{fontSize:11,fill:"#64748b"}}/>
                <PolarRadiusAxis angle={90} domain={[0,5]} tick={{fontSize:10,fill:"#94a3b8"}} tickCount={6}/>
                <Radar name="Média" dataKey="value" stroke={pc} fill={pc} fillOpacity={0.18} strokeWidth={2}/>
                <Tooltip formatter={(v,n,p)=>[`${v}/5`,p.payload.fullName]}/>
              </RadarChart>
            </ResponsiveContainer>
          )}
          {radarData.length>=3&&<p style={{fontSize:11,color:"#94a3b8",textAlign:"center",marginTop:8}}>Passe o mouse sobre os pontos para ver os valores exatos</p>}
        </div>)}

        {/* Auto vs Outros */}
        {dashTab==="autovsoutros"&&(<div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0"}}>
          <h3 style={{color:"#1e3a8a",fontSize:15,margin:"0 0 6px",fontWeight:700}}>🔄 Autoavaliação vs. Visão dos Outros</h3>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:20}}>O dado mais revelador do 360°: como a pessoa se vê vs. como os outros a veem. Selecione um avaliado acima.</p>
          {!dAvaliado?(<div style={{textAlign:"center",padding:"44px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:12}}>👤</div><p style={{fontSize:13}}>Selecione um avaliado no filtro acima.</p></div>):
          !autoVsOutrosData||autoVsOutrosData.length===0?(<div style={{textAlign:"center",padding:"44px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:12}}>📊</div><p style={{fontSize:13}}>Sem dados suficientes. É necessário ter autoavaliação e pelo menos outra avaliação para este avaliado.</p></div>):(
            <>
              <div style={{display:"flex",gap:16,marginBottom:16,flexWrap:"wrap"}}>
                <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"#2563eb",fontWeight:600}}><span style={{width:12,height:12,borderRadius:2,background:"#2563eb",display:"inline-block"}}/> Autoavaliação</span>
                <span style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:13,color:"#10b981",fontWeight:600}}><span style={{width:12,height:12,borderRadius:2,background:"#10b981",display:"inline-block"}}/> Visão dos outros</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={autoVsOutrosData} margin={{top:5,right:10,left:-20,bottom:60}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{fontSize:10,fill:"#64748b"}} angle={-30} textAnchor="end" interval={0}/>
                  <YAxis domain={[0,5]} tick={{fontSize:11}}/>
                  <Tooltip formatter={(v,n)=>[`${v}/5`,n==="auto"?"Autoavaliação":"Visão dos outros"]} labelFormatter={(_,p)=>p[0]?.payload?.fullName||""}/>
                  <Bar dataKey="auto" name="auto" fill="#2563eb" radius={[6,6,0,0]} opacity={0.85}/>
                  <Bar dataKey="outros" name="outros" fill="#10b981" radius={[6,6,0,0]} opacity={0.85}/>
                </BarChart>
              </ResponsiveContainer>
              <div style={{marginTop:20,overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead><tr style={{background:"#f8faff"}}>
                    <th style={{padding:"8px 12px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"2px solid #dbeafe"}}>Dimensão</th>
                    <th style={{padding:"8px 12px",textAlign:"center",color:"#2563eb",fontWeight:700,borderBottom:"2px solid #dbeafe"}}>Autoavaliação</th>
                    <th style={{padding:"8px 12px",textAlign:"center",color:"#10b981",fontWeight:700,borderBottom:"2px solid #dbeafe"}}>Visão dos outros</th>
                    <th style={{padding:"8px 12px",textAlign:"center",color:"#64748b",fontWeight:700,borderBottom:"2px solid #dbeafe"}}>Diferença</th>
                  </tr></thead>
                  <tbody>{autoVsOutrosData.map((row,i)=>{
                    const diff=row.auto>0&&row.outros>0?parseFloat((row.auto-row.outros).toFixed(2)):null;
                    return(<tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8faff"}}>
                      <td style={{padding:"8px 12px",color:"#334155",fontWeight:500}}>{row.fullName}</td>
                      <td style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:row.auto>0?sColor(row.auto):"#94a3b8"}}>{row.auto>0?row.auto.toFixed(1):"—"}</td>
                      <td style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:row.outros>0?sColor(row.outros):"#94a3b8"}}>{row.outros>0?row.outros.toFixed(1):"—"}</td>
                      <td style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:diff===null?"#94a3b8":diff>0.5?"#f59e0b":diff<-0.5?"#3b82f6":"#64748b"}}>
                        {diff===null?"—":diff>0?`+${diff.toFixed(1)}`:diff.toFixed(1)}
                      </td>
                    </tr>);
                  })}</tbody>
                </table>
              </div>
              <p style={{fontSize:11,color:"#94a3b8",marginTop:12}}>💡 Diferença positiva = pessoa se avalia mais alto que os outros a avaliam. Negativa = pessoa se avalia abaixo do que os outros percebem.</p>
            </>
          )}
        </div>)}

        {/* Status */}
        {dashTab==="status"&&(<div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
            <div><h3 style={{color:"#1e3a8a",fontSize:15,margin:0,fontWeight:700}}>👁 Status em Tempo Real</h3><p style={{fontSize:12,color:"#94a3b8",marginTop:4}}>Ciclo {dci} · {dForm?.title}</p></div>
            <button onClick={loadStatusData} style={{padding:"8px 18px",borderRadius:R.md,border:"none",background:pc,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:12}}>{loadingStatus?"⏳ Carregando…":"↻ Atualizar"}</button>
          </div>
          {!statusData?(<div style={{textAlign:"center",padding:"44px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:12}}>👁</div><p style={{fontSize:13}}>Clique em "Atualizar" para carregar o status em tempo real.</p></div>):(()=>{
            const {atribs,userMap}=statusData;const concluidas=atribs.filter(a=>a.concluida).length;const pct=atribs.length>0?Math.round((concluidas/atribs.length)*100):0;
            return(<><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {[{l:"Total",v:atribs.length,c:"#2563eb",bg:"#eff6ff"},{l:"Concluídas",v:concluidas,c:"#16a34a",bg:"#f0fdf4"},{l:"Pendentes",v:atribs.length-concluidas,c:"#d97706",bg:"#fefce8"}].map(k=>(
                <div key={k.l} style={{background:k.bg,borderRadius:R.md,padding:"14px 16px",textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:k.c,letterSpacing:"-0.02em"}}>{k.v}</div><div style={{fontSize:11,color:"#64748b",marginTop:2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>{k.l}</div></div>
              ))}
            </div>
            <div style={{background:"#e2e8f0",borderRadius:R.full,height:8,marginBottom:8}}><div style={{width:`${pct}%`,height:8,borderRadius:R.full,background:`linear-gradient(90deg,${pc},#10b981)`,transition:"width 0.6s"}}/></div>
            <p style={{fontSize:12,color:"#64748b",marginBottom:16,textAlign:"center"}}>{pct}% concluído</p>
            {atribs.length===0?<p style={{textAlign:"center",color:"#94a3b8",fontSize:13,padding:"20px 0"}}>Nenhuma atribuição para este ciclo/formulário.</p>:(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {atribs.map(a=>{const u=userMap[a.usuario_id];return(<div key={a.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:a.concluida?"#f0fdf4":"#fff",borderRadius:R.md,border:`1px solid ${a.concluida?"#86efac":"#e2e8f0"}`,flexWrap:"wrap"}}>
                  <div style={{width:32,height:32,borderRadius:8,background:a.concluida?"#22c55e":pc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>{(u?.nome||"?").slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1,minWidth:100}}><div style={{fontWeight:600,color:"#1e3a8a",fontSize:13}}>{u?.nome||a.usuario_id}</div>{a.avaliado_nome&&<div style={{fontSize:11,color:"#94a3b8",marginTop:1}}>→ {a.avaliado_nome}</div>}</div>
                  <StatusBadge ok={a.concluida}/>
                </div>);})}
              </div>
            )}</>);
          })()}
        </div>)}
        {/* Comparativo */}
        {dashTab==="comparativo"&&(<div style={{background:"#fff",borderRadius:R.xl,padding:24,boxShadow:"0 1px 4px rgba(0,0,0,0.05)",border:"1px solid #e8ecf0"}}>
          <h3 style={{color:"#1e3a8a",fontSize:15,margin:"0 0 6px",fontWeight:700}}>📈 Evolução entre Ciclos</h3>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:20}}>Selecione um avaliado no filtro acima para ver a evolução semestral.</p>
          {!dAvaliado?(<div style={{textAlign:"center",padding:"44px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:12}}>👤</div><p style={{fontSize:13}}>Selecione um avaliado para ver a evolução.</p></div>):
          ciclosComDados.length<2?(<div style={{textAlign:"center",padding:"44px 0",color:"#94a3b8"}}><div style={{fontSize:36,marginBottom:12}}>📊</div><p style={{fontSize:13}}>São necessários dados de pelo menos 2 ciclos.</p><p style={{fontSize:12,marginTop:6}}>Ciclos com dados: {ciclosComDados.length>0?ciclosComDados.join(", "):"nenhum"}</p></div>):
          comparativoData&&(<>
            <div style={{marginBottom:14,display:"flex",gap:8,flexWrap:"wrap"}}>
              {ciclosComDados.map((c,i)=><span key={c} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",borderRadius:R.full,background:`${COMP_COLORS[i%COMP_COLORS.length]}15`,border:`1px solid ${COMP_COLORS[i%COMP_COLORS.length]}40`,fontSize:12,color:COMP_COLORS[i%COMP_COLORS.length],fontWeight:700}}><span style={{width:8,height:8,borderRadius:"50%",background:COMP_COLORS[i%COMP_COLORS.length],display:"inline-block"}}/>{c}</span>)}
            </div>
            <ResponsiveContainer width="100%" height={280}><LineChart data={comparativoData} margin={{top:5,right:20,left:-20,bottom:60}}><CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/><XAxis dataKey="name" tick={{fontSize:10,fill:"#64748b"}} angle={-30} textAnchor="end" interval={0}/><YAxis domain={[0,5]} tick={{fontSize:11}}/><Tooltip formatter={(v,n)=>[`${v}/5`,n]}/><Legend wrapperStyle={{fontSize:11,paddingTop:8}}/>{ciclosComDados.map((c,i)=><Line key={c} type="monotone" dataKey={c.replace(" - ","·").replace(" Semestre","")} stroke={COMP_COLORS[i%COMP_COLORS.length]} strokeWidth={2.5} dot={{r:4}} activeDot={{r:6}}/>)}</LineChart></ResponsiveContainer>
            <div style={{marginTop:20}}><p style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Tabela comparativa</p><div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"#f8faff"}}><th style={{padding:"8px 12px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"2px solid #dbeafe"}}>Dimensão</th>{ciclosComDados.map((c,i)=><th key={c} style={{padding:"8px 12px",textAlign:"center",color:COMP_COLORS[i%COMP_COLORS.length],fontWeight:700,borderBottom:"2px solid #dbeafe",whiteSpace:"nowrap"}}>{c.replace(" - ","·").replace(" Semestre","")}</th>)}</tr></thead><tbody>{comparativoData.map((row,i)=><tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:i%2===0?"#fff":"#f8faff"}}><td style={{padding:"8px 12px",color:"#334155",fontWeight:500}}>{row.fullName}</td>{ciclosComDados.map((c,j)=>{const k=c.replace(" - ","·").replace(" Semestre","");const val=row[k];return<td key={c} style={{padding:"8px 12px",textAlign:"center",fontWeight:700,color:val>0?sColor(val):"#94a3b8"}}>{val>0?val.toFixed(1):"—"}</td>;})}</tr>)}</tbody></table></div></div>
          </>)}
        </div>)}
      </div>
      <PoweredBy/>

      {/* ── ONBOARDING MODAL ── */}
      {showOnboarding&&(()=>{
        const steps=[
          {icon:"🎉",title:"Bem-vindo ao Avalie360!",desc:"Sua conta está pronta. Vamos configurar tudo em 4 passos simples para você lançar o primeiro ciclo de avaliação."},
          {icon:"👥",title:"Passo 1 — Crie as funções e colaboradores",desc:"No menu superior, clique em \"👥 Equipe\". Crie as funções da organização (ex: Pastor, Coordenador) e marque quem avalia quem. Depois cadastre os colaboradores com suas funções.\n\n💡 Autoavaliação e Avaliação de Pares são geradas automaticamente — você não precisa configurar isso."},
          {icon:"👤",title:"Passo 2 — Cadastre os colaboradores",desc:"Na tela \"👥 Equipe\", cadastre todos os colaboradores. Cada um tem um toggle \"No ciclo\" — desmarque quem não deve participar desta rodada de avaliação."},
          {icon:"⚙️",title:"Passo 3 — Configure o ciclo",desc:"Clique em \"⚙️ Config\" no menu superior. Defina o Ciclo Ativo (ex: 2026 - 1º Semestre) e configure a URL do app para gerar os links corretamente."},
          {icon:"🔗",title:"Passo 4 — Compartilhe os links",desc:"No painel principal, clique em \"🔗 Links de acesso\", copie os links e envie para os colaboradores por WhatsApp ou email. Pronto para começar!"},
        ];
        const s=steps[onboardingStep];
        const isLast=onboardingStep===steps.length-1;
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.7)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"#fff",borderRadius:20,padding:36,maxWidth:460,width:"100%",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",textAlign:"center",position:"relative"}}>
              <button onClick={()=>setShowOnboarding(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
              <div style={{fontSize:52,marginBottom:16}}>{s.icon}</div>
              <h2 style={{fontSize:20,fontWeight:800,color:"#1e3a8a",marginBottom:10}}>{s.title}</h2>
              <p style={{fontSize:14,color:"#64748b",lineHeight:1.7,marginBottom:24,whiteSpace:"pre-line"}}>{s.desc}</p>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:24}}>
                {steps.map((_,i)=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:i===onboardingStep?pc:"#e2e8f0",transition:"background 0.2s"}}/>)}
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"center"}}>
                {onboardingStep>0&&<button onClick={()=>setOnboardingStep(p=>p-1)} style={{padding:"10px 20px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",cursor:"pointer",fontWeight:600,fontSize:14}}>← Anterior</button>}
                <button onClick={()=>{
                  if(isLast){setShowOnboarding(false);}
                  else{setOnboardingStep(p=>p+1);}
                }} style={{padding:"12px 28px",borderRadius:10,border:"none",background:pc,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15}}>
                  {isLast?"Fechar e começar! 🚀":"Próximo →"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>);
  }

    if(screen==="settings"&&org&&cfg) return(
    <div style={{...pg,padding:0,background:"#f8f9fa"}}>
      <div style={hdr(pc)}><div style={{fontWeight:800,fontSize:15}}>⚙️ Configurações — {org.name}</div><button onClick={()=>setScreen("dash")} style={hBtn}>← Voltar</button></div>
      <div style={{maxWidth:600,margin:"0 auto",padding:"20px 16px 40px",width:"100%",flex:1}}>
        <div style={{...card,marginBottom:16}}>
          <h3 style={{color:"#1e3a8a",marginBottom:20,fontSize:15}}>Identidade da organização</h3>
          <div style={{marginBottom:14}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOME</label><input value={cfg.name} onChange={e=>setCfg(p=>({...p,name:e.target.value}))} style={inp}/></div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>IDENTIFICADOR DA URL <span style={{fontWeight:400,color:"#94a3b8"}}>(parte amigável da URL, ex: "sepal")</span></label>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:12,color:"#94a3b8",whiteSpace:"nowrap"}}>avalie360.vercel.app/</span>
              <input value={cfg.slug||""} onChange={e=>setCfg(p=>({...p,slug:e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,"-")}))} style={{...inp,flex:1}} placeholder="sepal"/>
            </div>
            <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Link de login: <strong>{cfg.baseUrl||"avalie360.vercel.app"}/{cfg.slug||"slug"}/login</strong></p>
          </div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:6}}>LOGOMARCA</label>
            <LogoUploader value={cfg.logoUrl||""} onChange={url=>setCfg(p=>({...p,logoUrl:url}))} color={cfg.primaryColor||"#2563eb"}/>
            <div style={{marginTop:8}}><label style={{fontSize:10,fontWeight:700,color:"#94a3b8",display:"block",marginBottom:4}}>Cole o link (URL) da logomarca <span style={{fontWeight:400}}>(ex: https://suaorg.com/logo.png)</span></label><input value={cfg.logoUrl||""} onChange={e=>setCfg(p=>({...p,logoUrl:e.target.value}))} style={inp} placeholder="https://suaorg.com/logo.png"/></div>
          </div>
          <div style={{marginBottom:14}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>COR PRINCIPAL</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={cfg.primaryColor||"#2563eb"} onChange={e=>setCfg(p=>({...p,primaryColor:e.target.value}))} style={{width:48,height:40,borderRadius:8,border:"2px solid #dbeafe",cursor:"pointer",padding:2}}/><input value={cfg.primaryColor||"#2563eb"} onChange={e=>setCfg(p=>({...p,primaryColor:e.target.value}))} style={{...inp,flex:1}}/></div></div>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>URL DO APP (para gerar links corretos)</label>
            <input value={cfg.baseUrl||""} onChange={e=>setCfg(p=>({...p,baseUrl:e.target.value}))} style={inp} placeholder="Ex: https://360.suaorganizacao.com.br"/>
            <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Cole aqui o endereço onde o app está publicado. Isso corrige os links de compartilhamento.</p>
          </div>
          <div style={{marginBottom:20}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOVA SENHA DO ADMINISTRADOR</label><div style={{position:"relative"}}><input type={showAdminPass?"text":"password"} value={cfg.adminPassword||""} onChange={e=>setCfg(p=>({...p,adminPassword:e.target.value}))} style={{...inp,paddingRight:40}} placeholder="Deixe em branco para não alterar"/><button type="button" onClick={()=>setShowAdminPass(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#94a3b8",padding:0}}>{showAdminPass?"🙈":"👁️"}</button></div></div>
          <div style={{marginBottom:20}}><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>Ciclo ativo</label><select value={cfg.activeCiclo||CICLOS[0]} onChange={e=>setCfg(p=>({...p,activeCiclo:e.target.value}))} style={{...inp}}>{CICLOS.map(c=><option key={c}>{c}</option>)}</select></div>
          <button onClick={saveCfg} style={{...btn(cfg.primaryColor||"#2563eb"),width:"100%",padding:"12px 20px",fontSize:14}}>💾 Salvar configurações</button>
        </div>
        <div style={{...card,marginBottom:16}}>
          <h3 style={{color:"#1e3a8a",marginBottom:4,fontSize:15,fontWeight:700}}>🏛️ Tipo de organização</h3>
          <p style={{fontSize:12,color:"#64748b",marginBottom:12,lineHeight:1.6}}>Define a linguagem dos formulários de avaliação. Esta configuração é definida na criação e não pode ser alterada para preservar a consistência histórica dos dados.</p>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderRadius:R.md,background:"#eff6ff",border:"1px solid #dbeafe"}}>
            <span style={{fontSize:22}}>{(cfg.orgType||"religiosa")==="religiosa"?"⛪":"🏢"}</span>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:"#1e3a8a"}}>{(cfg.orgType||"religiosa")==="religiosa"?"Organização Religiosa":"Organização Não-religiosa"}</div>
              <div style={{fontSize:12,color:"#64748b"}}>{(cfg.orgType||"religiosa")==="religiosa"?"Igrejas, agências missionárias, equipes ministeriais — linguagem ministerial":"Empresas, ONGs, escolas — linguagem profissional"}</div>
            </div>
            <span style={{marginLeft:"auto",fontSize:11,background:"#dbeafe",color:"#1e40af",padding:"3px 8px",borderRadius:6,fontWeight:600}}>Definido</span>
          </div>
        </div>
        <div style={{...card,marginBottom:16}}>
          <h3 style={{color:"#1e3a8a",marginBottom:4,fontSize:15,fontWeight:700}}>🔢 Estilo de avaliação</h3>
          <p style={{fontSize:12,color:"#64748b",marginBottom:20,lineHeight:1.6}}>Escolha como os colaboradores vão responder as perguntas. Em todos os modelos existe a opção <strong>"Não sei avaliar"</strong> — que nunca entra no cálculo.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {Object.values(SCALE_MODELS).map(model=>{
              const active = (cfg.scaleModel||"frequencia") === model.id;
              return(
                <div key={model.id}
                  onClick={()=>{setCfg(p=>({...p,scaleModel:model.id}));setScaleModel(model.id);setScaleLabels(model.labels);}}
                  style={{borderRadius:R.lg,border:`2px solid ${active?pc:"#e2e8f0"}`,background:active?"#eff6ff":"#fff",padding:"16px 20px",cursor:"pointer",transition:"all 0.18s",boxShadow:active?`0 0 0 3px ${pc}18`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
                    <div style={{width:36,height:36,borderRadius:10,background:active?pc:"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"background 0.18s",flexShrink:0}}>
                      {model.icon}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:active?"#1e3a8a":"#334155"}}>{model.name}</div>
                      <div style={{fontSize:12,color:"#64748b",marginTop:1}}>{model.description}</div>
                    </div>
                    <div style={{width:20,height:20,borderRadius:"50%",border:`2px solid ${active?pc:"#dbeafe"}`,background:active?pc:"#fff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.15s"}}>
                      {active&&<div style={{width:8,height:8,borderRadius:"50%",background:"#fff"}}/>}
                    </div>
                  </div>
                  {/* Preview das respostas */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>
                    {[1,2,3,4,5].map(v=>(
                      <span key={v} style={{padding:"3px 10px",borderRadius:R.full,fontSize:11,fontWeight:600,background:active?`${SC[v]}18`:"#f8faff",color:active?SC[v]:"#94a3b8",border:`1px solid ${active?SC[v]+"30":"#e2e8f0"}`}}>
                        {model.labels[v]}
                      </span>
                    ))}
                    <span style={{padding:"3px 10px",borderRadius:R.full,fontSize:11,fontWeight:600,background:"#f8faff",color:"#94a3b8",border:"1px solid #e2e8f0",fontStyle:"italic"}}>
                      {model.labels[0]}
                    </span>
                  </div>
                  <div style={{fontSize:11,color:active?"#2563eb":"#94a3b8",fontStyle:"italic"}}>{model.tip}</div>
                </div>
              );
            })}
          </div>
          <div style={{marginTop:14,padding:"10px 14px",background:"#f8faff",borderRadius:R.sm,border:"1px solid #dbeafe",fontSize:11,color:"#64748b"}}>
            ℹ️ A opção <strong>"Não sei avaliar"</strong> aparece em todos os modelos e <strong>nunca entra no cálculo</strong> da média. Ela garante que cada pessoa responda apenas o que realmente observou.
          </div>
        </div>
        <div style={{...card,marginBottom:16}}>
          <h3 style={{color:"#1e3a8a",marginBottom:4,fontSize:15}}>⚠️ Escala Sim/Não/Atenção</h3>
          <p style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Usada nos blocos de "Riscos e sinais preventivos" — onde os participantes podem expressar preocupação sobre o avaliado em alguma área específica, de forma sigilosa e construtiva.</p>
          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"10px 12px",alignItems:"center"}}>
            {[1,2,0].map(v=>(
              <>
                <div key={"n"+v} style={{width:32,height:32,borderRadius:8,background:YESNO_COLORS[v],display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}}>
                  {v===1?"S":v===2?"!":"N"}
                </div>
                <input key={"i"+v} value={yesnoLabels[v]||""} onChange={e=>setYesnoLabels(p=>({...p,[v]:e.target.value}))}
                  style={{...inp,padding:"8px 12px"}} placeholder={DEFAULT_YESNO_LABELS[v]}/>
              </>
            ))}
          </div>
          <button onClick={()=>setYesnoLabels(DEFAULT_YESNO_LABELS)} style={{marginTop:12,padding:"6px 14px",borderRadius:8,border:"2px solid #dbeafe",background:"#fff",color:"#64748b",cursor:"pointer",fontSize:12}}>
            Restaurar padrão
          </button>
        </div>
        <div style={{...card,background:"#f0fdf4",border:"1px solid #bbf7d0"}}><h3 style={{color:"#166534",marginBottom:10,fontSize:14}}>🔒 LGPD — Conformidade</h3><p style={{fontSize:12,color:"#166534",lineHeight:1.7,margin:0}}>{LGPD}</p></div>

        {/* Notificações */}
        <div style={{...card,marginTop:16}}>
          <h3 style={{color:"#1e3a8a",marginBottom:4,fontSize:15,fontWeight:700}}>🔔 Notificações</h3>
          <p style={{fontSize:12,color:"#64748b",marginBottom:16,lineHeight:1.6}}>Envie emails para os colaboradores do ciclo ativo.</p>
          {notifMsg&&<div style={{background:notifMsg.startsWith("✅")?"#f0fdf4":"#fef2f2",borderRadius:R.md,padding:"10px 14px",border:`1px solid ${notifMsg.startsWith("✅")?"#86efac":"#fecaca"}`,fontSize:13,color:notifMsg.startsWith("✅")?"#166534":"#dc2626",marginBottom:12}}>{notifMsg}</div>}
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:200,background:"#f8faff",borderRadius:12,padding:16,border:"1px solid #dbeafe"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#1e3a8a",marginBottom:4}}>📨 Convites</div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:12,lineHeight:1.5}}>Para quem ainda não iniciou as avaliações. Inclui o link de acesso e instruções.</div>
              <button onClick={async()=>{
                if(!window.confirm(`Enviar convites para os colaboradores com avaliações pendentes no ciclo ${cfg.activeCiclo||CICLOS[0]}?`))return;
                setNotifSending(true);setNotifMsg("");
                try{
                  const res=await fetch("https://avalie360.conectandogente.com/api/send-notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orgId:org.id,orgName:org.name,ciclo:cfg.activeCiclo||CICLOS[0],tipo:"convite",baseUrl:org.baseUrl||"https://avalie360.vercel.app",slug:org.slug||""})});
                  const data=await res.json();
                  if(!res.ok)throw new Error(data.error||"Erro ao enviar");
                  setNotifMsg(`✅ ${data.enviados} email(s) enviado(s)!${data.ignorados>0?` (${data.ignorados} já concluíram)`:""}`);}
                catch(e){setNotifMsg("❌ Erro: "+e.message);}
                setNotifSending(false);
              }} disabled={notifSending} style={{...btn("#2563eb"),width:"100%",opacity:notifSending?0.6:1}}>
                {notifSending?"⏳ Enviando…":"📨 Enviar convites"}
              </button>
            </div>
            <div style={{flex:1,minWidth:200,background:"#fffbeb",borderRadius:12,padding:16,border:"1px solid #fde68a"}}>
              <div style={{fontWeight:700,fontSize:13,color:"#92400e",marginBottom:4}}>⏰ Lembretes</div>
              <div style={{fontSize:12,color:"#78350f",marginBottom:12,lineHeight:1.5}}>Para quem já recebeu o convite mas ainda não concluiu. Incentiva a conclusão.</div>
              <button onClick={async()=>{
                if(!window.confirm(`Enviar lembretes para os colaboradores com avaliações pendentes no ciclo ${cfg.activeCiclo||CICLOS[0]}?`))return;
                setNotifSending(true);setNotifMsg("");
                try{
                  const res=await fetch("https://avalie360.conectandogente.com/api/send-notifications",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({orgId:org.id,orgName:org.name,ciclo:cfg.activeCiclo||CICLOS[0],tipo:"lembrete",baseUrl:org.baseUrl||"https://avalie360.vercel.app",slug:org.slug||""})});
                  const data=await res.json();
                  if(!res.ok)throw new Error(data.error||"Erro ao enviar");
                  setNotifMsg(`✅ ${data.enviados} email(s) enviado(s)!${data.ignorados>0?` (${data.ignorados} já concluíram)`:""}`);}
                catch(e){setNotifMsg("❌ Erro: "+e.message);}
                setNotifSending(false);
              }} disabled={notifSending} style={{...btn("#d97706"),width:"100%",opacity:notifSending?0.6:1}}>
                {notifSending?"⏳ Enviando…":"⏰ Enviar lembretes"}
              </button>
            </div>
          </div>
        </div>

        <button onClick={saveCfg} style={{...btn(cfg.primaryColor||"#2563eb"),width:"100%",padding:"14px 20px",fontSize:15,marginTop:16}}>💾 Salvar configurações</button>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="editor"&&org){
    const eF=forms[efi];const eB=eF?.blocos[ebi];
    const canEdit=org.planCustom||false;
    const sBtn=(active)=>({display:"block",width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:10,border:"none",background:active?`${pc}18`:"transparent",color:active?pc:"#64748b",fontWeight:active?700:400,cursor:"pointer",fontSize:13,marginBottom:3});

    // Checkout Plano Personalizado via Stripe
    async function handleUpgradeCheckout(){
      try{
        const res=await fetch("/api/create-checkout-custom",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({orgId:org.id,orgName:org.name,orgSlug:org.slug,adminEmail:org.resendFromEmail||"avalie360@conectandogente.com"})
        });
        if(!res.ok) throw new Error("Erro ao criar sessão");
        const {sessionId,url}=await res.json();
        // Se a API retornou URL direta, redirecionar diretamente
        if(url){ window.location.href=url; return; }
        // Caso contrário, carregar Stripe dinamicamente
        let stripeJs=window.Stripe;
        if(!stripeJs){
          await new Promise((resolve,reject)=>{
            const s=document.createElement("script");
            s.src="https://js.stripe.com/v3/";
            s.onload=resolve; s.onerror=reject;
            document.head.appendChild(s);
          });
          stripeJs=window.Stripe;
        }
        const stripe=stripeJs("pk_test_51TbHfIFrTWjKL1SAZrYK9dwBGGngTv6ydLQD8aPhZow20ljsxQECrlkhh8Suyh3r1ofxltOSQTe0HTCksk4GCmci00t853urnz");
        await stripe.redirectToCheckout({sessionId});
      }catch(e){console.error(e);alert("Erro ao processar. Entre em contato: avalie360@conectandogente.com");}
    }

    return(
      <div style={{minHeight:"100vh",background:"#f8f9fa",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
        {/* Modal de upgrade */}
        {showUpgradeModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
            <div style={{background:"#fff",borderRadius:20,padding:32,maxWidth:460,width:"100%",boxShadow:"0 24px 60px rgba(0,0,0,0.2)",position:"relative"}}>
              <button onClick={()=>setShowUpgradeModal(false)} style={{position:"absolute",top:16,right:16,background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#94a3b8"}}>✕</button>
              <div style={{textAlign:"center",marginBottom:24}}>
                <div style={{fontSize:40,marginBottom:12}}>✏️</div>
                <h2 style={{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:8}}>Plano Personalizado</h2>
                <p style={{fontSize:14,color:"#64748b",lineHeight:1.65}}>Edite, adicione e remova perguntas dos seus formulários. A personalização fica ativa para todos os ciclos futuros desta organização.</p>
              </div>
              <div style={{background:"#eff6ff",borderRadius:14,padding:"16px 20px",marginBottom:20,textAlign:"center"}}>
                <div style={{fontSize:36,fontWeight:800,color:"#2563eb",fontFamily:"serif"}}>R$300</div>
                <div style={{fontSize:13,color:"#64748b",marginTop:4}}>taxa única · por ciclo de avaliação</div>
              </div>
              <ul style={{listStyle:"none",marginBottom:20,display:"flex",flexDirection:"column",gap:8}}>
                {["Edição completa de todas as perguntas","Adicionar e remover blocos","Personalização mantida em ciclos futuros","Ativação automática após pagamento"].map(f=>(
                  <li key={f} style={{display:"flex",alignItems:"center",gap:8,fontSize:14,color:"#334155"}}>
                    <span style={{color:"#059669",fontWeight:700}}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {/* Campo de cupom upgrade */}
              <div style={{marginBottom:16}}>
                <button type="button" onClick={()=>setShowUpgradeCupom(p=>!p)}
                  style={{background:"none",border:"none",cursor:"pointer",fontSize:13,color:"#64748b",padding:0,display:"flex",alignItems:"center",gap:6}}>
                  {showUpgradeCupom?"－":"＋"} Tenho um cupom de desconto
                </button>
                {showUpgradeCupom&&(
                  <div style={{marginTop:8}}>
                    <div style={{display:"flex",gap:8}}>
                      <input value={upgradeCupomCode} onChange={e=>setUpgradeCupomCode(e.target.value.toUpperCase())}
                        style={{flex:1,padding:"9px 12px",borderRadius:8,border:"1.5px solid #dbeafe",fontSize:13,outline:"none"}} placeholder="Código do cupom"/>
                      <button type="button" onClick={async()=>{
                        if(!upgradeCupomCode.trim())return;
                        setUpgradeCupomMsg({type:"loading",text:"Validando…"});
                        const c=await validarCupomUpgrade(upgradeCupomCode.trim());
                        if(!c){setUpgradeCupomMsg({type:"error",text:"Cupom inválido ou expirado."});setUpgradeCupomAplicado(null);}
                        else{setUpgradeCupomAplicado(c);setUpgradeCupomMsg({type:"success",text:c.desconto_pct===100?"🎉 100% de desconto! Upgrade gratuito.":`✅ ${c.desconto_pct}% de desconto aplicado!`});}
                      }} style={{padding:"0 14px",background:"#2563eb",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:13}}>Aplicar</button>
                    </div>
                    {upgradeCupomMsg&&<p style={{fontSize:12,marginTop:6,color:upgradeCupomMsg.type==="error"?"#dc2626":upgradeCupomMsg.type==="success"?"#059669":"#64748b"}}>{upgradeCupomMsg.text}</p>}
                  </div>
                )}
              </div>
              <>
              {upgradeCupomAplicado&&upgradeCupomAplicado.desconto_pct===100?(
                <button onClick={async()=>{
                  setShowUpgradeModal(false);
                  try{
                    await sbFetch(`organizations?id=eq.${org.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({plan_custom:true})});
                    await sbFetch(`cupons?id=eq.${upgradeCupomAplicado.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({usos:(upgradeCupomAplicado.usos||0)+1})});
                    const updated={...org,planCustom:true};setOrg(updated);
                    setUpgradeCupomAplicado(null);setUpgradeCupomCode("");setUpgradeCupomMsg(null);setShowUpgradeCupom(false);
                    alert("✅ Plano Personalizado ativado gratuitamente!");
                  }catch(e){alert("Erro ao ativar. Entre em contato: avalie360@conectandogente.com");}
                }} style={{width:"100%",padding:"14px",background:"#059669",color:"white",border:"none",borderRadius:12,fontFamily:"'Segoe UI',sans-serif",fontSize:16,fontWeight:700,cursor:"pointer"}}>
                  🎉 Ativar gratuitamente →
                </button>
              ):(
                <button onClick={handleUpgradeCheckout} style={{width:"100%",padding:"14px",background:"#2563eb",color:"white",border:"none",borderRadius:12,fontFamily:"'Segoe UI',sans-serif",fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                  💳 {upgradeCupomAplicado?`Pagar R$${Math.round(300*(1-upgradeCupomAplicado.desconto_pct/100))} e personalizar →`:"Pagar R$300 e personalizar →"}
                </button>
              )}
              <p style={{textAlign:"center",fontSize:12,color:"#94a3b8",marginTop:12}}>🔒 Pagamento seguro via Stripe · PIX ou cartão</p>
              </>
            </div>
          </div>
        )}

        <div style={{...hdr(pc),position:"sticky",top:0,zIndex:20}}>
          <div>
            <div style={{fontWeight:800,fontSize:15}}>✏️ Formulários — {org.name}</div>
            <div style={{fontSize:11,opacity:0.75}}>{canEdit?"Modo edição ativo":"Visualização — perguntas protegidas"}</div>
          </div>
          <div style={{display:"flex",gap:8}}>
            {canEdit&&<button onClick={saveFormsBtn} style={{...hBtn,background:"#16a34a",fontWeight:700}}>💾 Salvar</button>}
            {!canEdit&&<button onClick={()=>setShowUpgradeModal(true)} style={{...hBtn,background:"#f59e0b",color:"#fff",fontWeight:700}}>✏️ Personalizar perguntas</button>}
            <button onClick={()=>setScreen("dash")} style={{...hBtn,border:"2px solid rgba(255,255,255,0.3)",background:"none"}}>← Voltar</button>
          </div>
        </div>

        {/* Banner informativo quando não tem plano */}
        {!canEdit&&(
          <div style={{background:"#fefce8",borderBottom:"1px solid #fde68a",padding:"12px 24px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:13,color:"#92400e",flex:1}}>🔒 Você está no modo de visualização das perguntas padrão do sistema. Para personalizá-las, elaborando suas próprias perguntas, contrate o Plano Personalizado.</span>
            <button onClick={()=>setShowUpgradeModal(true)} style={{padding:"7px 16px",borderRadius:8,border:"none",background:"#f59e0b",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13,whiteSpace:"nowrap"}}>Personalizar — R$300/ciclo</button>
          </div>
        )}

        <div style={{maxWidth:1100,margin:"0 auto",padding:"20px 16px 60px",display:"flex",gap:20}}>
          <div style={{width:240,flexShrink:0,display:"flex",flexDirection:"column",gap:12}}>
            <div style={{background:"#fff",borderRadius:16,padding:12,border:"1px solid #dbeafe"}}>
              <p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Formulários</p>
              {forms.map((f,i)=><button key={f.id} onClick={()=>{setEfi(i);setEbi(0);}} style={sBtn(efi===i)}>{f.icon} {f.title}</button>)}
            </div>
            {eF&&<div style={{background:"#fff",borderRadius:16,padding:12,border:"1px solid #dbeafe"}}>
              <p style={{fontSize:10,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Blocos</p>
              {eF.blocos.map((b,i)=><button key={b.id} onClick={()=>setEbi(i)} style={sBtn(ebi===i)}>{b.icon} {b.title}</button>)}
            </div>}
          </div>
          {eB&&<div style={{flex:1,display:"flex",flexDirection:"column",gap:16}}>
            {/* Título do bloco */}
            <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #dbeafe"}}>
              <p style={{fontSize:11,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Título do bloco</p>
              {canEdit
                ? <input value={eB.title} onChange={e=>updBT(efi,ebi,e.target.value)} style={inp}/>
                : <div style={{padding:"10px 14px",background:"#f8faff",borderRadius:8,fontSize:14,color:"#334155",border:"1px solid #e2e8f0"}}>{eB.title}</div>
              }
            </div>
            {/* Perguntas escala */}
            <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #dbeafe"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><p style={{fontSize:11,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,margin:0}}>Perguntas com escala 1–5</p><p style={{fontSize:11,color:"#94a3b8",margin:"3px 0 0"}}>{eB.perguntas.length} pergunta{eB.perguntas.length!==1?"s":""}</p></div>
                {canEdit&&<button onClick={()=>addQ(efi,ebi)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#d1fae5",color:"#065f46",cursor:"pointer",fontWeight:700,fontSize:12}}>+ Adicionar</button>}
              </div>
              {eB.perguntas.map((p,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10}}>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:700,minWidth:22,paddingTop:10}}>{i+1}.</span>
                  {canEdit
                    ? <><textarea value={p} rows={2} onChange={e=>updQ(efi,ebi,i,e.target.value)} style={{...inp,resize:"vertical",flex:1}}/>
                        <button onClick={()=>delQ(efi,ebi,i)} style={{padding:"6px 10px",borderRadius:8,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:13,marginTop:4}}>🗑️</button></>
                    : <div style={{flex:1,padding:"10px 14px",background:"#f8faff",borderRadius:8,fontSize:14,color:"#334155",border:"1px solid #e2e8f0",lineHeight:1.5}}>{p}</div>
                  }
                </div>
              ))}
            </div>
            {/* Perguntas abertas */}
            <div style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #fde68a"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <div><p style={{fontSize:11,fontWeight:700,color:"#d97706",textTransform:"uppercase",letterSpacing:1,margin:0}}>Perguntas abertas / reflexões</p><p style={{fontSize:11,color:"#94a3b8",margin:"3px 0 0"}}>{eB.abertas.length} pergunta{eB.abertas.length!==1?"s":""}</p></div>
                {canEdit&&<button onClick={()=>addAb(efi,ebi)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#d1fae5",color:"#065f46",cursor:"pointer",fontWeight:700,fontSize:12}}>+ Adicionar</button>}
              </div>
              {eB.abertas.map((a,i)=>(
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:10}}>
                  <span style={{fontSize:12,color:"#94a3b8",fontWeight:700,minWidth:22,paddingTop:10}}>{i+1}.</span>
                  {canEdit
                    ? <><textarea value={a} rows={2} onChange={e=>updAb(efi,ebi,i,e.target.value)} style={{...inp,resize:"vertical",flex:1,borderColor:"#fde68a"}}/>
                        <button onClick={()=>delAb(efi,ebi,i)} style={{padding:"6px 10px",borderRadius:8,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:13,marginTop:4}}>🗑️</button></>
                    : <div style={{flex:1,padding:"10px 14px",background:"#fffbeb",borderRadius:8,fontSize:14,color:"#334155",border:"1px solid #fde68a",lineHeight:1.5}}>{a}</div>
                  }
                </div>
              ))}
            </div>
          </div>}
        </div>
        <PoweredBy/>
      </div>
    );
  }

  if(screen==="lgpd"&&org&&fForm) return(
    <div style={{minHeight:"100vh",background:"#f0f0f0",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{height:6,background:pc,flexShrink:0}}/>
      <div style={{flex:1,padding:"32px 24px 24px",maxWidth:500,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:32}}>
          <OrgLogo org={org} size={56}/>
          <div>
            <div style={{fontSize:18,fontWeight:800,color:"#1a1a1a",lineHeight:1.2}}>{urlCustomLabel||fForm.title}</div>
            {urlAvaliadoNome&&<div style={{fontSize:13,color:pc,fontWeight:700,marginTop:4}}>👤 Avaliando: {urlAvaliadoNome}</div>}
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{org.name} · {ciclo}</div>
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:20,marginBottom:20,boxShadow:"0 2px 8px #0001"}}>
          <p style={{fontSize:12,color:"#444",lineHeight:1.8,margin:0}}>🔒 {LGPD}</p>
        </div>
        <label style={{display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",marginBottom:28,background:"#fff",borderRadius:14,padding:16,boxShadow:"0 2px 8px #0001"}}>
          <input type="checkbox" checked={lgpd} onChange={e=>setLgpd(e.target.checked)} style={{marginTop:2,width:18,height:18,cursor:"pointer",accentColor:pc}}/>
          <span style={{fontSize:13,color:"#334155",lineHeight:1.6}}>Compreendo que minhas respostas são anônimas e concordo com os termos acima.</span>
        </label>
        <div style={{display:"flex",justifyContent:"flex-end"}}>
          <button onClick={()=>{if(lgpd){setFbi(0);setAnswers({});setOpenAns({});setScreen("form");}}} disabled={!lgpd}
            style={{padding:"15px 48px",borderRadius:12,border:"none",background:pc,color:"#fff",fontSize:16,fontWeight:700,cursor:"pointer",opacity:lgpd?1:0.4,boxShadow:`0 4px 12px ${pc}33`}}>
            Iniciar →
          </button>
        </div>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="form"&&org&&fForm&&fBloc) return(
    <div style={{minHeight:"100vh",background:"#f0f0f0",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column"}}>
      <div style={{position:"sticky",top:0,zIndex:10,background:"#fff",borderBottom:"1px solid #e2e8f0",padding:"10px 16px",boxShadow:"0 2px 8px #0001"}}>
        <div style={{maxWidth:600,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <OrgLogo org={org} size={32}/>
              <div>
                <div style={{fontWeight:700,color:"#1e3a8a",fontSize:13,lineHeight:1.2}}>{urlAvaliadoNome?`Avaliando: ${urlAvaliadoNome}`:fForm.title}</div>
                {urlAvaliadoNome&&<div style={{fontSize:10,color:"#64748b"}}>{fForm.title}</div>}
              </div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:12,fontWeight:700,color:pc}}>{fbi+1}/{fForm.blocos.length}</div>
              <div style={{fontSize:10,color:"#94a3b8"}}>blocos</div>
            </div>
          </div>
          <div style={{background:"#e2e8f0",borderRadius:99,height:4}}><div style={{width:`${((fbi+1)/fForm.blocos.length)*100}%`,background:`linear-gradient(90deg,${pc},${pc}bb)`,height:4,borderRadius:99,transition:"width 0.4s ease"}}/></div>
        </div>
      </div>
      <div style={{maxWidth:600,margin:"0 auto",padding:"24px 16px 80px",flex:1,width:"100%",boxSizing:"border-box"}}>
        <div style={{marginBottom:20,paddingBottom:16,borderBottom:"2px solid #eff6ff"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:24}}>{fBloc.icon}</span>
            <h2 style={{color:"#1e3a8a",fontSize:17,margin:0,fontWeight:700}}>{fBloc.title}</h2>
          </div>
        </div>
        {fBloc.perguntas.map((p,i)=>(
          <div key={i} style={{marginBottom:10,background:"#fff",borderRadius:R.md,padding:"14px 16px",border:"1px solid #e5e7eb"}}>
            <p style={{color:"#1e293b",fontSize:14,lineHeight:1.6,marginBottom:12,fontWeight:500}}>{p}</p>
            {fBloc.scaleType==="yesno" ? (
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
                {[1,2,0].map(v=>{
                  const sel=answers[`${fBloc.id}_${i}`]===v;
                  const label=yesnoLabels[v]||DEFAULT_YESNO_LABELS[v];
                  const col=YESNO_COLORS[v];
                  return(
                    <button key={v} onClick={()=>setAnswers(r=>({...r,[`${fBloc.id}_${i}`]:v}))}
                      style={{padding:"14px 8px",borderRadius:12,border:`2px solid ${sel?col:"#e2e8f0"}`,
                        background:sel?col:"#fff",color:sel?"#fff":"#475569",
                        cursor:"pointer",fontSize:13,fontWeight:700,transition:"all 0.15s",
                        boxShadow:sel?`0 2px 8px ${col}44`:"none"}}>
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
                {[1,2,3,4,5].map(v=>{
                  const sel=answers[`${fBloc.id}_${i}`]===v;
                  const label=scaleLabels[v]||DEFAULT_SCALE_LABELS[v];
                  return(
                    <button key={v} onClick={()=>setAnswers(r=>({...r,[`${fBloc.id}_${i}`]:v}))}
                      style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
                        padding:"10px 4px",borderRadius:R.md,minHeight:68,
                        border:`2px solid ${sel?SC[v]:"#e2e8f0"}`,
                        background:sel?SC[v]:"#f8fafc",color:sel?"#fff":"#475569",
                        cursor:"pointer",fontSize:10,fontWeight:600,transition:"all 0.15s",
                        boxShadow:sel?`0 2px 8px ${SC[v]}44`:"none",
                        width:"100%",boxSizing:"border-box",lineHeight:1.2,gap:3}}>
                      <span style={{fontSize:15,fontWeight:800,lineHeight:1}}>{v}</span>
                      <span style={{textAlign:"center",lineHeight:1.25,wordBreak:"break-word",maxWidth:"100%"}}>{label}</span>
                    </button>
                  );
                })}
                {(()=>{const sel0=answers[`${fBloc.id}_${i}`]===0;const lbl0=scaleLabels[0]||DEFAULT_SCALE_LABELS[0];return(
                  <button onClick={()=>setAnswers(r=>({...r,[`${fBloc.id}_${i}`]:0}))}
                    style={{gridColumn:"1 / -1",padding:"9px 16px",borderRadius:R.md,
                      border:`1.5px dashed ${sel0?"#94a3b8":"#e2e8f0"}`,
                      background:sel0?"#f1f5f9":"transparent",color:sel0?"#475569":"#94a3b8",
                      cursor:"pointer",fontSize:12,fontWeight:sel0?600:400,transition:"all 0.15s",
                      textAlign:"center"}}>
                    {lbl0}
                  </button>
                );})()} 
              </div>
            )}
          </div>
        ))}
        {fBloc.abertas?.length>0&&(
          <div style={{background:"#f8f9fa",borderRadius:R.md,padding:16,border:"1px solid #e5e7eb",marginTop:8}}>
            <p style={{fontSize:11,fontWeight:700,color:pc,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Reflexões abertas</p>
            {fBloc.abertas.map((a,i)=>(
              <div key={i} style={{marginBottom:14}}>
                <label style={{fontSize:13,color:"#475569",fontStyle:"italic",display:"block",marginBottom:6}}>{a}</label>
                <textarea value={openAns[`${fBloc.id}_aberta_${i}`]||""} onChange={e=>setOpenAns(r=>({...r,[`${fBloc.id}_aberta_${i}`]:e.target.value}))} rows={3} placeholder="Escreva com cuidado e honestidade…" style={{width:"100%",borderRadius:10,border:"1px solid #bfdbfe",padding:"10px 12px",fontSize:13,background:"#fff",resize:"none",outline:"none",boxSizing:"border-box"}}/>
              </div>
            ))}
          </div>
        )}
        <div style={{display:"flex",gap:12,marginTop:28,paddingTop:16}}>
          <button onClick={()=>fbi===0?setScreen("lgpd"):setFbi(b=>b-1)} style={{...btnO,flex:1,borderRadius:12,padding:"13px 0"}}>← Voltar</button>
          {isLast
            ?<button onClick={submitForm} disabled={saving} style={{...btn(pc),flex:2,borderRadius:12,padding:"13px 0",opacity:saving?0.6:1,fontSize:14}}>{saving?"Salvando…":"Enviar avaliação ✓"}</button>
            :<button onClick={async()=>{
                if(usuarioLogado&&atribucaoAtual){
                  saveProgress(usuarioLogado.id,atribucaoAtual.id,org.id,fbi+1,answers,openAns).catch(()=>{});
                }
                setFbi(b=>b+1);
              }} style={{...btn(pc),flex:2,borderRadius:12,padding:"13px 0",fontSize:14}}>Próximo →</button>
          }
        </div>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="result"&&org&&fForm) return(
    <div style={{...pg,alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{maxWidth:480,width:"100%"}}>
        <div style={{...card,textAlign:"center",marginBottom:16}}>
          <div style={{width:72,height:72,borderRadius:20,background:"linear-gradient(135deg,#22c55e,#15803d)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 16px",boxShadow:"0 4px 20px #22c55e40"}}>✅</div><OrgLogo org={org} size={48}/>
          <h2 style={{color:"#1e3a8a",margin:"14px 0 8px"}}>Avaliação enviada!</h2>
          <p style={{color:"#64748b",fontSize:13,lineHeight:1.7}}>Obrigado. Sua avaliação foi registrada de forma anônima e contribuirá para o desenvolvimento de {org.name}.</p>
          <div style={{background:"#f0fdf4",borderRadius:10,padding:12,marginTop:16,fontSize:12,color:"#166534"}}>Em conformidade com a LGPD</div>
          <div style={{marginTop:24,textAlign:"left"}}>
            <p style={{fontSize:11,fontWeight:700,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Sua pontuação por área</p>
            {fForm.blocos.map(b=><ScBar key={b.id} label={b.title} score={bAvg(b,answers)}/>)}
          </div>
        </div>
      </div>
      <PoweredBy/>
    </div>
  );

  // ── LINKS EDITOR ──
  if(screen==="links_editor"&&org){
    function addCustomLink(formId){
      const f=forms.find(x=>x.id===formId);
      const updated=[...customLinks,{id:genId(8),formId,label:f?`${f.title} — novo link`:"Novo link"}];
      saveLinks(updated);
    }
    function updateLinkLabel(id,label){
      saveLinks(customLinks.map(l=>l.id===id?{...l,label}:l));
    }
    function removeCustomLink(id){
      saveLinks(customLinks.filter(l=>l.id!==id));
    }
    return(
      <div style={{minHeight:"100vh",background:"#f8f9fa",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
        <div style={{...hdr(pc),position:"sticky",top:0,zIndex:20}}>
          <div>
            <div style={{fontWeight:800,fontSize:15}}>🔗 Editor de Links — {org.name}</div>
            <div style={{fontSize:11,opacity:0.75}}>Crie títulos personalizados para cada formulário</div>
          </div>
          <button onClick={()=>setScreen("dash")} style={{...hBtn,border:"2px solid rgba(255,255,255,0.3)",background:"none"}}>← Links</button>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"24px 16px 60px"}}>

          {!org.baseUrl&&(
            <div style={{background:"#fefce8",borderRadius:12,padding:"12px 16px",border:"1px solid #fde68a",marginBottom:20,fontSize:12,color:"#92400e",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
              ⚠️ Configure a <strong>URL do app</strong> nas ⚙️ Configurações para que os links funcionem corretamente após o deploy.
            </div>

            )}

          <div style={{background:"#eff6ff",borderRadius:12,padding:"12px 16px",border:"1px solid #bfdbfe",marginBottom:24,fontSize:12,color:"#1e40af"}}>
            💡 Cada formulário pode ter <strong>vários links com títulos diferentes</strong>. Por exemplo, "Avaliação pelos Liderados" pode virar "Avalie seu Líder de Equipe" ou "Avalie a Diretoria" — cada um com seu link próprio.
          </div>

          {forms.map(f=>{
            const fLinks=customLinks.filter(l=>l.formId===f.id);
            const base=getBaseUrl();
            const cs=encodeURIComponent((org?.activeCiclo||CICLOS[0]).replace(/ /g,"-"));
            const defaultLink=`${base}#/fill/${org?.id}/${cs}/${f.id}`;
            return(
              <div key={f.id} style={{background:"#fff",borderRadius:16,padding:20,border:"1px solid #dbeafe",marginBottom:16}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                  <div style={{fontWeight:700,color:"#1e3a8a",fontSize:14}}>{f.icon} {f.title}</div>
                  <button onClick={()=>addCustomLink(f.id)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#d1fae5",color:"#065f46",cursor:"pointer",fontWeight:700,fontSize:12}}>+ Adicionar link</button>
                </div>

                {/* Default link (always shown, not editable title) */}
                <div style={{background:"#f8faff",borderRadius:10,padding:"10px 14px",border:"1px solid #e2e8f0",marginBottom:fLinks.length>0?10:0}}>
                  <div style={{fontSize:11,color:"#94a3b8",marginBottom:4}}>Link padrão (título do formulário)</div>
                  <div style={{fontSize:12,fontWeight:600,color:pc,marginBottom:6}}>{f.icon} {f.title}</div>
                  <div style={{fontSize:10,color:"#94a3b8",fontFamily:"monospace",wordBreak:"break-all"}}>{defaultLink}</div>
                </div>

                {/* Custom links */}
                {fLinks.map(l=>(
                  <div key={l.id} style={{background:"#f0fdf4",borderRadius:10,padding:"12px 14px",border:"1px solid #bbf7d0",marginBottom:8}}>
                    <div style={{fontSize:11,fontWeight:700,color:"#64748b",marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>Título personalizado</div>
                    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                      <input value={l.label} onChange={e=>updateLinkLabel(l.id,e.target.value)}
                        style={{...inp,flex:1,background:"#fff",borderColor:"#86efac"}}
                        placeholder="Ex: Avalie seu Líder de Equipe"/>
                      <button onClick={()=>removeCustomLink(l.id)} style={{padding:"8px 10px",borderRadius:8,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:13,flexShrink:0}}>🗑️</button>
                    </div>
                    <div style={{fontSize:10,color:"#94a3b8",fontFamily:"monospace",wordBreak:"break-all"}}>{defaultLink}</div>
                    <div style={{fontSize:11,color:"#16a34a",marginTop:4}}>✓ Este link aparecerá como: <strong>"{l.label}"</strong></div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── AVALIADOS SCREEN ──
  if(screen==="avaliados"&&org){
    async function addAvaliado(){
      if(!newAvaliado.nome.trim()) return;
      const avSlug=slugify(newAvaliado.nome).slice(0,30)||genId(8);
      const av={id:avSlug,org_id:org.id,nome:san(newAvaliado.nome),funcao:san(newAvaliado.funcao),ativo:true,created_at:new Date().toISOString()};
      await saveAvaliado(av);
      setAvaliados(p=>[...p,av]);
      setNewAvaliado({nome:"",funcao:""});
    }
    async function removeAvaliado(id){
      if(!confirm("Remover este avaliado?")) return;
      await deleteAvaliado(id);
      setAvaliados(p=>p.filter(a=>a.id!==id));
    }
    return(
      <div style={{minHeight:"100vh",background:"#f8f9fa",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
        <div style={{...hdr(pc),position:"sticky",top:0,zIndex:20}}>
          <div><div style={{fontWeight:800,fontSize:15}}>👥 Avaliados — {org.name}</div><div style={{fontSize:11,opacity:0.75}}>Cadastre as pessoas que serão avaliadas</div></div>
          <button onClick={()=>setScreen("dash")} style={{...hBtn,border:"2px solid rgba(255,255,255,0.3)",background:"none"}}>← Voltar</button>
        </div>
        <div style={{maxWidth:700,margin:"0 auto",padding:"24px 16px 60px"}}>
          <div style={{background:"#eff6ff",borderRadius:12,padding:"12px 16px",border:"1px solid #bfdbfe",marginBottom:20,fontSize:12,color:"#1e40af"}}>
            💡 Cadastre aqui as pessoas que serão avaliadas. O sistema vai gerar um link individual para cada uma delas em cada formulário.
          </div>
          {/* Add new */}
          <div style={{...card,marginBottom:20}}>
            <h3 style={{color:"#1e3a8a",fontSize:15,marginBottom:16}}>➕ Adicionar avaliado</h3>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOME *</label>
                <input value={newAvaliado.nome} onChange={e=>setNewAvaliado(p=>({...p,nome:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&addAvaliado()}
                  style={inp} placeholder="Ex: Cassiano Luz"/>
              </div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>FUNÇÃO</label>
                <input value={newAvaliado.funcao} onChange={e=>setNewAvaliado(p=>({...p,funcao:e.target.value}))}
                  onKeyDown={e=>e.key==="Enter"&&addAvaliado()}
                  style={inp} placeholder="Ex: Diretor Executivo"/>
              </div>
            </div>
            <button onClick={addAvaliado} style={{...btn("#8b5cf6")}}>➕ Adicionar</button>
          </div>
          {/* List */}
          <div style={{...card}}>
            <h3 style={{color:"#1e3a8a",fontSize:15,marginBottom:16}}>📋 Avaliados cadastrados ({avaliados.length})</h3>
            {avaliados.length===0?(
              <p style={{color:"#94a3b8",textAlign:"center",padding:"24px 0",fontSize:13}}>Nenhum avaliado cadastrado ainda.</p>
            ):(
              avaliados.map(av=>(
                <div key={av.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid #f1f5f9"}}>
                  <div style={{width:40,height:40,borderRadius:10,background:pc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>
                    {av.nome.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:"#1e3a8a",fontSize:14}}>{av.nome}</div>
                    {av.funcao&&<div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{av.funcao}</div>}
                  </div>
                  <button onClick={()=>removeAvaliado(av.id)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:12,fontWeight:600}}>Remover</button>
                </div>
              ))
            )}
          </div>
        </div>
        <PoweredBy/>
      </div>
    );
  }

  // ── USER LOGIN ──
  if(screen==="user_login"&&org) return(
    <div style={{minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#f8f9fa",padding:24}}>
      <div style={{width:"100%",maxWidth:400}}>
        {/* Logo + org name */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <OrgLogo org={org} size={56}/>
          <h1 style={{fontSize:20,fontWeight:700,color:"#111827",margin:"14px 0 4px"}}>{org.name}</h1>
          <p style={{fontSize:13,color:"#6b7280",margin:0}}>Avaliação 360°</p>
        </div>
        {/* Card */}
        <div style={{background:"#fff",borderRadius:R.lg,padding:"28px 28px 24px",border:"1px solid #e5e7eb",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Email</label>
            <input type="email" placeholder="seu@email.com" value={loginEmail}
              onChange={e=>setLoginEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleUserLogin()}
              style={{width:"100%",padding:"10px 14px",borderRadius:R.md,border:`1.5px solid ${loginErr?"#ef4444":"#d1d5db"}`,fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff",color:"#111827"}}/>
          </div>
          <div style={{marginBottom:loginErr?8:20,position:"relative"}}>
            <label style={{fontSize:12,fontWeight:600,color:"#374151",display:"block",marginBottom:6}}>Senha</label>
            <input type={showPwd?"text":"password"} placeholder="••••••••" value={loginSenha}
              onChange={e=>setLoginSenha(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleUserLogin()}
              style={{width:"100%",padding:"10px 44px 10px 14px",borderRadius:R.md,border:`1.5px solid ${loginErr?"#ef4444":"#d1d5db"}`,fontSize:14,outline:"none",boxSizing:"border-box",background:"#fff",color:"#111827"}}/>
            <button onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:12,bottom:10,background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#9ca3af",padding:2}}>{showPwd?"🙈":"👁️"}</button>
          </div>
          {loginErr&&<p style={{color:"#ef4444",fontSize:12,marginBottom:16,marginTop:-8}}>{loginErr}</p>}
          {forgotMode?(
            <div style={{background:"#f0f9ff",borderRadius:R.sm,padding:"12px 16px",marginBottom:16,border:"1px solid #bae6fd"}}>
              <p style={{fontSize:13,color:"#0369a1",fontWeight:600,marginBottom:6}}>Esqueci minha senha</p>
              <p style={{fontSize:12,color:"#0c4a6e",lineHeight:1.7,marginBottom:10}}>Entre em contato com o administrador. Ele pode redefinir sua senha em <strong>Usuários</strong>.</p>
              <button onClick={()=>setForgotMode(false)} style={{fontSize:12,color:"#0369a1",background:"none",border:"none",cursor:"pointer",fontWeight:600,padding:0}}>← Voltar</button>
            </div>
          ):(
            <>
              <button onClick={handleUserLogin}
                style={{width:"100%",padding:"11px 0",borderRadius:R.md,border:"none",background:org.primaryColor||"#2563eb",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",marginBottom:12}}>
                Entrar
              </button>
              <button onClick={()=>setForgotMode(true)}
                style={{background:"none",border:"none",color:"#6b7280",fontSize:12,cursor:"pointer",padding:0,display:"block",width:"100%",textAlign:"center"}}>
                Esqueci minha senha
              </button>
            </>
          )}
        </div>
        <p style={{fontSize:11,color:"#9ca3af",marginTop:16,lineHeight:1.6,textAlign:"center"}}>🔒 Suas respostas são anônimas e protegidas pela LGPD.</p>
      </div>
      <PoweredBy/>
    </div>
  );

  if(screen==="user_dash"&&org&&usuarioLogado){
    const concluidas=atribuicoes.filter(a=>a.concluida).length;
    const total=atribuicoes.length;
    const pct=total>0?Math.round((concluidas/total)*100):0;
    return(
    <div style={{minHeight:"100vh",fontFamily:"'Segoe UI',system-ui,sans-serif",background:"#f8f9fa",display:"flex",flexDirection:"column"}}>
      {/* Header slim */}
      <div style={{background:org.primaryColor||"#2563eb",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52,borderBottom:"1px solid rgba(0,0,0,0.08)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <OrgLogo org={org} size={28}/>
          <span style={{fontWeight:600,fontSize:14,color:"#fff",opacity:0.95}}>{org.name}</span>
        </div>
        <button onClick={()=>{setUsuarioLogado(null);setAtribuicoes([]);setScreen("user_login");}}
          style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",color:"#fff",borderRadius:R.sm,padding:"5px 14px",cursor:"pointer",fontSize:12,fontWeight:500}}>
          Sair
        </button>
      </div>
      <div style={{maxWidth:560,margin:"0 auto",padding:"28px 16px 40px",width:"100%",flex:1}}>
        {/* Greeting */}
        <div style={{marginBottom:24}}>
          <h2 style={{fontSize:20,fontWeight:700,color:"#111827",margin:"0 0 4px"}}>Olá, {usuarioLogado.nome.split(" ")[0]} 👋</h2>
          <p style={{fontSize:13,color:"#6b7280",margin:0}}>Ciclo: {org.activeCiclo||CICLOS[0]}</p>
        </div>
        {/* Progress bar */}
        {total>0&&(
          <div style={{background:"#fff",borderRadius:R.md,padding:"14px 18px",border:"1px solid #e5e7eb",marginBottom:20}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:13,color:"#374151",fontWeight:500}}>Progresso do ciclo</span>
              <span style={{fontSize:13,fontWeight:600,color:org.primaryColor||"#2563eb"}}>{concluidas} de {total}</span>
            </div>
            <div style={{background:"#f3f4f6",borderRadius:R.full,height:6}}>
              <div style={{width:`${pct}%`,height:6,borderRadius:R.full,background:org.primaryColor||"#2563eb",transition:"width 0.5s ease"}}/>
            </div>
          </div>
        )}
        {/* Password warning */}
        {usuarioLogado.senha_hash===simpleHash("avalie360")&&!showTrocaSenha&&(
          <div style={{background:"#fffbeb",borderRadius:R.md,padding:"12px 16px",border:"1px solid #fde68a",marginBottom:16,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:13,color:"#92400e",flex:1}}>🔑 Você está usando a senha padrão. Recomendamos alterar.</span>
            <button onClick={()=>setShowTrocaSenha(true)} style={{padding:"5px 12px",borderRadius:R.sm,border:"none",background:"#d97706",color:"#fff",cursor:"pointer",fontSize:12,fontWeight:600,whiteSpace:"nowrap"}}>Alterar</button>
          </div>
        )}
        {/* Change password form */}
        {showTrocaSenha&&(
          <div style={{background:"#fff",borderRadius:R.lg,padding:20,border:"1px solid #e5e7eb",marginBottom:20}}>
            <h3 style={{fontSize:14,fontWeight:600,color:"#111827",marginBottom:14}}>Alterar senha</h3>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <input type="password" placeholder="Nova senha (mín. 6 caracteres)" value={novaSenha} onChange={e=>setNovaSenha(e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:R.md,border:"1.5px solid #d1d5db",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              <input type="password" placeholder="Confirmar nova senha" value={confirmaSenha} onChange={e=>setConfirmaSenha(e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:R.md,border:"1.5px solid #d1d5db",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              {trocaSenhaMsg&&<p style={{fontSize:12,color:trocaSenhaMsg.includes("sucesso")?"#16a34a":"#ef4444",margin:0}}>{trocaSenhaMsg}</p>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{
                  if(novaSenha.length<6){setTrocaSenhaMsg("Mínimo 6 caracteres.");return;}
                  if(novaSenha!==confirmaSenha){setTrocaSenhaMsg("Senhas não coincidem.");return;}
                  const ok=await updateUsuarioSenha(usuarioLogado.id,novaSenha);
                  if(ok){setUsuarioLogado(p=>({...p,senha_hash:simpleHash(novaSenha)}));setTrocaSenhaMsg("✓ Senha alterada!");setNovaSenha("");setConfirmaSenha("");setTimeout(()=>{setShowTrocaSenha(false);setTrocaSenhaMsg("");},2000);}
                  else setTrocaSenhaMsg("Erro ao alterar.");
                }} style={{padding:"9px 16px",borderRadius:R.md,border:"none",background:org.primaryColor||"#2563eb",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:13,flex:2}}>Salvar</button>
                <button onClick={()=>{setShowTrocaSenha(false);setNovaSenha("");setConfirmaSenha("");setTrocaSenhaMsg("");}}
                  style={{padding:"9px 16px",borderRadius:R.md,border:"1.5px solid #d1d5db",background:"#fff",color:"#374151",cursor:"pointer",fontSize:13,flex:1}}>Cancelar</button>
              </div>
            </div>
          </div>
        )}
        {/* Evaluations list */}
        <h3 style={{fontSize:14,fontWeight:600,color:"#374151",marginBottom:12}}>Suas avaliações</h3>
        {atribuicoes.length===0?(
          <div style={{background:"#fff",borderRadius:R.lg,padding:"36px 24px",border:"1px solid #e5e7eb",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:10}}>📋</div>
            <p style={{color:"#374151",fontSize:14,fontWeight:500,margin:"0 0 4px"}}>Nenhuma avaliação atribuída</p>
            <p style={{color:"#9ca3af",fontSize:12,margin:0}}>Aguarde o administrador configurar.</p>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {atribuicoes.map(at=>{
              const formDef=forms.find(f=>f.id===at.form_id);
              if(!formDef) return null;
              return(
                <div key={at.id} style={{background:"#fff",borderRadius:R.md,padding:"14px 18px",display:"flex",alignItems:"center",gap:12,
                  border:`1px solid ${at.concluida?"#d1fae5":"#e5e7eb"}`,
                  opacity:at.concluida?0.65:1}}>
                  <span style={{fontSize:20,flexShrink:0}}>{formDef.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:600,color:"#111827",fontSize:13,lineHeight:1.4}}>
                      {at.avaliado_nome?`Avalie ${at.avaliado_nome}`:formDef.title}
                    </div>
                    {at.avaliado_nome&&<div style={{fontSize:11,color:"#9ca3af",marginTop:1}}>{formDef.title}{at.avaliado_funcao?` · ${at.avaliado_funcao}`:""}</div>}
                    {at.concluida&&<div style={{fontSize:11,color:"#16a34a",marginTop:2,fontWeight:500}}>✓ Concluída</div>}
                  </div>
                  {!at.concluida&&(
                    <button onClick={async()=>{
                      const idx=forms.findIndex(f=>f.id===at.form_id);
                      setFfi(idx);setUrlAvaliadoNome(at.avaliado_nome||"");setUrlAvaliadoId(at.avaliado_id||"");
                      setAtribucaoAtual(at);setLgpd(false);
                      const prog=usuarioLogado?await loadProgress(usuarioLogado.id,at.id):null;
                      if(prog){setFbi(prog.bloco_atual||0);setAnswers(prog.answers||{});setOpenAns(prog.open_answers||{});}
                      else{setFbi(0);setAnswers({});setOpenAns({});}
                      setScreen(prog?"form":"lgpd");
                    }} style={{padding:"8px 16px",borderRadius:R.md,border:"none",background:org.primaryColor||"#2563eb",color:"#fff",cursor:"pointer",fontWeight:600,fontSize:12,flexShrink:0,whiteSpace:"nowrap"}}>
                      Responder
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div style={{marginTop:20,padding:"10px 14px",background:"#f0fdf4",borderRadius:R.sm,border:"1px solid #bbf7d0",fontSize:11,color:"#166534"}}>
          🔒 Suas respostas são anônimas. Administradores veem apenas resultados agregados. LGPD conforme.
        </div>
      </div>
      <PoweredBy/>
    </div>
  );}

  // ── USUARIOS MANAGEMENT ──
  // ── TELA DE FUNÇÕES/CARGOS ───────────────────────────────────────
  if(screen==="equipe"&&org){
    const pc2=org.primaryColor||"#2563eb";

    async function gerarAtribuicoes(){
      const cicloAtivo=org.activeCiclo||CICLOS[0];
      // Recarregar dados frescos do banco
      const [usuariosAtuais, funcoesAtuais] = await Promise.all([
        loadUsuarios(org.id),
        loadFuncoes(org.id),
      ]);
      setUsuarios(usuariosAtuais);
      setFuncoes(funcoesAtuais);

      // Diagnóstico detalhado
      const participantes=usuariosAtuais.filter(u=>u.participa_ciclo!==false);
      const semFuncao=participantes.filter(u=>!u.funcao_id);
      if(usuariosAtuais.length===0){alert("Nenhum colaborador cadastrado. Cadastre os colaboradores antes de gerar atribuições.");return;}
      if(funcoesAtuais.length===0){alert("Nenhuma função cadastrada. Cadastre as funções antes de gerar atribuições.");return;}
      if(participantes.length===0){alert("Nenhum colaborador marcado para participar do ciclo.");return;}
      if(semFuncao.length>0){
        const nomes=semFuncao.map(u=>u.nome).join(", ");
        if(!window.confirm(`${semFuncao.length} colaborador(es) sem função definida serão ignorados: ${nomes}.\n\nDeseja continuar?`))return;
      }

      const ats2=await loadAtribuicoesOrg(org.id,cicloAtivo);
      const atsForms=ats2.filter(a=>a.ciclo===cicloAtivo);
      if(atsForms.length>0&&!window.confirm(`Já existem ${atsForms.length} atribuições para o ciclo ${cicloAtivo}. Deseja gerar novas? As existentes NÃO serão removidas.`)) return;

      const novas=await gerarAtribuicoesAutomaticas(org.id,usuariosAtuais,funcoesAtuais,cicloAtivo,forms);
      if(novas.length===0){
        alert("Nenhuma atribuição gerada. Verifique:\n• Os colaboradores têm funções definidas?\n• As funções têm relações de liderança configuradas?");
        return;
      }
      let salvas=0;
      for(const at of novas){const ok=await saveAtribuicao(at);if(ok)salvas++;}
      alert(`✅ ${salvas} atribuições geradas para o ciclo ${cicloAtivo}!`);
    }

    return(
      <div style={{...pg,padding:0,background:"#f8f9fa"}}>
        {/* Header */}
        <div style={{...hdr(pc2),position:"sticky",top:0,zIndex:20}}>
          <div><div style={{fontWeight:800,fontSize:15}}>👥 Equipe — {org.name}</div><div style={{fontSize:11,opacity:0.75}}>Configure funções e colaboradores em sequência</div></div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={gerarAtribuicoes} style={{...hBtn,background:"#059669",fontWeight:700}}>⚡ Gerar atribuições automáticas</button>
            <button onClick={()=>{setImportPreview(null);setImportDuplicatas([]);setImportDecisoes({});setImportFinalResult(null);setScreen("importar_usuarios");}} style={{...hBtn,background:"#16a34a",fontWeight:700}}>📥 Importar Excel</button>
            <button onClick={()=>setScreen("dash")} style={{...hBtn,border:"2px solid rgba(255,255,255,0.3)",background:"none"}}>← Voltar</button>
          </div>
        </div>

        <div style={{maxWidth:960,margin:"0 auto",padding:"24px 16px 60px"}}>

          {/* ── PASSO 1: FUNÇÕES ── */}
          <div style={{...card,marginBottom:24,border:"2px solid #dbeafe"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:32,height:32,borderRadius:10,background:pc2,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,flexShrink:0}}>1</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15,color:"#1e3a8a"}}>Crie as funções da organização</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Ex: Pastor, Coordenador, Voluntário. Defina quem avalia quem antes de cadastrar usuários.</div>
              </div>
              <button onClick={()=>setShowHelpFuncoes(p=>!p)} style={{background:"#eff6ff",border:"1px solid #dbeafe",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontWeight:700,color:"#2563eb",fontSize:14,flexShrink:0}}>?</button>
            </div>
            {showHelpFuncoes&&(
              <div style={{background:"#eff6ff",borderRadius:10,padding:"12px 16px",border:"1px solid #bfdbfe",marginBottom:16,fontSize:13,color:"#1e40af",lineHeight:1.7}}>
                <strong>Como funciona:</strong> Para cada função, marque quais outras ela avalia (seus liderados). Depois cadastre os usuários com suas funções e clique em ⚡ Gerar atribuições.
              </div>
            )}
            <div style={{background:"#dbeafe",borderRadius:10,padding:"10px 14px",border:"1px solid #bfdbfe",marginBottom:16,fontSize:12,color:"#1e40af",lineHeight:1.6}}>
              💡 <strong>Autoavaliação</strong> (cada pessoa avalia a si mesma) e <strong>Avaliação de Pares</strong> (pessoas da mesma função se avaliam entre si) são criadas automaticamente e não precisam ser configuradas.
            </div>
            {/* Cadastrar nova função */}
            <div style={{display:"flex",gap:12,marginBottom:16}}>
              <input value={newFuncao} onChange={e=>setNewFuncao(e.target.value)} onKeyDown={async e=>{if(e.key==="Enter"&&newFuncao.trim()){const f={id:genId(10),org_id:org.id,nome:newFuncao.trim(),avalia:[],avaliada_por:[],created_at:new Date().toISOString()};const ok=await saveFuncao(f);if(ok){setFuncoes(p=>[...p,f]);setNewFuncao("");}}}} style={{...inp,flex:1}} placeholder="Nome da função (ex: Pastor, Coordenador, Voluntário)"/>
              <button onClick={async()=>{
                if(!newFuncao.trim()) return;
                const f={id:genId(10),org_id:org.id,nome:newFuncao.trim(),avalia:[],avaliada_por:[],created_at:new Date().toISOString()};
                const ok=await saveFuncao(f);
                if(ok){setFuncoes(p=>[...p,f]);setNewFuncao("");}
              }} style={{...btn(pc2),whiteSpace:"nowrap"}}>+ Adicionar</button>
            </div>
            {/* Lista de funções */}
            {funcoes.length===0?(
              <div style={{textAlign:"center",padding:"24px 0",color:"#94a3b8",fontSize:13}}>Nenhuma função cadastrada ainda. Adicione acima para começar.</div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {funcoes.map(f=>(
                  <div key={f.id} style={{background:"#f8faff",borderRadius:12,border:"1px solid #dbeafe",padding:"14px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#1e3a8a"}}>{f.nome}</div>
                      <button onClick={async()=>{if(!window.confirm(`Remover "${f.nome}"?`))return;await deleteFuncao(f.id);setFuncoes(p=>p.filter(x=>x.id!==f.id));}} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",color:"#dc2626",fontSize:11,fontWeight:600}}>Remover</button>
                    </div>
                    {funcoes.length>1&&(
                      <div>
                        <p style={{fontSize:11,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Avalia:</p>
                        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                          {funcoes.filter(x=>x.id!==f.id).map(x=>{
                            const checked=(f.avalia||[]).includes(x.id);
                            return(<label key={x.id} style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer",fontSize:13,color:"#334155",background:checked?"#eff6ff":"#f8faff",border:`1px solid ${checked?"#bfdbfe":"#e2e8f0"}`,borderRadius:8,padding:"5px 10px"}}>
                              <input type="checkbox" checked={checked} onChange={async()=>{
                                const nl=checked?(f.avalia||[]).filter(id=>id!==x.id):[...(f.avalia||[]),x.id];
                                // Deriva avaliada_por automaticamente
                                const avaliada_por_atual=f.avaliada_por||[];
                                await updateFuncaoRelacoes(f.id,nl,avaliada_por_atual);
                                setFuncoes(p=>p.map(fn=>{
                                  if(fn.id===f.id) return{...fn,avalia:nl};
                                  // Atualiza avaliada_por da função alvo automaticamente
                                  if(fn.id===x.id){
                                    const ap=fn.avaliada_por||[];
                                    const novoAp=checked?ap.filter(id=>id!==f.id):[...ap,f.id];
                                    updateFuncaoRelacoes(fn.id,fn.avalia||[],novoAp);
                                    return{...fn,avaliada_por:novoAp};
                                  }
                                  return fn;
                                }));
                              }} style={{width:14,height:14}}/>{x.nome}
                            </label>);
                          })}
                        </div>
                      </div>
                    )}
                    {funcoes.length===1&&<p style={{fontSize:12,color:"#94a3b8"}}>Adicione mais funções para definir as relações de avaliação.</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PASSO 2: USUÁRIOS ── */}
          <div style={{...card,border:"2px solid #d1fae5"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
              <div style={{width:32,height:32,borderRadius:10,background:"#059669",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:16,flexShrink:0}}>2</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:15,color:"#1e3a8a"}}>Cadastre os colaboradores</div>
                <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Atribua uma função a cada pessoa. Depois clique em "⚡ Gerar atribuições automáticas".</div>
              </div>
              <button onClick={()=>setShowHelpUsuarios(p=>!p)} style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontWeight:700,color:"#059669",fontSize:14,flexShrink:0}}>?</button>
            </div>
            {showHelpUsuarios&&(
              <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 16px",border:"1px solid #bbf7d0",marginBottom:16,fontSize:13,color:"#065f46",lineHeight:1.7}}>
                Cada colaborador precisa de um login para acessar o sistema. O email é o identificador único. Use uma senha padrão simples — cada pessoa pode alterá-la após o primeiro acesso. Você também pode importar em massa via <strong>"📥 Importar CSV"</strong>.
              </div>
            )}
            {/* Info de acesso */}
            <div style={{background:"#eff6ff",borderRadius:10,padding:"10px 14px",border:"1px solid #bfdbfe",marginBottom:16,fontSize:12,color:"#1e40af"}}>
              🔗 Link de acesso dos colaboradores: <strong>{(org.baseUrl||"avalie360.vercel.app")}/{org.slug||"(configure o slug em ⚙️ Config)"}/login</strong>
            </div>
            {/* Form novo usuário */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12,marginBottom:12}}>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>NOME *</label>
                <input autoComplete="off" value={newUsuario.nome} onChange={e=>setNewUsuario(p=>({...p,nome:e.target.value}))} style={inp} placeholder="Nome completo"/></div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>EMAIL *</label>
                <input autoComplete="off" type="text" inputMode="email" value={newUsuario.email} onChange={e=>setNewUsuario(p=>({...p,email:e.target.value}))} style={inp} placeholder="email@org.com"/></div>
              <div>
                <label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>
                  SENHA INICIAL
                  <span title="A senha padrão 'avalie360' já vem preenchida. O colaborador verá um aviso para alterá-la no primeiro acesso." style={{marginLeft:6,cursor:"help",display:"inline-flex",alignItems:"center",justifyContent:"center",width:15,height:15,borderRadius:"50%",background:"#94a3b8",color:"#fff",fontSize:9,fontWeight:700,verticalAlign:"middle"}}>?</span>
                </label>
                <div style={{position:"relative"}}>
                  <input autoComplete="new-password" type={showPwd?"text":"password"} value={newUsuario.senha} onChange={e=>setNewUsuario(p=>({...p,senha:e.target.value}))} style={{...inp,paddingRight:44}} placeholder="avalie360"/>
                  <button onClick={()=>setShowPwd(p=>!p)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:16,color:"#94a3b8"}}>{showPwd?"🙈":"👁️"}</button>
                </div>
              </div>
              <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4}}>FUNÇÃO</label>
                <select value={newUsuario.funcao_id||""} onChange={e=>setNewUsuario(p=>({...p,funcao_id:e.target.value}))} style={inp}>
                  <option value="">Sem função</option>
                  {funcoes.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
                </select></div>
            </div>
            <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#92400e",marginBottom:12}}>
              🔑 A senha padrão é <strong>"avalie360"</strong>. O colaborador verá um aviso para alterá-la no primeiro acesso.
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button onClick={async()=>{
                if(!newUsuario.nome.trim()||!newUsuario.email.trim()||!newUsuario.senha.trim()){alert("Preencha nome, email e senha.");return;}
                const nomeExiste=usuarios.some(u=>u.nome.trim().toLowerCase()===newUsuario.nome.trim().toLowerCase());
                if(nomeExiste&&!window.confirm(`Já existe um colaborador chamado "${newUsuario.nome.trim()}". Deseja cadastrar mesmo assim?`))return;
                const emailExiste=usuarios.some(u=>u.email.trim().toLowerCase()===newUsuario.email.trim().toLowerCase());
                if(emailExiste){alert("❌ Este email já está cadastrado nesta organização. Use um email diferente.");return;}
                const u={id:genId(10),org_id:org.id,nome:san(newUsuario.nome),email:newUsuario.email.toLowerCase().trim(),senha_hash:simpleHash(newUsuario.senha),funcao_id:newUsuario.funcao_id||null,ativo:true,created_at:new Date().toISOString()};
                const ok=await saveUsuario(u);
                if(ok){
                  setUsuarios(p=>[...p,u]);
                  setNewUsuario({nome:"",email:"",senha:"avalie360",funcao_id:""});
                }
              }} style={{...btn("#0891b2")}}>➕ Adicionar colaborador</button>
              <button onClick={()=>{setImportPreview(null);setImportDuplicatas([]);setImportDecisoes({});setImportFinalResult(null);setScreen("importar_usuarios");}} style={{...btn("#16a34a")}}>📥 Importar CSV</button>
            </div>

            {/* Lista de usuários */}
            {usuarios.length>0&&(
              <div style={{marginTop:20}}>
                <div style={{fontSize:12,fontWeight:700,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:10}}>Colaboradores cadastrados ({usuarios.length})</div>
                {usuarios.map(u=>(
                  <div key={u.id}>
                    <div style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #f1f5f9",flexWrap:"wrap"}}>
                      <div style={{width:34,height:34,borderRadius:10,background:pc2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#fff",flexShrink:0}}>{u.nome.slice(0,2).toUpperCase()}</div>
                      <div style={{flex:1,minWidth:120}}>
                        <div style={{fontWeight:700,color:"#1e3a8a",fontSize:13}}>{u.nome}</div>
                        <div style={{fontSize:11,color:"#94a3b8"}}>{u.email}{u.funcao_id?` · ${funcoes.find(f=>f.id===u.funcao_id)?.nome||""}`:""}</div>
                      </div>
                      <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer",fontSize:11,color:u.participa_ciclo!==false?"#059669":"#94a3b8",fontWeight:600,flexShrink:0}} title="Participar do ciclo de avaliação">
                        <input type="checkbox" checked={u.participa_ciclo!==false} onChange={async()=>{
                          const novo=u.participa_ciclo===false;
                          await sbFetch(`usuarios?id=eq.${u.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify({participa_ciclo:novo})});
                          setUsuarios(p=>p.map(x=>x.id===u.id?{...x,participa_ciclo:novo}:x));
                        }} style={{cursor:"pointer"}}/>
                        {u.participa_ciclo!==false?"No ciclo":"Fora do ciclo"}
                      </label>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                        <button onClick={()=>setEditingUsuario({id:u.id,nome:u.nome,email:u.email,novaSenha:"",funcao_id:u.funcao_id||""})}
                          style={{padding:"4px 9px",borderRadius:7,border:"2px solid #6366f1",background:"#eef2ff",color:"#4f46e5",cursor:"pointer",fontSize:11,fontWeight:600}}>✏️ Editar</button>
                        <button onClick={()=>setShowAtribuicoes(showAtribuicoes===u.id?null:u.id)}
                          style={{padding:"4px 9px",borderRadius:7,border:`2px solid ${pc2}`,background:showAtribuicoes===u.id?"#eff6ff":"#fff",color:pc2,cursor:"pointer",fontSize:11,fontWeight:700}} title="Ver e gerenciar atribuições individuais deste colaborador">⚙️ Atribuições</button>
                        <button onClick={async()=>{if(!confirm("Remover usuário?"))return;await deleteUsuario(u.id);setUsuarios(p=>p.filter(x=>x.id!==u.id));}}
                          style={{padding:"4px 9px",borderRadius:7,border:"none",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:11,fontWeight:600}}>Remover</button>
                      </div>
                    </div>
                    {showAtribuicoes===u.id&&(
                      <AtribuicoesEditor usuario={u} org={org} ciclo={org.activeCiclo||CICLOS[0]} pc={pc2}/>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <PoweredBy/>

        {/* Modal edição de usuário */}
        {editingUsuario&&(
          <div style={{position:"fixed",inset:0,background:"rgba(15,23,42,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)"}}>
              <h3 style={{margin:"0 0 20px",fontSize:16,color:"#1e3a8a",fontWeight:800}}>✏️ Editar colaborador</h3>
              <div style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4,textTransform:"uppercase"}}>Nome *</label>
                  <input value={editingUsuario.nome} onChange={e=>setEditingUsuario(p=>({...p,nome:e.target.value}))} style={{...inp,boxSizing:"border-box"}} placeholder="Nome completo"/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4,textTransform:"uppercase"}}>Email *</label>
                  <input type="email" value={editingUsuario.email} onChange={e=>setEditingUsuario(p=>({...p,email:e.target.value.toLowerCase()}))} style={{...inp,boxSizing:"border-box"}} placeholder="email@org.com"/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4,textTransform:"uppercase"}}>Nova senha <span style={{fontWeight:400,color:"#94a3b8",textTransform:"none"}}>(deixe vazio para não alterar)</span></label>
                  <input type="password" value={editingUsuario.novaSenha} onChange={e=>setEditingUsuario(p=>({...p,novaSenha:e.target.value}))} style={{...inp,boxSizing:"border-box"}} placeholder="••••••••"/></div>
                <div><label style={{fontSize:11,fontWeight:700,color:"#64748b",display:"block",marginBottom:4,textTransform:"uppercase"}}>Função</label>
                  <select value={editingUsuario.funcao_id||""} onChange={e=>setEditingUsuario(p=>({...p,funcao_id:e.target.value}))} style={{...inp,boxSizing:"border-box"}}>
                    <option value="">Sem função</option>
                    {funcoes.map(f=><option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select></div>
              </div>
              <div style={{display:"flex",gap:10,marginTop:22}}>
                <button onClick={()=>setEditingUsuario(null)} style={{flex:1,padding:"10px",borderRadius:10,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",cursor:"pointer",fontWeight:700,fontSize:13}}>Cancelar</button>
                <button onClick={async()=>{
                  if(!editingUsuario.nome.trim()||!editingUsuario.email.trim()){alert("Nome e email são obrigatórios.");return;}
                  const patch={nome:san(editingUsuario.nome),email:editingUsuario.email.trim(),funcao_id:editingUsuario.funcao_id||null};
                  if(editingUsuario.novaSenha.length>=4) patch.senha_hash=simpleHash(editingUsuario.novaSenha);
                  else if(editingUsuario.novaSenha.length>0&&editingUsuario.novaSenha.length<4){alert("Senha deve ter ao menos 4 caracteres.");return;}
                  await sbFetch(`usuarios?id=eq.${editingUsuario.id}`,{method:"PATCH",prefer:"return=minimal",body:JSON.stringify(patch)});
                  setUsuarios(p=>p.map(u=>u.id===editingUsuario.id?{...u,...patch}:u));
                  setEditingUsuario(null);alert("Colaborador atualizado!");
                }} style={{...btn(pc2),flex:2,padding:"10px"}}>💾 Salvar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  // ── IMPORTAÇÃO DE USUÁRIOS ──
  if(screen==="importar_usuarios"&&org){
    const pc3=org.primaryColor||"#2563eb";

    function parseExcel(file){
      return new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=e=>{
          try{
            // Lê o arquivo como texto e tenta parsear como CSV ou TSV
            const text=e.target.result;
            const lines=text.split(/\r?\n/).filter(l=>l.trim());
            if(lines.length<2){reject("Arquivo vazio ou sem dados.");return;}
            // Detecta separador (vírgula ou ponto-e-vírgula ou tab)
            const sep=lines[0].includes(";")?";":(lines[0].includes("\t")?"\t":",");
            const headers=lines[0].split(sep).map(h=>h.trim().toLowerCase().replace(/['"]/g,""));
            // Mapeia colunas flexivelmente
            const iNome=headers.findIndex(h=>h.includes("nome")||h.includes("name"));
            const iEmail=headers.findIndex(h=>h.includes("email")||h.includes("e-mail"));
            const iFuncao=headers.findIndex(h=>h.includes("fun")||h.includes("cargo")||h.includes("role")||h.includes("posi"));
            if(iNome===-1||iEmail===-1){reject("Colunas obrigatórias não encontradas. Verifique se há colunas 'Nome' e 'Email'.");return;}
            const dados=[];
            for(let i=1;i<lines.length;i++){
              const cols=lines[i].split(sep).map(c=>c.trim().replace(/^["']|["']$/g,""));
              const nome=cols[iNome]||"";
              const email=cols[iEmail]||"";
              const funcao=iFuncao>=0?(cols[iFuncao]||""):"";
              if(!nome||!email||!email.includes("@")) continue;
              dados.push({nome,email:email.toLowerCase(),funcao});
            }
            if(dados.length===0){reject("Nenhuma linha válida encontrada.");return;}
            resolve(dados);
          }catch(err){reject("Erro ao processar arquivo: "+err.message);}
        };
        reader.onerror=()=>reject("Erro ao ler arquivo.");
        // Tenta como texto primeiro (CSV/TSV exportado do Excel)
        reader.readAsText(file,"UTF-8");
      });
    }

    async function handleFileUpload(file){
      if(!file) return;
      const ext=file.name.split(".").pop().toLowerCase();
      if(!["csv","txt","tsv"].includes(ext)){
        alert("Por favor, exporte sua planilha como CSV antes de importar.\n\nNo Excel: Arquivo → Salvar Como → CSV (separado por vírgulas)");
        return;
      }
      setImportando(true);
      setImportFinalResult(null);
      try{
        const dados=await parseExcel(file);
        // Verificar duplicatas
        const emails=dados.map(d=>d.email);
        const dups=await verificarEmailsExistentes(org.id,emails);
        setImportPreview(dados);
        setImportDuplicatas(dups);
        // Decisão padrão para duplicatas: manter
        const dec={};
        dups.forEach(e=>{dec[e]="manter";});
        setImportDecisoes(dec);
      }catch(err){
        alert("Erro: "+err);
      }
      setImportando(false);
    }

    async function confirmarImportacao(){
      if(!importPreview) return;
      setImportando(true);
      // Filtrar lista final conforme decisões de duplicatas
      const listaFinal=importPreview.filter(item=>{
        const dup=importDuplicatas.includes(item.email);
        if(!dup) return true; // não é duplicata, inclui
        return importDecisoes[item.email]==="substituir"; // duplicata: inclui só se substituir
      });
      if(listaFinal.length===0){
        alert("Nenhum usuário para importar após aplicar as decisões de duplicata.");
        setImportando(false);
        return;
      }
      const result=await importarUsuarios(org.id,listaFinal,org.slug||"avalie360");
      // Recarregar usuários e avaliados
      const [us,avs]=await Promise.all([loadUsuarios(org.id),loadAvaliados(org.id)]);
      setUsuarios(us);setAvaliados(avs);
      setImportFinalResult({...result,total:listaFinal.length,ignorados:importPreview.length-listaFinal.length});
      setImportando(false);
    }

    const uid="imp-file-"+Math.random().toString(36).slice(2,6);
    return(
      <div style={{minHeight:"100vh",background:"#f5f7ff",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
        <div style={{...hdr(pc3),position:"sticky",top:0,zIndex:20}}>
          <div><div style={{fontWeight:800,fontSize:15}}>📥 Importar Usuários — {org.name}</div><div style={{fontSize:11,opacity:0.75}}>Importe em massa via planilha Excel</div></div>
          <button onClick={()=>setScreen("equipe")} style={{...hBtn,border:"2px solid rgba(255,255,255,0.3)",background:"none"}}>← Voltar</button>
        </div>
        <div style={{maxWidth:720,margin:"0 auto",padding:"24px 16px 60px"}}>

          {/* Resultado final */}
          {importFinalResult&&(
            <div style={{background:importFinalResult.erros.length===0?"#f0fdf4":"#fefce8",borderRadius:16,padding:20,border:`1px solid ${importFinalResult.erros.length===0?"#bbf7d0":"#fde68a"}`,marginBottom:24}}>
              <h3 style={{color:importFinalResult.erros.length===0?"#166534":"#92400e",fontSize:15,marginBottom:12}}>
                {importFinalResult.erros.length===0?"✅ Importação concluída!":"⚠️ Importação concluída com avisos"}
              </h3>
              <p style={{fontSize:13,color:"#475569",marginBottom:8}}>
                <strong>{importFinalResult.criados}</strong> usuário(s) importado(s) com sucesso.
                {importFinalResult.ignorados>0&&<span> · <strong>{importFinalResult.ignorados}</strong> ignorado(s) por duplicata.</span>}
              </p>
              {importFinalResult.erros.length>0&&(
                <div style={{marginTop:12}}>
                  <p style={{fontSize:12,fontWeight:700,color:"#92400e",marginBottom:8}}>Erros:</p>
                  {importFinalResult.erros.map((e,i)=>(
                    <div key={i} style={{fontSize:12,color:"#dc2626",background:"#fee2e2",borderRadius:8,padding:"6px 10px",marginBottom:4}}>
                      {e.nome} ({e.email}): {e.erro}
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>{setImportPreview(null);setImportDuplicatas([]);setImportDecisoes({});setImportFinalResult(null);}}
                style={{marginTop:12,...btn(pc3),fontSize:12}}>Nova importação</button>
            </div>
          )}

          {/* Instruções */}
          {!importPreview&&!importFinalResult&&(
            <div style={{...card,marginBottom:20}}>
              <h3 style={{color:"#1e3a8a",fontSize:15,marginBottom:16}}>📋 Como preparar a planilha</h3>
              <p style={{fontSize:13,color:"#475569",marginBottom:12}}>Sua planilha deve ter as seguintes colunas (a ordem não importa):</p>
              <div style={{background:"#f8faff",borderRadius:10,padding:16,border:"1px solid #dbeafe",marginBottom:16,fontFamily:"monospace",fontSize:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {["Nome *","Email *","Função"].map(c=>(
                    <div key={c} style={{background:"#fff",borderRadius:8,padding:"8px 12px",border:"1px solid #bfdbfe",fontWeight:700,color:"#1e3a8a",textAlign:"center"}}>{c}</div>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginTop:8}}>
                  {[["Cassiano Luz","cassiano@sepal.org","Diretor Executivo"],["Maria Silva","maria@sepal.org","Missionária"]].map((row,i)=>
                    row.map((c,j)=><div key={`${i}-${j}`} style={{background:"#f8faff",borderRadius:8,padding:"6px 10px",border:"1px solid #e2e8f0",fontSize:11,color:"#475569"}}>{c}</div>)
                  )}
                </div>
              </div>
              <div style={{background:"#fefce8",borderRadius:10,padding:"10px 14px",border:"1px solid #fde68a",fontSize:12,color:"#92400e",marginBottom:16}}>
                ⚠️ <strong>Antes de fazer upload:</strong> No Excel, vá em <strong>Arquivo → Salvar Como → CSV (separado por vírgulas)</strong>. O sistema aceita arquivos <strong>.csv</strong>.
              </div>
              <p style={{fontSize:12,color:"#64748b",marginBottom:4}}>
                🔑 Todos os usuários serão criados com a senha padrão <strong>"avalie360"</strong>. Cada pessoa verá um aviso para alterá-la no primeiro acesso.
              </p>
              <p style={{fontSize:12,color:"#64748b"}}>
                👥 Cada pessoa importada será criada como <strong>usuário</strong> (pode fazer login e avaliar) e como <strong>avaliado</strong> (pode ser avaliado). Você define quem avalia quem depois.
              </p>
            </div>
          )}

          {/* Upload */}
          {!importPreview&&!importFinalResult&&(
            <div style={{...card,marginBottom:20}}>
              <h3 style={{color:"#1e3a8a",fontSize:15,marginBottom:16}}>📤 Selecionar arquivo</h3>
              <div
                onDragOver={e=>e.preventDefault()}
                onDrop={e=>{e.preventDefault();handleFileUpload(e.dataTransfer.files[0]);}}
                onClick={()=>document.getElementById(uid).click()}
                style={{border:"2px dashed #bfdbfe",borderRadius:14,padding:32,textAlign:"center",cursor:"pointer",background:"#f8faff",transition:"all 0.2s"}}>
                <div style={{fontSize:36,marginBottom:8}}>📊</div>
                <p style={{fontSize:13,color:"#64748b",margin:0,fontWeight:600}}>Clique ou arraste seu arquivo CSV aqui</p>
                <p style={{fontSize:11,color:"#94a3b8",marginTop:4}}>Arquivos .csv exportados do Excel</p>
              </div>
              <input id={uid} type="file" accept=".csv,.txt,.tsv" style={{display:"none"}}
                onChange={e=>handleFileUpload(e.target.files[0])}/>
              {importando&&<p style={{textAlign:"center",color:"#64748b",fontSize:13,marginTop:12}}>⏳ Processando arquivo…</p>}
            </div>
          )}

          {/* Preview e duplicatas */}
          {importPreview&&!importFinalResult&&(
            <>
              {/* Duplicatas */}
              {importDuplicatas.length>0&&(
                <div style={{...card,marginBottom:20,border:"1px solid #fde68a",background:"#fefce8"}}>
                  <h3 style={{color:"#92400e",fontSize:15,marginBottom:4}}>⚠️ Emails já cadastrados ({importDuplicatas.length})</h3>
                  <p style={{fontSize:12,color:"#92400e",marginBottom:16}}>Decida o que fazer com cada um:</p>
                  {importDuplicatas.map(email=>{
                    const pessoa=importPreview.find(p=>p.email===email);
                    return(
                      <div key={email} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",background:"#fff",borderRadius:10,border:"1px solid #fde68a",marginBottom:8,flexWrap:"wrap"}}>
                        <div style={{flex:1,minWidth:120}}>
                          <div style={{fontWeight:700,fontSize:13,color:"#1e3a8a"}}>{pessoa?.nome}</div>
                          <div style={{fontSize:11,color:"#94a3b8"}}>{email}</div>
                        </div>
                        <div style={{display:"flex",gap:8}}>
                          <button onClick={()=>setImportDecisoes(p=>({...p,[email]:"manter"}))}
                            style={{padding:"6px 12px",borderRadius:8,border:`2px solid ${importDecisoes[email]==="manter"?"#16a34a":"#e2e8f0"}`,background:importDecisoes[email]==="manter"?"#f0fdf4":"#fff",color:importDecisoes[email]==="manter"?"#16a34a":"#64748b",cursor:"pointer",fontSize:12,fontWeight:700}}>
                            Manter atual
                          </button>
                          <button onClick={()=>setImportDecisoes(p=>({...p,[email]:"substituir"}))}
                            style={{padding:"6px 12px",borderRadius:8,border:`2px solid ${importDecisoes[email]==="substituir"?"#dc2626":"#e2e8f0"}`,background:importDecisoes[email]==="substituir"?"#fee2e2":"#fff",color:importDecisoes[email]==="substituir"?"#dc2626":"#64748b",cursor:"pointer",fontSize:12,fontWeight:700}}>
                            Substituir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Preview da lista */}
              <div style={{...card,marginBottom:20}}>
                <h3 style={{color:"#1e3a8a",fontSize:15,marginBottom:4}}>👀 Preview — {importPreview.length} pessoa(s) encontrada(s)</h3>
                <p style={{fontSize:12,color:"#94a3b8",marginBottom:16}}>Verifique os dados antes de confirmar:</p>
                <div style={{maxHeight:320,overflowY:"auto"}}>
                  {importPreview.map((p,i)=>{
                    const isDup=importDuplicatas.includes(p.email);
                    const decisao=importDecisoes[p.email];
                    return(
                      <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 10px",borderRadius:8,marginBottom:4,
                        background:isDup?(decisao==="manter"?"#f1f5f9":"#fef2f2"):"#f8faff",
                        border:`1px solid ${isDup?(decisao==="manter"?"#e2e8f0":"#fecaca"):"#dbeafe"}`}}>
                        <div style={{width:32,height:32,borderRadius:8,background:isDup?"#94a3b8":pc3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff",flexShrink:0}}>
                          {p.nome.slice(0,2).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontWeight:700,fontSize:13,color:isDup&&decisao==="manter"?"#94a3b8":"#1e3a8a"}}>{p.nome}</div>
                          <div style={{fontSize:11,color:"#94a3b8",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.email}{p.funcao?` · ${p.funcao}`:""}</div>
                        </div>
                        {isDup&&<span style={{fontSize:10,fontWeight:700,color:decisao==="manter"?"#94a3b8":"#dc2626",whiteSpace:"nowrap"}}>{decisao==="manter"?"ignorado":"substituir"}</span>}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{display:"flex",gap:12}}>
                <button onClick={()=>{setImportPreview(null);setImportDuplicatas([]);setImportDecisoes({});}}
                  style={{...btnO,flex:1}}>← Cancelar</button>
                <button onClick={confirmarImportacao} disabled={importando}
                  style={{...btn("#16a34a"),flex:2,opacity:importando?0.6:1}}>
                  {importando?"⏳ Importando…":`✅ Confirmar importação (${importPreview.filter(p=>!importDuplicatas.includes(p.email)||(importDecisoes[p.email]==="substituir")).length} usuários)`}
                </button>
              </div>
            </>
          )}
        </div>
        <PoweredBy/>
      </div>
    );
  }

  return <div style={{...pg,alignItems:"center",justifyContent:"center"}}><div style={{fontSize:32}}>⏳</div></div>;
}
