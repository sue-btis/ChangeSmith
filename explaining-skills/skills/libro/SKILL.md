---
name: libro
description: Explicar un tema como libro, dividido en capítulos que responden una pregunta cada uno. Úsala al escribir o rehacer una investigación, expediente o explicación de un cliente, proceso, sistema o conjunto de datos.
---

Un **libro** lleva a un lector desde lo que ya sabe hasta entender el tema, un concepto a la vez. Falla de dos maneras:

- **Como libro de anatomía:** todo pesa lo mismo y el lector no sabe qué es lo importante. Se evita con el **triaje**.
- **Como libro de matemáticas:** sube a la abstracción y no baja, y el lector se pierde. Se evita con la **escalera de abstracción**.

Antes de escribir, carga la skill `explaining-skills:lenguaje`: la voz del libro sale de ahí.

## Pasos

### 1. Lector y promesa

Escribe en una frase quién lee, qué sabe ya y qué podrá hacer al terminar. Por ejemplo: "Al terminar, *alguien del equipo que no conoce minería* puede *explicar por qué la planta pierde plata y qué falta medir*".

Confirma al lector con el usuario aunque creas deducirlo, porque cambia todo el índice.

### 2. Mapa de conceptos y triaje

Lista cada concepto y cada hallazgo que podría entrar al libro, y de cuáles depende cada uno (ley → recuperación → calificación). Ordénalos para que ninguno aparezca antes que sus dependencias. Si el proyecto ya tiene glosario o `CONTEXT.md`, usa sus términos.

Luego haz el **triaje** de cada elemento contra la promesa:

| Clase | Qué es | Dónde va |
|---|---|---|
| Esencial | Sin esto no se cumple la promesa | En el texto, y dentro de la respuesta corta |
| Apoyo | Ayuda a creer o a matizar lo esencial | Nota al margen |
| Consulta | Sirve para verificar o para trabajar después: tablas, nombres de sistemas, cifras completas | Apéndice |
| Fuera | No sirve a la promesa | No entra |

Si dudas entre esencial y apoyo, es apoyo.

Termina cuando cada elemento tiene clase y lugar, y ningún concepto depende de uno posterior.

### 3. Índice

Divide en partes y capítulos. Cada capítulo responde **una** pregunta, escrita como la haría el lector ("¿De dónde sale el dinero?", no "Estructura financiera"), y carga **como máximo tres ideas esenciales**. Si tiene más, son dos capítulos.

Para ordenar:

- De lo concreto a lo abstracto: primero un caso (un viaje, un turno), luego la regla.
- De lo chico a lo grande: unidad mínima → mes → planta → grupo.
- Cuando hay un proceso físico, sigue su flujo.

**Prueba del resumen:** junta en orden las respuestas cortas de todos los capítulos. Deben leerse como un resumen coherente del libro en una página. Si no se leen así, falla el índice o el triaje.

Muestra al usuario la promesa, el índice y la respuesta corta de cada capítulo. **Espera su visto bueno antes de escribir.**

### 4. Capítulos

Escribe cada capítulo con el [molde](#molde-del-capítulo), subiendo por la [escalera](#escalera-de-abstracción). Cada término nuevo se define la primera vez que aparece y entra al glosario.

### 5. Lector frío

Prepara un archivo de texto por capítulo con el libro **hasta ese capítulo**: la portada, los capítulos anteriores y ese. Escribe cada diagrama como la lista de los textos que contiene, porque el lector no ve imágenes. Lanza en paralelo un agente `lector-frio` (de este plugin) por capítulo y dale solo la ruta de su archivo. Cada uno responde:

1. la pregunta del capítulo, con sus palabras;
2. lo más importante del capítulo, en no más de tres puntos;
3. dónde se perdió;
4. qué tuvo que suponer.

Lo que conteste en el punto 2 tiene que coincidir con las ideas esenciales del capítulo. Si nombra un apoyo como lo más importante, el capítulo tiene el problema del libro de anatomía. Si el punto 3 trae algo que de verdad impide entender, tiene el problema del libro de matemáticas.

Corrige y vuelve a pasar solo los capítulos que fallaron, hasta que pasen. Distingue lo que impide entender de lo que el lector pediría por curiosidad: lo segundo no se corrige si mete apoyo al texto.

## Molde del capítulo

1. **Pregunta:** el título.
2. **Respuesta corta:** dos o tres líneas con las ideas esenciales. Quien solo lea esto ya se lleva el capítulo. Respeta la evidencia del texto: una hipótesis se dice como hipótesis ("parece", "según sus nombres"), aunque quede menos contundente.
3. **Caso:** un ejemplo real con números, recorrido paso a paso (un turno concreto, una factura concreta). Elige un caso cuya cuenta cierre con los números que muestras. Si un dato del caso no se puede explicar, porque no se sabe su unidad o falta un paso, elige otro caso.
4. **Mecanismo:** cómo funciona en general, con su diagrama.
5. **Por qué importa:** qué decisión, cifra o problema depende de esto.
6. **Lo que no sabemos:** hipótesis abiertas y preguntas al cliente que tocan este capítulo.
7. **Puente:** una línea que deja planteada la pregunta del siguiente capítulo.

## Escalera de abstracción

Los peldaños, de abajo hacia arriba:

1. **Caso:** un turno.
2. **Patrón:** los turnos de un mes.
3. **Regla:** la definición o la fórmula.
4. **Modelo:** la calificación del grupo.

- Se sube un peldaño a la vez, y cada peldaño nuevo se ancla con un número del caso.
- Una fórmula aparece después de haberla hecho a mano con el caso, y primero en palabras: "lo que entró menos lo que se fue en los jales, entre lo que entró".
- El capítulo cierra bajando al caso: "por eso ese turno dio 95 %".

## Diagramas

Un diagrama por mecanismo, nunca uno decorativo. Para dibujarlo, carga la skill `explaining-skills:diagramas`. El texto dice qué mirar en el diagrama, y el pie dice qué conclusión sacar.

Todo término que aparece en un diagrama se define en el texto **antes** del diagrama. Un término que vive solo en la figura nadie lo entiende.

## Formato HTML

Un solo archivo HTML autocontenido:

- índice lateral fijo, con partes y capítulos numerados;
- un ancla por capítulo;
- diagramas en SVG en línea;
- respuesta corta destacada al inicio de cada capítulo;
- tipografía Google Sans, cargada de Google Fonts, y fondo `#FAFAFA` en tema claro;
- columna de texto angosta (≈ 65 caracteres) y notas al margen para el apoyo;
- glosario al final, con un enlace desde cada término;
- apéndices de referencia (tablas, consultas, cifras completas), preguntas al cliente y bitácora de cambios;
- estilos que se imprimen bien.
