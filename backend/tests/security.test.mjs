import test from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword,verifyPassword,newToken,tokenHash,readToken,cookieName,cookieOptions} from '../src/security.ts';
test('senhas usam scrypt com sal e comparação correta',async()=>{
  const a=await hashPassword('MinhaSenhaMuitoForte!');
  const b=await hashPassword('MinhaSenhaMuitoForte!');
  assert.notEqual(a,b);
  assert.equal(await verifyPassword('MinhaSenhaMuitoForte!',a),true);
  assert.equal(await verifyPassword('OutraSenha',a),false);
  assert.equal(await verifyPassword('abc','texto-falso'),false);
});
test('tokens de sessão não são armazenados em texto puro',()=>{
  const token=newToken();assert.match(token,/^[a-f0-9]{64}$/);
  assert.notEqual(tokenHash(token),token);
  assert.equal(readToken(`other=123; ${cookieName}=${token}`),token);
  assert.equal(readToken(`${cookieName}=invalido`),null);
});
test('cookie de sessão é HttpOnly e SameSite Lax',()=>{
  const o=cookieOptions(false);assert.equal(o.httpOnly,true);assert.equal(o.sameSite,'lax');assert.equal(o.secure,false);
});
