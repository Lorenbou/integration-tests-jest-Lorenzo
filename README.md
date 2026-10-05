# API test automation with Jest and PactumJS

> Simple integration between JestJS and PactumJS.

## GitHub Actions

[![Node.js CI](https://github.com/Lorenbou/integration-tests-jest-Lorenzo/actions/workflows/node.js.yml/badge.svg?branch=master)](https://github.com/Lorenbou/integration-tests-jest-Lorenzo/actions/workflows/node.js.yml)

## SonarCloud

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Lorenbou_integration-tests-jest-Lorenzo&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Lorenbou_integration-tests-jest-Lorenzo)

# Getting Started

### Pactum docs:

- [PactumJS](https://pactumjs.github.io/)

### Prerequisites:

- NodeJS `v22`

### How to run?

Inside of the project folder run:

1.  `npm install --save-dev`
1.  `npm run ci`

After that you should see a `./output` folder with some `HTML` reports.

### Docs to Api under tests:

- [Dummyjson](https://dummyjson.com/docs)
- [Gorest](https://gorest.co.in/)
- [Toolshop API](https://api.practicesoftwaretesting.com/api/documentation)
- [Deck of Cards](https://deckofcardsapi.com/)
- [JSON placeholder](https://jsonplaceholder.typicode.com/)
- [http bin](http://httpbin.org/)
- [rick and morty api](https://rickandmortyapi.com/documentation/#rest)
- [Petstore](https://petstore.swagger.io/#/)
- [ServeRest](https://serverest.dev/#/)
- [ServeRest - Datadog](https://p.datadoghq.eu/sb/421fcfee-35ec-11ee-b87f-da7ad0900005-2aaf85264a89d11b7001bcab452a266e?refresh_mode=sliding&theme=light&tpl_var_env%5B0%5D=serverest.dev&from_ts=1699931511294&to_ts=1699932411294&live=true)
- [Restful API Dev](https://restful-api.dev/)

# Descrição dos testes

## API sob teste: Restful API Dev

Arquivo: [`test/restful_api_dev.spec.ts`](test/restful_api_dev.spec.ts)

A [Restful API Dev](https://restful-api.dev/) expõe um CRUD completo de objetos
genéricos em `https://api.restful-api.dev/objects`. Não exige autenticação e
**persiste** os dados gravados, o que permite validar o ciclo de vida inteiro de
um recurso: criar, consultar, atualizar e remover.

Cada objeto tem a forma `{ id, name, data }`, onde `data` é um mapa livre de
atributos. Os dados enviados são gerados dinamicamente com `@faker-js/faker`,
de modo que a suíte pode ser reexecutada no CI quantas vezes for necessário sem
colidir com execuções anteriores.

### Cenários

Os testes estão divididos em dois blocos.

**Consultas de objetos** — verificam a leitura sem alterar estado.

| #   | Cenário                                      | O que valida                                                                                                                                                                  |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Deve listar todos os objetos cadastrados     | `200` e o contrato da resposta via `expectJsonSchema`, garantindo um array cujos itens têm `id` e `name`. Também impõe um teto de tempo de resposta com `expectResponseTime`. |
| 2   | Deve filtrar objetos informando varios ids   | O filtro por query string `?id=1&id=3` retorna exatamente 2 registros (`expectJsonLength`) e são os ids pedidos.                                                              |
| 3   | Nao deve encontrar objeto com id inexistente | Cenário negativo: um id aleatório retorna `404`.                                                                                                                              |

**Ciclo de vida de um objeto** — executados em sequência, encadeados pelo `id`
capturado na criação com `returns('id')`.

| #   | Cenário                                          | O que valida                                                                                                            |
| --- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| 4   | Deve cadastrar um novo objeto                    | `POST` retorna `200`, o corpo ecoa os dados enviados (`expectJsonLike`) e traz `id` e `createdAt` (`expectJsonSchema`). |
| 5   | Deve buscar o objeto recem cadastrado            | Confirma que a escrita **persistiu**: o `GET` no id devolve os mesmos dados do `POST`.                                  |
| 6   | Deve atualizar o objeto por completo com PUT     | Substituição total do recurso; o nome e o ano passam a refletir os novos valores.                                       |
| 7   | Deve atualizar apenas o nome do objeto com PATCH | Atualização parcial: só o `name` é enviado, e o teste prova que o bloco `data` do passo anterior foi preservado.        |
| 8   | Deve remover o objeto cadastrado                 | `DELETE` retorna `200` e a mensagem de confirmação (`expectBodyContains`).                                              |
| 9   | Nao deve encontrar o objeto apos a remocao       | Fecha o ciclo: o mesmo id agora retorna `404`.                                                                          |

### Recursos do PactumJS utilizados

- `withJson` / `withQueryParams` para montar as requisições
- `returns('id')` para encadear o recurso criado entre os cenários
- `expectStatus` com as constantes de `http-status-codes`
- `expectJsonSchema` para validar o contrato da resposta
- `expectJsonLike` para asserção parcial do corpo
- `expectJsonLength` para o tamanho da coleção filtrada
- `expectBodyContains` para a mensagem de remoção
- `expectResponseTime` para o limite de performance
- `SimpleReporter` plugado via `p.reporter.add`, anexando request e response de
  cada spec ao relatório HTML

## Observação sobre a suíte ServeRest no CI

A suíte [`test/serve_rest.spec.ts`](test/serve_rest.spec.ts) é **ignorada apenas
quando roda no GitHub Actions**, e continua executando normalmente em ambiente
local.

Motivo: a `serverest.dev` aplica rate limit por IP. Os runners do GitHub Actions
operam em faixas de IP compartilhadas e, sob carga, a API passa a recusar as
requisições. Como essa suíte cadastra um usuário no `beforeAll` e autentica no
`beforeEach`, a recusa derruba os 9 cenários em cascata — mesmo com a API no ar.
O mesmo efeito é reproduzível localmente após algumas execuções seguidas.

O controle é feito em uma linha no topo do arquivo:

```ts
const describeServeRest = process.env.CI ? describe.skip : describe;
```

Nenhum cenário foi removido: rodando `npm test` na máquina local, as 9 suítes e
os 43 testes são executados.
