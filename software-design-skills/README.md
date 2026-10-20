# Software Design Skills

Plugin greenfield para convertir una idea de producto en un paquete de diseño de software listo para implementación sin convertir el PRD en un documento monolítico.

Compatible con **OpenAI Codex** y **Claude Code**. Los `SKILL.md` están en inglés para portabilidad; los artefactos pueden escribirse en el idioma del usuario.

## Idea central

Una sola fuente de verdad por tipo de decisión:

| Pregunta | Autoridad |
|---|---|
| ¿Por qué existe el producto y qué debe hacer? | `docs/product/prd.md` |
| ¿Qué conceptos y reglas forman el dominio? | `docs/design/domain.md` |
| ¿Cómo se estructura el sistema? | `docs/design/architecture/architecture.dsl` |
| ¿Por qué se eligió una decisión técnica? | `docs/design/architecture/adr/` |
| ¿Cuál es el modelo persistente? | `docs/design/data/schema.dbml` |
| ¿Cuál es el contrato HTTP? | `docs/design/api/openapi.yaml` |
| ¿Cuál es el contrato de eventos? | `docs/design/events/asyncapi.yaml` |
| ¿Cómo fluye el usuario? | `docs/design/ux/flows.mmd` |
| ¿Cómo se valida visualmente una UI importante? | `docs/design/ux/prototype.html` |
| ¿Cuál es el estado de findings de revisión? | `docs/design/review.md` *(evidencia, no autoridad de diseño)* |
| ¿En qué orden se construye? | `docs/build/plan.md` |
| ¿Dónde se declara qué archivo manda? | `docs/spec/manifest.yaml` |

No todos los proyectos necesitan todos los archivos. La skill de diseño crea únicamente los artefactos aplicables.

## Flujo

```text
shaping-product
      ↓
writing-prd
      ↓
designing-system
      ↓
reviewing-system-design        # baseline completo, una vez
      ↓
   ¿BLOCKER/MAJOR?
      ├─ no ───────────────→ approved
      │                         ↓
      │                  writing-build-plan
      │
      └─ sí
          ↓
reconciling-system-design      # corrige findings existentes
          ↓
reviewing-system-design        # follow-up por impact cone
          ↓
      approved / reconcile / blocked / escalate
```

La revisión ya no corrige sus propios hallazgos. `reviewing-system-design` actúa como gate independiente; `reconciling-system-design` modifica las autoridades canónicas y devuelve el paquete a verificación.

Después del primer release, las features y cambios del sistema pasan normalmente por `compact-change-skills`:

```text
existing system + request
        ↓
compact-change-skills
        ↓
quick / medium / large
        ↓
verified change
```

## Convergencia de review

La v1.1 introduce un protocolo explícito para evitar ciclos infinitos:

- una **baseline review** completa por versión/material change;
- findings con IDs estables y severidad `BLOCKER`, `MAJOR`, `MINOR`, `NOTE`;
- solo `BLOCKER` y `MAJOR` bloquean build planning;
- follow-up reviews verifican findings existentes y regresiones dentro del **impact cone**;
- después del baseline no se agregan nuevos `MINOR`/`NOTE`;
- nuevos findings en follow-up solo pueden ser regresiones `BLOCKER/MAJOR` o un `CRITICAL_NEW` `BLOCKER`;
- máximo 3 ciclos automáticos de reconciliación por baseline;
- escalamiento si `BLOCKER + MAJOR` aumenta durante dos verificaciones consecutivas;
- el reviewer nunca modifica fuentes canónicas.

La aprobación tiene umbral objetivo: cero `BLOCKER`, cero `MAJOR`, cero contradicciones semánticas bloqueantes y ninguna decisión de stakeholder que impida implementar. La existencia de deuda menor no impide aprobar.

## Artefactos

### Núcleo

```text
docs/
├── product/
│   ├── brief.md
│   └── prd.md
├── spec/
│   └── manifest.yaml
├── design/
│   ├── review.md
│   ├── domain.md
│   ├── architecture/
│   │   ├── architecture.dsl
│   │   └── adr/
│   ├── data/
│   ├── api/
│   ├── events/
│   └── ux/
└── build/
    └── plan.md
```

`data/`, `api/`, `events/` y los prototipos UX son condicionales. `review.md` aparece cuando inicia la revisión y contiene evidencia/estado de workflow, no especificación canónica.

## Reglas de autoridad

- El PRD posee **producto, alcance, usuarios, comportamiento requerido y quality attributes**.
- Structurizr/C4 posee **estructura técnica y relaciones arquitectónicas**, no objetivos de producto.
- ADR posee **rationale y trade-offs de decisiones técnicas**.
- DBML posee **schema persistente**; el PRD no replica columnas/tablas.
- OpenAPI/AsyncAPI poseen **contratos de integración**; el PRD referencia requisitos, no duplica payloads.
- Mermaid posee **flujos**, no decisiones arquitectónicas.
- HTML sirve como **prototipo verificable**, no como arquitectura.
- `manifest.yaml` declara qué fuentes son autoritativas y cuáles no aplican.
- `review.md` registra findings y ciclos, pero no puede redefinir producto ni arquitectura.
- Solo una contradicción **semántica material** detiene implementación. Diferencias editoriales, de casing o de representación no se tratan automáticamente como blockers.

## PRD

El PRD de este plugin es deliberadamente más pequeño que un mega-PRD. Conserva:

- problem/purpose;
- users/context;
- goals/non-goals;
- journeys;
- capabilities;
- FR/NFR;
- business rules e invariants;
- constraints;
- MVP;
- success criteria;
- future scope;
- open product decisions.

La arquitectura, el schema, los contratos y el orden de implementación viven en artefactos separados.

## Implementación inicial

No ejecutar todo el proyecto en un único prompt. `writing-build-plan` divide el sistema en slices verticales verificables:

```text
M01 -> implement -> verify
M02 -> implement -> verify
M03 -> implement -> verify
```

`compact-change-skills:implementing-change` 2.1+ puede consumir directamente un slice aprobado de este plugin junto con el `manifest.yaml` y las autoridades relevantes.

## Principios

- Primero problema y restricciones; después tecnología.
- No inventar decisiones que el usuario o el repositorio/proyecto no hayan aprobado.
- Una fuente de verdad por tipo de decisión.
- Texto versionable y machine-readable cuando existe un estándar mejor que prosa libre.
- Crear solo los artefactos que reduzcan ambigüedad real.
- No mezclar requisitos de producto con elecciones de implementación.
- Diseñar para implementación incremental por slices verticales.
- Separar discovery de defectos, corrección y verificación.
- Aprobar por build readiness objetivo, no por ausencia absoluta de posibles mejoras.
