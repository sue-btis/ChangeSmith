# Arquitectura de despliegue

Responde "¿dónde corre y con qué se conecta?". El desarrollador te va a describir lo que *quiso* construir; el repositorio contiene lo que *construyó*. El diagrama dibuja lo segundo.

## Inventario de destinos

Antes de hablar con nadie, lee el repositorio y anota cada connection string, hostname, IP, puerto, URL base, cola, bucket y cliente de SDK que aparezca en configuración o código. Lee `arquitectura/analisis-repo.md` para saber qué archivos abrir según el stack y qué significa cada señal.

Dos cosas condicionan todo lo demás:

- **Qué es realmente cada componente.** Una carpeta con Angular puede ser una SPA independiente o un microfrontend montado en otra aplicación: el manifiesto de federación lo dice, y el diagrama cambia por completo. Un proyecto con `main` puede ser una API, un worker o un job. No supongas por el framework.
- **Qué destinos no viven en ninguna nube.** Una IP privada (`10.x`, `172.16–172.31.x`, `192.168.x`) o un hostname interno exige conectividad híbrida (VPN, ExpressRoute, Direct Connect), y eso bloquea el despliegue. Ojo: solo `172.16` a `172.31` es privado; `172.168.x` no.

## Qué reportar antes de dibujar

- El componente no es lo que parece.
- Destinos fuera de la nube, con el rango exacto, porque condicionan el direccionamiento de la red virtual.
- Secretos versionados: están en el historial de git; hay que rotarlos, no solo borrarlos.
- Lo que el diagrama afirmaría pero el código no hace: telemetría sin SDK, autenticación sin middleware, caché sin cliente.
- Configuración que no sobrevive al despliegue: localhost, puertos de desarrollo, orígenes en comodín.

Si el desarrollador reafirma una decisión que señalaste, es suya: anótala en el diagrama y sigue.

## Qué preguntar

Solo lo que el repositorio no puede saber, en un solo mensaje y con un valor por defecto en cada pregunta:

- nombres de recursos que ya existen;
- ambiente y región, y si se replica uno existente;
- quién es dueño de la red privada y cómo se llega a ella;
- qué se comparte entre ambientes (registro de contenedores, logs, gateway);
- decisiones de costo: nivel de servicio, agrupación de bases, redundancia.

Si el destino es Azure, lee `arquitectura/azure.md`. Si es otra nube, aplica el mismo criterio y ofrece añadir una referencia equivalente.

## Codificación de conexiones

| Rol | Trazo | Uso |
|---|---|---|
| Público | Sólido, azul | Tráfico de usuarios por internet |
| Despliegue | Punteado, azul | Pipelines, publicación de imágenes |
| Privado | Sólido, verde azulado | Red virtual, endpoints privados |
| Dependencia | Punteado, morado | Servicios existentes, salida a internet |
| Interno | Punteado, ámbar | Red corporativa vía túnel |
| Telemetría | Sólido, gris | Logs y métricas |
| Pendiente | Ámbar sobre texto | Lo que falta confirmar |

Los nombres de recursos van en monoespaciada: alguien los va a escribir en un portal o en un script. El backend suele ser el componente central que irradia (ver `../sistema-visual.md`).

## Cuando el diagrama pide presupuesto

Ofrece una estimación por niveles con el método de `arquitectura/costos.md`. Va después de los hallazgos, nunca antes: una tabla de costos construida sobre lo que te describieron, y no sobre lo que encontraste, es convincente y está equivocada. Cada premisa (réplicas, bases, un cambio de código pendiente) va pegada a su cifra.

## Replicar un ambiente

La topología no cambia; cambian los nombres y unas pocas decisiones de tamaño. Pide los nombres de lo que ya existe y revisa:

- **Qué se comparte con producción:** el registro de contenedores conviene compartirlo, para promover la misma imagen que se probó.
- **Qué se simplifica:** redundancia y niveles altos suelen sobrar fuera de producción.
- **Qué se comparte y no debería:** si pruebas apunta a datos productivos, al menos con credenciales de solo lectura. Señálalo una vez.

Sigue la convención de nombres existente aunque no coincida con la palabra del ticket, y dilo.
