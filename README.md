# Ticket Sales API

API REST para criação, gerenciamento e venda de ingressos de eventos, intermediada por parceiros (organizadores de eventos) e consumida por clientes finais.

**Stack:** Node.js · TypeScript · Express 5 · MySQL (mysql2) · JWT · bcrypt · Docker

---

## Sumário

- [Instalação](#instalação)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Endpoints da API](#endpoints-da-api)
- [Exemplos de Requisição](#exemplos-de-requisição)
- [Fluxo do Sistema](#fluxo-do-sistema)
- [Segurança](#segurança)
- [Melhorias Futuras](#melhorias-futuras)
- [Autor](#autor)
- [Licença](#licença)

---

## Instalação

### 1. Clone do repositório

```bash
git clone https://github.com/ivan-teotonio/ticket-sales-api.git
cd ticket-sales-api
```

### 2. Instalação das dependências

```bash
npm install
```

Principais dependências: `express`, `mysql2`, `jsonwebtoken`, `bcrypt`, `dotenv`.
Dependências de desenvolvimento: `typescript`, `tsx`, `ts-node`, `@types/*`.

### 3. Configuração do `.env`

Copie o arquivo de exemplo e preencha os valores:

```bash
cp .env.example .env
```

> ⚠️ **Atenção:** existe uma divergência de nomenclatura entre os arquivos do projeto que precisa ser observada ao configurar o ambiente:
> - O `.env.example` (e o `docker-compose.yml`, na substituição de variáveis do host) usa o prefixo **`DB_*`** (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).
> - O código-fonte (`database.ts`) lê diretamente as variáveis com prefixo **`MYSQL_*`** (`MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`).
>
> Quando a aplicação roda via **Docker Compose**, o próprio `docker-compose.yml` faz essa tradução (lê `DB_*` do `.env` do host e injeta como `MYSQL_*` dentro do container `node`), então tudo funciona automaticamente.
> Porém, ao rodar a aplicação **localmente sem Docker** (`npm run dev` / `npm start`), é o arquivo `.env` que é carregado diretamente pelo processo Node — portanto, nesse cenário, as variáveis precisam estar nomeadas como `MYSQL_*` para que `database.ts` consiga lê-las. Recomenda-se padronizar essa nomenclatura (ver [Melhorias Futuras](#melhorias-futuras)).

### 4. Docker

O projeto inclui `Dockerfile` e `docker-compose.yml`, subindo dois serviços:

- **node**: build da aplicação a partir do `Dockerfile` (`node:21.7.1-slim`), exposta na porta `8080` do host (mapeada para `3000` no container).
- **mysql**: `mysql:8.0.30-debian`, exposta na porta `33060` do host (mapeada para `3306` no container), com healthcheck via `mysqladmin ping`.

Para subir o ambiente completo:

```bash
docker-compose up --build
```

O serviço `node` aguarda o `mysql` estar saudável (`condition: service_healthy`) antes de iniciar.

### 5. Banco de dados

O schema está definido em `db.sql` e é executado **automaticamente** na primeira inicialização do container MySQL, via `docker-entrypoint-initdb.d`.

Principais tabelas: `users`, `partners`, `customers`, `events`, `tickets`, `purchases`, `purchase_tickets`, `reservation_tickets`.

Caso não esteja usando Docker, execute o script manualmente em uma instância MySQL 8 já em execução:

```bash
mysql -u <usuario> -p < db.sql
```

### 6. Comandos de execução

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa em modo desenvolvimento com hot-reload (`tsx watch`), carregando `.env` |
| `npm run build` | Compila o TypeScript para `dist/` |
| `npm start` | Executa a versão compilada (`dist/app.js`), carregando `.env` |
| `docker-compose up --build` | Sobe aplicação + banco de dados via Docker |

Ao iniciar, a aplicação **trunca todas as tabelas** (`app.ts`, no callback do `app.listen`) antes de exibir a mensagem de servidor rodando — ou seja, o banco é reiniciado (zerado) a cada subida da aplicação. Isso é relevante para ambientes de desenvolvimento/teste e deve ser levado em conta antes de usar em produção.

---

## Variáveis de Ambiente

| Variável | Descrição |
|---|---|
| `PORT` | Porta em que o servidor Express escuta (padrão `3000`) |
| `NODE_ENV` | Ambiente de execução (`development`, `production`, etc.) |
| `DB_HOST` / `MYSQL_HOST` | Host do banco de dados MySQL |
| `DB_PORT` / `MYSQL_PORT` | Porta do banco de dados MySQL |
| `DB_NAME` / `MYSQL_DATABASE` | Nome do banco de dados |
| `DB_USER` / `MYSQL_USER` | Usuário de acesso ao banco de dados |
| `DB_PASSWORD` / `MYSQL_PASSWORD` | Senha de acesso ao banco de dados |
| `JWT_SECRET` | Chave secreta usada para assinar e validar os tokens JWT |
| `JWT_EXPIRES_IN` | Tempo de expiração do token JWT |

> Ver observação sobre a nomenclatura `DB_*` vs `MYSQL_*` na seção [Instalação](#configuração-do-env).

---

## Endpoints da API

| Método | Rota | Descrição | Autenticação |
|---|---|---|---|
| POST | `/auth/login` | Autentica um usuário (parceiro ou cliente) e retorna um token JWT | Não |
| POST | `/partners/register` | Registra um novo parceiro | Não |
| POST | `/partners/events` | Cria um evento vinculado ao parceiro autenticado | Sim (JWT) |
| GET | `/partners/events` | Lista os eventos do parceiro autenticado | Sim (JWT) |
| GET | `/partners/events/:eventId` | Detalha um evento específico do parceiro autenticado | Sim (JWT) |
| POST | `/customers/register` | Registra um novo cliente | Não |
| GET | `/events` | Lista todos os eventos disponíveis | Não |
| GET | `/events/:eventId` | Detalha um evento específico | Não* |
| POST | `/events/:eventId/tickets` | Cria tickets em lote para um evento (somente o parceiro dono do evento) | Sim (JWT) |
| GET | `/events/:eventId/tickets` | Lista os tickets de um evento | Não* |
| GET | `/events/:eventId/tickets/:ticketId` | Detalha um ticket específico | Não* |
| POST | `/purchases` | Realiza a compra de um ou mais tickets | Sim (JWT + ser cliente) |

\* **Observação sobre o middleware de autenticação:** o middleware global (`app.ts`) libera requisições comparando `método + prefixo da rota` contra uma lista de rotas públicas, e um dos itens dessa lista é `{ method: "GET", path: "/events" }`. Como a checagem usa `startsWith`, **qualquer requisição `GET` cujo caminho comece com `/events` é tratada como pública** — isso inclui `/events/:eventId`, `/events/:eventId/tickets` e `/events/:eventId/tickets/:ticketId`, mesmo não estando esses caminhos listados individualmente. Isso é intencional para consulta pública de eventos e tickets disponíveis, mas vale registrar o comportamento explicitamente (ver [Melhorias Futuras](#melhorias-futuras)).

Regras de autorização adicionais (aplicadas nos controllers, além do JWT):
- Em `/partners/events*`, o usuário autenticado precisa estar vinculado a um registro de `partners` (senão retorna `403 Not authorized`).
- Em `/events/:eventId/tickets` (POST), o mesmo vínculo de parceiro é exigido.
- Em `/purchases`, o usuário autenticado precisa estar vinculado a um registro de `customers` (senão retorna `400 User needs be a customer`).

---

## Exemplos de Requisição

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "partner1@user.com",
  "password": "secret"
}
```

Resposta (`200 OK`):
```json
{
  "token": "<jwt_token>"
}
```

### Registro de parceiro

```http
POST /partners/register
Content-Type: application/json

{
  "name": "Partner 1",
  "email": "partner1@user.com",
  "password": "secret",
  "company_name": "Company Name 1"
}
```

### Registro de cliente

```http
POST /customers/register
Content-Type: application/json

{
  "name": "Customer 1",
  "email": "customer1@user.com",
  "password": "secret",
  "address": "Rua Exemplo, 123",
  "phone": "333333333"
}
```

### Criação de evento (parceiro autenticado)

```http
POST /partners/events
Content-Type: application/json
Authorization: Bearer <token_do_parceiro>

{
  "name": "Evento teste 1",
  "description": "Descrição do evento",
  "date": "2025-01-01T00:00:00",
  "location": "Rua X, bairro etc."
}
```

Resposta (`201 Created`):
```json
{
  "id": 1,
  "name": "Evento teste 1",
  "description": "Descrição do evento",
  "location": "Rua X, bairro etc.",
  "date": "2025-01-01T00:00:00.000Z",
  "created_at": "2026-07-18T12:00:00.000Z",
  "partner_id": 1
}
```

### Criação de tickets em lote (parceiro autenticado)

```http
POST /events/1/tickets
Content-Type: application/json
Authorization: Bearer <token_do_parceiro>

{
  "num_tickets": 10,
  "price": 100.00
}
```

Resposta: `204 No Content`.

### Listagem de eventos (pública)

```http
GET /events
```

### Compra de tickets (cliente autenticado)

```http
POST /purchases
Content-Type: application/json
Authorization: Bearer <token_do_cliente>

{
  "ticket_ids": [1],
  "card_token": "tok_visa"
}
```

Resposta (`201 Created`):
```json
{
  "id": 1,
  "customer_id": 1,
  "purchase_date": "2026-07-18T12:00:00.000Z",
  "total_amount": 100.00,
  "status": "paid"
}
```

---

## Fluxo do Sistema

1. **Parceiro** se registra (`POST /partners/register`) e faz login (`POST /auth/login`), recebendo um token JWT.
2. Com o token, o parceiro cria um **evento** (`POST /partners/events`) e, em seguida, cria os **tickets** em lote para esse evento (`POST /events/:eventId/tickets`), que nascem com status `available`.
3. **Clientes** se registram (`POST /customers/register`) e fazem login, recebendo seu próprio token JWT.
4. Eventos e tickets disponíveis podem ser consultados publicamente (`GET /events`, `GET /events/:eventId/tickets`), sem necessidade de autenticação.
5. O cliente autenticado realiza a **compra** de um ou mais tickets (`POST /purchases`), informando os `ticket_ids` e um `card_token`. A criação da compra é delegada a um `PurchaseService` (que utiliza um `PaymentService` para o processamento do pagamento) — implementação não incluída nos arquivos analisados.
6. Segundo os requisitos do sistema (`requisitos-sistema.md`), apenas um cliente pode comprar um ticket específico por vez (controle de concorrência), falhas de compra devem ser registradas com o motivo, e compras podem ser canceladas liberando os tickets. **No código-fonte analisado, apenas a criação da compra (`POST /purchases`) está implementada** — os endpoints de cancelamento e histórico de compras previstos nos requisitos não foram encontrados (ver [Melhorias Futuras](#melhorias-futuras)).
7. O modelo de dados também contempla reservas de tickets (`reservation_tickets` / `ReservationTicketModel`), mas nenhum endpoint expõe essa funcionalidade nos arquivos analisados.

---

## Segurança

- **Autenticação:** baseada em **JWT** (`jsonwebtoken`). O login (`POST /auth/login`) retorna um token que deve ser enviado nas requisições protegidas via header `Authorization: Bearer <token>`. Um middleware global (`app.ts`) valida o token (`jwt.verify`) e carrega o usuário correspondente antes de liberar o acesso às rotas protegidas.
- **Autorização:** além da autenticação, alguns endpoints verificam se o usuário autenticado possui um registro vinculado de `partner` ou `customer` (ex.: apenas o parceiro dono de um evento pode gerenciar seus tickets), retornando `403`/`400` quando não autorizado.
- **Criptografia de senha:** as senhas são armazenadas com hash usando **bcrypt** (`bcrypt.hashSync` com fator de custo `10`), implementado em `UserModel`. A comparação no login é feita via `bcrypt.compareSync`.
- **Proteção contra SQL Injection:** todas as queries observadas nos models usam **prepared statements** (`db.execute` do `mysql2`, com parâmetros `?`), evitando concatenação direta de valores nas queries SQL.
- **Segredos fora do versionamento:** o `.gitignore` exclui `.env` e `node_modules` do controle de versão.
- **Validação de entrada:** nos controllers analisados, os dados recebidos no `req.body` são desestruturados e utilizados diretamente, sem uma camada explícita de validação de schema (ex.: Zod, Joi, class-validator). Recomenda-se avaliar a adição dessa camada (ver [Melhorias Futuras](#melhorias-futuras)).

### Testes

Não há testes automatizados implementados no momento — o script `test` do `package.json` é apenas um placeholder (`echo "Error: no test specified" && exit 1`). Os testes ficaram definidos como uma melhoria futura. Atualmente, a validação manual dos endpoints é feita através do arquivo `api.http` (compatível com a extensão *REST Client*, do VS Code).

---

## Melhorias Futuras

- Implementar testes automatizados (unitários e de integração).
- Implementar os endpoints de **cancelamento de compra** e **histórico de compras** do cliente, previstos em `requisitos-sistema.md` mas ainda não encontrados no código.
- Expor endpoints para o fluxo de **reserva de tickets** (`reservation_tickets`), cuja modelagem de dados já existe (`ReservationTicketModel`).
- Adicionar endpoint para o parceiro visualizar as **vendas de tickets** por evento, mencionado nos requisitos de negócio.
- Adicionar camada de validação de schema nas rotas (ex.: Zod ou Joi).
- Revisar o tratamento de respostas HTTP em alguns controllers para garantir `return` após respostas de erro, evitando o envio de múltiplas respostas na mesma requisição.
- Padronizar a nomenclatura das variáveis de ambiente entre `.env.example`, `docker-compose.yml` e o código-fonte (`DB_*` vs `MYSQL_*`).
- Reavaliar a rotina de truncar todas as tabelas a cada início da aplicação (`app.ts`), especialmente antes de qualquer uso em produção.
- Definir uma licença formal para o projeto.

---

## Autor

**Ivan Teotônio Acioli Junior**
GitHub: [github.com/ivan-teotonio](https://github.com/ivan-teotonio)

---

## Licença

Este projeto ainda não possui uma licença formalmente definida. Na ausência de uma licença explícita, aplicam-se os direitos autorais padrão (todos os direitos reservados ao autor).
