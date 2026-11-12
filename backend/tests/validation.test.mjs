import test from 'node:test';
import assert from 'node:assert/strict';
import { validateClothing, validateOutfit, validateProfile, uuid, validEmail } from '../src/validation.ts';
const id='b61f5e4f-fda3-4e0b-8f74-758756586f20';
const item={name:'Camiseta rosa',category:'tops',color:'Rosa',hex:'#f0ccee',season:'Todas',occasion:'Casual',style:'Básico'};
const look={name:'Faculdade',occasion:'Faculdade',notes:'',itemIds:[id,'ec7b29c8-c5f7-4c6d-86fa-c704317f3b99']};
test('validação de identificadores e e-mails',()=>{
  assert.equal(uuid(id),true);assert.equal(uuid('../etc/passwd'),false);
  assert.equal(validEmail('exemplo@email.com'),true);assert.equal(validEmail('incorreto'),false);
});
test('aceita peça completa válida e edição parcial',()=>{
  assert.equal(validateClothing(item),null);assert.equal(validateClothing({favorite:true},true),null);
  assert.equal(validateClothing({imageId:null},true),null);
});
test('bloqueia valores e campos inesperados em roupas',()=>{
  assert.match(validateClothing({...item,category:'forged'})??'',/category/);
  assert.match(validateClothing({...item,image:'data:image/png;base64,X'})??'',/image/);
  assert.match(validateClothing({...item,imageId:'../hidden'})??'',/imageId/);
  assert.match(validateClothing({...item,hex:'#xyz'})??'',/hex/);
  assert.match(validateClothing({...item,name:undefined})??'',/name/);
});
test('looks exigem pelo menos duas peças distintas',()=>{
  assert.equal(validateOutfit(look),null);
  assert.match(validateOutfit({...look,itemIds:[id,id]})??'',/itemIds/);
  assert.match(validateOutfit({...look,itemIds:[id]})??'',/itemIds/);
  assert.equal(validateOutfit({favorite:true},true),null);
});
test('perfil permite personalização mas não senhas via PATCH',()=>{
  assert.equal(validateProfile({wardrobeName:'Meu armário',accent:'lilac',dailyInspiration:true}),null);
  assert.match(validateProfile({password:'senha'})??'',/password/);
  assert.match(validateProfile({avatar:'https://evil.com/avatar.png'})??'',/avatar/);
});
