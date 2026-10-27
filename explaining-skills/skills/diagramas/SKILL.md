---
name: diagramas
description: Dibujar diagramas que explican: flujos de proceso, relaciones entre empresas o personas, cadenas de cálculo, líneas de tiempo y arquitectura de despliegue en la nube, como HTML, PNG y SVG. Úsala cuando haga falta un diagrama, al documentar un proceso, una infraestructura o cómo desplegar un proyecto, o cuando una explicación necesite un dibujo.
---

# Diagramas que explican

Un diagrama sirve cuando el lector lo reconoce como **la realidad**, no como la idea que alguien tenía de ella. Para eso, **lee la fuente antes de dibujar**: el repositorio, los datos o los documentos.

## El flujo

### 1 · Elegir el tipo por la pregunta

Cada diagrama responde una pregunta. Elige el tipo por ella y lee su referencia antes de dibujar:

| Pregunta | Tipo | Referencia |
|---|---|---|
| ¿Cómo pasa, en qué orden? | Flujo | `references/tipos/flujo.md` |
| ¿Quién con quién? ¿Quién le cobra a quién? | Relaciones | `references/tipos/relaciones.md` |
| ¿De dónde sale esta cifra? | Cálculo | `references/tipos/calculo.md` |
| ¿Cuándo? ¿Quién en qué periodo? | Tiempo | `references/tipos/tiempo.md` |
| ¿Dónde corre y con qué se conecta? | Arquitectura | `references/tipos/arquitectura.md` |
| ¿Cómo funciona por dentro una máquina? | Mecanismo | la skill `anatomy`, si está instalada |

Si la pregunta pide dos tipos, son dos diagramas. Si es "¿cuánto?" o "¿cómo cambió?", no es un diagrama sino una gráfica: carga la skill `dataviz`.

### 2 · Inventariar

Antes de dibujar, haz un **inventario**: cada elemento que la fuente prueba que existe, con su origen. En arquitectura son destinos externos; en un flujo, pasos y registros; en relaciones, entidades y montos.

> Cada elemento del inventario es una caja o una flecha del diagrama. Una caja que no sale del inventario está inventada. Un elemento del inventario que no está en el diagrama es una omisión.

### 3 · Reportar lo que contradice

Si el inventario contradice lo que te contaron (un paso que no se registra, una empresa que no factura, un componente que no es lo que parece), dilo **antes** de dibujar. Usa una frase para qué pasa y otra para por qué importa. Si dibujas primero, la conversación se va a las cajas y los problemas de fondo se pierden.

### 4 · Dibujar el estado

Un diagrama se lee como "así es", nunca como "así será". Lo que no existe o no se ha confirmado va marcado (color de advertencia y "por confirmar") en lugar de esperar a tenerlo: un diagrama con dos cajas en naranja convierte una pregunta abstracta en una que se señala con el dedo.

Antes de escribir SVG, lee `references/sistema-visual.md` y parte de `assets/plantilla.html`. Los textos del diagrama siguen la skill `explaining-skills:lenguaje`.

### 5 · Exportar y entregar

```bash
python scripts/exportar.py <diagrama.html> <salida.svg> --png <salida.png>
```

El script extrae el SVG autónomo y lo convierte a PNG al doble de resolución con Chrome o Edge en modo headless. Entrega la página para iterar, el PNG para documentos y el SVG para editar. Cuando el diagrama va dentro de otro documento (un libro, un expediente), basta con incrustar el SVG.

## Iterar

Regenerar es barato, y dilo al entregar: el usuario deja de tratar el diagrama como definitivo y empieza a señalar cosas.

- **Error de fondo** (una flecha que sale del lugar equivocado, una relación mal representada): corrígelo y explica en una línea qué implicaba el error.
- **Detalle estético** (un solapamiento, un texto partido): arréglalo sin ceremonia.

Si notas que tu propia codificación es inconsistente, dilo antes de que lo noten.
