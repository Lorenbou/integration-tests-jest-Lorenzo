import pactum from 'pactum';
import { StatusCodes } from 'http-status-codes';
import { SimpleReporter } from '../simple-reporter';
import { faker } from '@faker-js/faker';

describe('Restful API Dev', () => {
  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://api.restful-api.dev/objects';

  const nomeObjeto = faker.commerce.productName();
  const nomeAtualizado = `${faker.commerce.productName()} atualizado`;
  const nomeParcial = `${faker.commerce.productName()} parcial`;
  const ano = faker.number.int({ min: 2000, max: 2026 });
  const preco = Number(faker.commerce.price());
  const idInexistente = faker.string.alphanumeric(16);

  let objetoId = '';

  p.request.setDefaultTimeout(30000);

  beforeAll(() => p.reporter.add(rep));
  afterAll(() => p.reporter.end());

  describe('Consultas de objetos', () => {
    it('Deve listar todos os objetos cadastrados', async () => {
      await p
        .spec()
        .get(baseUrl)
        .expectStatus(StatusCodes.OK)
        .expectJsonSchema({
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name']
          }
        })
        .expectResponseTime(15000);
    });

    it('Deve filtrar objetos informando varios ids', async () => {
      await p
        .spec()
        .get(baseUrl)
        .withQueryParams('id', [1, 3])
        .expectStatus(StatusCodes.OK)
        .expectJsonLength(2)
        .expectJsonLike([{ id: '1' }, { id: '3' }]);
    });

    it('Nao deve encontrar objeto com id inexistente', async () => {
      await p
        .spec()
        .get(`${baseUrl}/${idInexistente}`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });
  });

  describe('Ciclo de vida de um objeto', () => {
    it('Deve cadastrar um novo objeto', async () => {
      objetoId = await p
        .spec()
        .post(baseUrl)
        .withJson({
          name: nomeObjeto,
          data: {
            ano: ano,
            preco: preco
          }
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          name: nomeObjeto,
          data: {
            ano: ano,
            preco: preco
          }
        })
        .expectJsonSchema({
          type: 'object',
          required: ['id', 'name', 'createdAt']
        })
        .returns('id');
    });

    it('Deve buscar o objeto recem cadastrado', async () => {
      await p
        .spec()
        .get(`${baseUrl}/${objetoId}`)
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: objetoId,
          name: nomeObjeto,
          data: {
            ano: ano,
            preco: preco
          }
        });
    });

    it('Deve atualizar o objeto por completo com PUT', async () => {
      await p
        .spec()
        .put(`${baseUrl}/${objetoId}`)
        .withJson({
          name: nomeAtualizado,
          data: {
            ano: ano + 1,
            preco: preco
          }
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: objetoId,
          name: nomeAtualizado,
          data: {
            ano: ano + 1
          }
        });
    });

    it('Deve atualizar apenas o nome do objeto com PATCH', async () => {
      await p
        .spec()
        .patch(`${baseUrl}/${objetoId}`)
        .withJson({
          name: nomeParcial
        })
        .expectStatus(StatusCodes.OK)
        .expectJsonLike({
          id: objetoId,
          name: nomeParcial,
          data: {
            ano: ano + 1
          }
        });
    });

    it('Deve remover o objeto cadastrado', async () => {
      await p
        .spec()
        .delete(`${baseUrl}/${objetoId}`)
        .expectStatus(StatusCodes.OK)
        .expectBodyContains('has been deleted');
    });

    it('Nao deve encontrar o objeto apos a remocao', async () => {
      await p
        .spec()
        .get(`${baseUrl}/${objetoId}`)
        .expectStatus(StatusCodes.NOT_FOUND);
    });
  });
});
