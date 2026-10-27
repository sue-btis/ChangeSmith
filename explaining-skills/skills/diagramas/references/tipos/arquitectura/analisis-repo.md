# Análisis del repositorio

Objetivo de esta fase: salir con un **inventario de destinos externos** y con una comprensión correcta de qué es cada componente. Todo lo demás del diagrama se deriva de aquí.

## Orden de lectura

Leer en este orden ahorra tiempo porque cada paso acota el siguiente.

**1. La forma del repositorio.** `ls` en la raíz. ¿Uno o varios proyectos? ¿Monorepo, o carpetas hermanas que son repos independientes? Un `.git` por carpeta significa repos separados, y eso implica pipelines separados.

**2. Los manifiestos.** Dicen el stack, la versión del runtime y —lo más valioso— **las dependencias, que delatan servicios externos**. Un paquete de cliente de Redis en el manifiesto significa que hay un Redis, aunque la configuración no lo mencione.

| Stack | Archivo |
|---|---|
| .NET | `*.csproj`, `*.fsproj`, `Directory.Packages.props` |
| Node / frontend | `package.json` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile` |
| Java | `pom.xml`, `build.gradle` |
| Go | `go.mod` |
| PHP | `composer.json` |
| Ruby | `Gemfile` |

**3. La configuración.** Aquí vive el inventario de destinos.

`appsettings*.json` · `.env*` · `application*.yml` · `config/*.js` · `settings.py` · `environment*.ts` · `*.tfvars` · `docker-compose.yml`

Anota literalmente cada valor que apunte fuera del proceso: cadenas de conexión, hostnames, IPs, puertos, URLs base, nombres de contenedores y colas, credenciales.

**4. El punto de entrada.** `Program.cs`, `Startup.cs`, `main.ts`, `index.js`, `app.py`, `main.go`. El registro de servicios de arranque es un mapa de todo lo que el proceso necesita para funcionar, y revela lo que la configuración calla: middleware de autenticación, política de CORS, clientes registrados, health checks, telemetría.

**5. Empaquetado y despliegue.** `Dockerfile`, `docker-compose.yml`, `.github/workflows/`, `azure-pipelines.yml`, `.gitlab-ci.yml`, `infra/`, `*.bicep`, `*.tf`. Si no hay `Dockerfile` y el destino son contenedores, eso es un pendiente que hay que reportar.

**6. Documentación existente.** `README`, `docs/`, `*.md`. Útil, pero trátala como una hipótesis: la documentación envejece y el código no miente. Cuando se contradigan, gana el código — y esa contradicción es un hallazgo.

## Qué significa cada señal

### El componente no es lo que parece

El error más caro, porque invalida la topología entera y no se nota hasta el despliegue.

**Microfrontend en vez de aplicación independiente.** Busca `federation.config.js`, `webpack.config.js` con `ModuleFederationPlugin`, `@angular-architects/native-federation`, `single-spa`, o un `exposes` en cualquier manifiesto. Si el proyecto **expone** módulos, es un remoto: se monta dentro de otra aplicación y el usuario nunca abre su URL. Consecuencias que el diagrama debe reflejar:

- La entrada real es la aplicación anfitriona, no este proyecto.
- El hosting solo sirve archivos estáticos, y necesita cabeceras CORS para que el anfitrión pueda descargarlos.
- El código se ejecuta en el **origen del anfitrión**: las rutas relativas y el almacenamiento del navegador se resuelven contra ese dominio, no contra el propio. Cualquier proxy integrado del hosting estático queda inútil.

**Worker o job en vez de servicio web.** Sin controladores ni rutas, con un bucle o un consumidor de cola. No lleva ingress ni dominio; sí lleva disparador y escalado.

**Varios servicios en un proyecto.** Más de un punto de entrada, o un `docker-compose` con varios servicios.

### Destinos que no viven en la nube

Marca cualquier IP literal o hostname que no resuelva a un servicio administrado. Rangos privados:

```
10.0.0.0/8        10.x.x.x
172.16.0.0/12     172.16.x.x  a  172.31.x.x     ← solo hasta el 31
192.168.0.0/16    192.168.x.x
```

Fuera de esos rangos la dirección es espacio público, aunque la organización la use internamente. Eso importa: la nube va a intentar enrutar esa dirección hacia internet en vez de meterla por el túnel, así que hay que declarar el prefijo explícitamente en la configuración de red.

En cualquiera de los dos casos hace falta conectividad híbrida, y el rango de la red virtual no puede solaparse con el de la red interna. Como ese rango no se cambia después de crearla, la pregunta va **antes** del despliegue.

### Estado en memoria que impide escalar horizontalmente

Este es el hallazgo que más veces cambia un presupuesto, y el único de esta lista que **no se ve en la configuración**: hay que leer el código.

Si el proceso guarda estado en su propia memoria, correr más de una réplica lo rompe — el cliente queda pegado a una réplica y lo que ocurre en las otras no le llega. El síntoma es intermitente y casi imposible de diagnosticar, porque nada falla: simplemente a veces no pasa nada.

Qué buscar:

| Patrón | Señales |
|---|---|
| Conexiones SSE o WebSocket | `text/event-stream`, `res.write('data:`, un arreglo o `Map` de clientes en ámbito de módulo, `socket.io` sin adaptador externo |
| Sesiones en memoria | `express-session` sin `store`, sesión en proceso, `IMemoryCache` usado como sesión |
| Caché en proceso | `node-cache`, un `Map` de módulo, `IMemoryCache`, `@lru_cache` sobre datos compartidos |
| Archivos en disco local | `multer` con `diskStorage`, escrituras a rutas relativas, `/tmp` como almacenamiento |
| Tareas programadas en proceso | `setInterval`, `node-cron`, `IHostedService` con temporizador, `BackgroundService` |
| Contadores y límites | Límite de tasa en memoria, semáforos, banderas de bloqueo |

Consecuencias que el diagrama debe reflejar:

- **El servicio queda fijado a una réplica** (`minReplicas = maxReplicas = 1`), lo cual además lo convierte en punto único de falla y hace que cada reinicio corte las conexiones abiertas.
- **El nivel "escalable" de cualquier presupuesto deja de ser válido.** Pagar por varias réplicas de algo que no puede correr en varias réplicas es dinero tirado, y peor, es una promesa que no se cumple.
- La alternativa —sacar el estado a Redis, a un servicio de pub/sub o a almacenamiento de objetos— es trabajo de código que hay que presupuestar aparte.

Dilo con esa cadena completa: *el estado vive en memoria, por eso una sola réplica, por eso este nivel del presupuesto no aplica sin cambiar código*. Cada eslabón por separado suena a detalle técnico; la cadena entera es una decisión de negocio.

### Configuración fijada en tiempo de compilación

Un frontend suele resolver la URL del backend al compilar, no al arrancar: `environment.prod.ts`, un `.env` que consume el empaquetador, un `app-config.js` generado durante el build.

Eso significa que **cambiar la URL del API obliga a recompilar y redesplegar el frontend**, no a tocar un ajuste. En el diagrama importa porque la flecha de CI/CD hacia el frontend arrastra una dependencia: el backend tiene que tener su dominio definido antes de compilar el frontend, lo que ordena la secuencia de despliegue.

### Secretos versionados

Busca en los archivos de configuración commiteados:

```bash
grep -rniE '(password|pwd|secret|apikey|api_key|accountkey|token|connectionstring)\s*[=:]' \
  --include='*.json' --include='*.yml' --include='*.yaml' \
  --include='*.config' --include='*.ts' --include='*.py' .
```

Si aparecen valores reales, están en el historial de git. Borrarlos del archivo no basta — hay que **rotar la credencial**. Dilo así de directo, sin sermón: es un hecho operativo, no un regaño.

### Lo que el diagrama afirma y el código no hace

Compara lo que te describen contra lo registrado en el punto de entrada:

| Afirmación | Qué buscar | Si falta |
|---|---|---|
| Telemetría / APM | Paquete del SDK u OpenTelemetry en el manifiesto | Solo llegan logs de plataforma, no de aplicación |
| Autenticación | `AddAuthentication`, middleware de auth, guards | El servicio es abierto |
| Multi-tenant | De dónde sale el identificador de tenant | Puede haber fuga entre tenants |
| Caché | Cliente registrado | Está declarado pero no se usa |

Un caso que vale la pena revisar siempre en sistemas multi-tenant: **de dónde sale el identificador y qué pasa si no llega**. Un valor por defecto silencioso convierte una petición sin credenciales en una petición contra un tenant real. Y revisa que el nombre de la cabecera coincida entre quien la envía y quien la lee — un desajuste ahí hace que todo caiga al valor por defecto sin error visible.

### Configuración que no sobrevive al despliegue

- URLs de `localhost` o IPs de desarrollo en código de cliente.
- Puertos fijos de desarrollo.
- Orígenes permitidos en comodín. Además, permitir cualquier origen es incompatible con enviar credenciales: el navegador lo rechaza.
- Redirección forzada a HTTPS detrás de un balanceador que ya termina TLS, sin procesar las cabeceras de reenvío. Provoca bucles de redirección.
- Validación de certificado desactivada en cadenas de conexión.

## El inventario

Cierra la fase con una tabla. Es la que verifica el diagrama después.

| Destino | Dónde aparece | Protocolo / puerto | Tipo | Alcanzable desde |
|---|---|---|---|---|
| `sql-x.database.windows.net` | `appsettings.json` | TDS 1433 | Base de datos administrada | Red privada |
| `10.4.2.15` | `appsettings.json` | TDS 1433 | Servidor interno | **Requiere túnel** |
| `cache.ejemplo.com` | `appsettings.json` | Redis 6379 | Caché | Internet |

La última columna es la que ordena las zonas del diagrama.

## Qué preguntar y qué no

Al terminar esta fase ya sabes qué hace el sistema. Lo que sigue faltando es lo que solo el equipo sabe: cómo se llaman los recursos que ya existen, en qué región van, quién es dueño de la red interna, qué se comparte entre ambientes y qué se decidió por costo.

Preguntar algo que estaba en el `README` cuesta credibilidad justo cuando la necesitas para que te crean los hallazgos.
