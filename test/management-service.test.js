'use strict';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const ManagementService = require('../lib/management-service');
const OAuth2Issuer = require('../lib/oauth2-issuer');
const OAuth2Service = require('../lib/oauth2-service');
const testKeys = require('./keys');

describe('Management service for OAuth 2 service', () => {
  let service;
  let authService;

  beforeAll(async () => {
    const issuer = new OAuth2Issuer();
    issuer.url = 'https://issuer.example.com';
    await issuer.keys.add(testKeys.get('test-rsa-key.json'));
    authService = new OAuth2Service(issuer);

    service = new ManagementService(authService);
  });

  it('should be able to set/unset sub in userinfo', async () => {
    async function expectSub(username) {
      const res = await request(authService.requestHandler)
        .get('/userinfo')
        .expect(200);

      expect(res.body).toMatchObject({
        sub: username,
      });
    }

    await expectSub('johndoe');

    const actualPost = await request(service.requestHandler)
      .post('/sub')
      .set('Accept', 'application/json')
      .send({ username: 'tamas' })
      .expect(200);

    expect(actualPost.body)
      .toMatchObject({
        status: 'ok',
        message: 'Username tamas is set',
      });

    await expectSub('tamas');

    const actualDelete = await request(service.requestHandler)
      .delete('/sub')
      .set('Accept', 'application/json')
      .expect(200);

    expect(actualDelete.body)
      .toMatchObject({
        status: 'ok',
        message: 'Username tamas is unset',
      });

    await expectSub('johndoe');
  });

  it('should be able to set/unset sub in access_token', async () => {
    async function expectSub(subject) {
      const res = await request(authService.requestHandler)
        .post('/token')
        .type('form')
        .set('authorization', `Basic ${Buffer.from('dummy_client_id:dummy_client_secret')
          .toString('base64')}`)
        .send({
          grant_type: 'authorization_code',
          code: '6b575dd1-2c3b-4284-81b1-e281138cdbbd',
          redirect_uri: 'https://example.com/callback',
        })
        .expect(200);

      expect(res.body)
        .toMatchObject({
          access_token: expect.any(String),
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'dummy',
          id_token: expect.any(String),
          refresh_token: expect.any(String),
        });

      const key = authService.issuer.keys.get('test-rsa-key');

      const decoded = jwt.verify(res.body.access_token, key.toPEM(false));

      expect(decoded)
        .toMatchObject({
          iss: authService.issuer.url,
          scope: 'dummy',
          sub: subject,
          amr: ['pwd'],
        });
    }

    expectSub('johndoe');

    const actualPost = await request(service.requestHandler)
      .post('/sub')
      .set('Accept', 'application/json')
      .send({ username: 'janedoe' })
      .expect(200);

    expect(actualPost.body)
      .toMatchObject({
        status: 'ok',
        message: 'Username janedoe is set',
      });

    expectSub('janedoe');

    const actualDelete = await request(service.requestHandler)
      .delete('/sub')
      .set('Accept', 'application/json')
      .expect(200);

    expect(actualDelete.body)
      .toMatchObject({
        status: 'ok',
        message: 'Username janedoe is unset',
      });

    expectSub('johndoe');
  });
});
