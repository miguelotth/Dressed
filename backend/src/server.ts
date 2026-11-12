import express, { type Request, type Response, type NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { config } from './config.js';
import { pool } from './db.js';
import { cookieName, cookieOptions, hashPassword, newToken, readToken, sessionMs, tokenHash, verifyPassword } from './security.js';
import { uuid, validEmail, validateClothing, validateOutfit, validateProfile } from './validation.js';
import type { PoolClient } from 'pg';

const app=express();
app.disable('x-powered-by');
app.set('trust proxy', false); // Só configure proxy confiável ao fazer deploy
app.use((req,res,next)=>{
  res.set('X-Content-Type-Options','nosniff');
  res.set('Cache-Control','no-store');
  res.set('Referrer-Policy','no-referrer');
  res.set('X-Frame-Options','DENY');
  res.set('Vary','Origin');
  const origin=req.get('Origin');
  if(origin === config.webOrigin){
    res.set('Access-Control-Allow-Origin',config.webOrigin);
    res.set('Access-Control-Allow-Credentials','true');
    res.set('Access-Control-Allow-Headers','Content-Type');
    res.set('Access-Control-Allow-Methods','GET,POST,PATCH,DELETE,OPTIONS');
  }
  if(req.method==='OPTIONS') return res.sendStatus(origin === config.webOrigin ? 204 : 403);
  if(!['GET','HEAD','OPTIONS'].includes(req.method)){
    if((origin && origin !== config.webOrigin) || req.get('Sec-Fetch-Site')==='cross-site') return res.status(403).json({error:'Origem não autorizada.'});
  }
  next();
});
app.use(express.json({limit:'512kb'})); // Avatares pequenos em base64 são aceitos em PATCH /api/profile.
const fail=(res:Response,message:string,status=400)=>res.status(status).json({error:message});
const limitLogin=rateLimit({windowMs:15*60_000,limit:12,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Muitas tentativas. Tente novamente mais tarde.'}});
const limitRegister=rateLimit({windowMs:60*60_000,limit:10,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Muitos cadastros. Tente novamente mais tarde.'}});
const limitProcess=rateLimit({windowMs:15*60_000,limit:16,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Limite temporário de processamento de imagens.'}});

type UserRow = {
  id:string; name:string; email:string; password_hash:string; wardrobe_name:string; accent:string;
  daily_inspiration:boolean; styling_tips:boolean; email_updates:boolean; avatar:string|null;
};
type ItemRow = { id:string;name:string;category:string;color:string;hex:string;season:string;occasion:string;style:string;favorite:boolean;created_at:Date;image_id:string|null };
type OutfitRow = {id:string;name:string;occasion:string;notes:string;favorite:boolean;created_at:Date};
type ImageRow={id:string;user_id:string;stored_name:string;original_name:string;mime_type:string;is_processed:boolean;source_image_id:string|null};
const currentUser=(res:Response)=>res.locals.user as UserRow;
const publicUser=(u:UserRow)=>({id:u.id,name:u.name,email:u.email});
const publicProfile=(u:UserRow)=>({name:u.name,email:u.email,wardrobeName:u.wardrobe_name,accent:u.accent,dailyInspiration:u.daily_inspiration,stylingTips:u.styling_tips,emailUpdates:u.email_updates,avatar:u.avatar??undefined});
const imageUrl=(id:string|null)=>id?`/api/images/${id}`:undefined;
const publicItem=(i:ItemRow)=>({id:i.id,name:i.name,category:i.category,color:i.color,hex:i.hex,season:i.season,occasion:i.occasion,style:i.style,favorite:i.favorite,image:imageUrl(i.image_id),imageId:i.image_id,createdAt:new Date(i.created_at).toISOString()});
const publicOutfit=(o:OutfitRow,itemIds:string[])=>({id:o.id,name:o.name,occasion:o.occasion,notes:o.notes,favorite:o.favorite,itemIds,createdAt:new Date(o.created_at).toISOString()});

async function createSession(res:Response,id:string){
  const token=newToken();
  await pool.query(`INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)`,[tokenHash(token),id,new Date(Date.now()+sessionMs)]);
  res.cookie(cookieName,token,cookieOptions(config.cookieSecure));
}
async function auth(req:Request,res:Response,next:NextFunction){
  try {
    const token=readToken(req.headers.cookie);
    if(!token) return void fail(res,'Entre na sua conta para continuar.',401);
    const {rows}=await pool.query<UserRow>(`SELECT u.* FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at>now()`,[tokenHash(token)]);
    if(!rows[0]) {
      res.clearCookie(cookieName,{path:'/',sameSite:'lax',secure:config.cookieSecure});
      return void fail(res,'Sua sessão expirou. Faça login novamente.',401);
    }
    res.locals.user=rows[0];next();
  } catch(e){next(e)}
}
app.get('/api/health',async(_req,res)=>{
  await pool.query('SELECT 1');
  res.json({ok:true,service:'lookloop-api',database:'online'});
});
app.post('/api/auth/register',limitRegister,async(req,res)=>{
  const {name,email,password}=req.body??{};
  if(typeof name!=='string'||name.trim().length<2||name.trim().length>60||!validEmail(email)||typeof password!=='string'||password.length<10||password.length>128) return void fail(res,'Informe nome (2–60 caracteres), e-mail e senha (10–128 caracteres).');
  const mail=email.trim().toLowerCase(); const hash=await hashPassword(password);const id=randomUUID();
  try {await pool.query('INSERT INTO users(id,name,email,password_hash) VALUES ($1,$2,$3,$4)',[id,name.trim(),mail,hash]);}
  catch(e){if((e as {code?:string}).code==='23505')return void fail(res,'Este e-mail já está cadastrado.',409);throw e;}
  await createSession(res,id);
  res.status(201).json({user:{id,name:name.trim(),email:mail}});
});
app.post('/api/auth/login',limitLogin,async(req,res)=>{
  const {email,password}=req.body??{};
  if(!validEmail(email)||typeof password!=='string'||password.length>128) return void fail(res,'E-mail ou senha incorretos.',401);
  const {rows}=await pool.query<UserRow>('SELECT * FROM users WHERE lower(email)=$1',[email.trim().toLowerCase()]);
  if(!rows[0] || !await verifyPassword(password,rows[0].password_hash)) return void fail(res,'E-mail ou senha incorretos.',401);
  await createSession(res,rows[0].id);
  res.json({user:publicUser(rows[0])});
});
app.get('/api/auth/me',auth,(_req,res)=>res.json({user:publicUser(currentUser(res))}));
app.post('/api/auth/logout',async(req,res)=>{
  const token=readToken(req.headers.cookie);
  if(token)await pool.query('DELETE FROM sessions WHERE token_hash=$1',[tokenHash(token)]);
  res.clearCookie(cookieName,{path:'/',sameSite:'lax',secure:config.cookieSecure});
  res.json({ok:true});
});

async function allOutfits(userId:string){
  const {rows}=await pool.query<OutfitRow&{item_ids:string[]}>(`SELECT o.*, COALESCE(array_agg(oi.clothing_id ORDER BY oi.sort_order) FILTER (WHERE oi.clothing_id IS NOT NULL), ARRAY[]::uuid[]) AS item_ids
      FROM outfits o LEFT JOIN outfit_items oi ON oi.outfit_id=o.id WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,[userId]);
  return rows.map(o=>publicOutfit(o,o.item_ids));
}
async function allClothes(userId:string){
  const {rows}=await pool.query<ItemRow>('SELECT * FROM clothes WHERE user_id=$1 ORDER BY created_at DESC',[userId]);
  return rows.map(publicItem);
}
app.get('/api/closet',auth,async(_req,res)=>{
  const user=currentUser(res);const [clothes,outfits]=await Promise.all([allClothes(user.id),allOutfits(user.id)]);
  res.json({clothes,outfits,profile:publicProfile(user),demo:false});
});
app.get('/api/profile',auth,(_req,res)=>res.json({profile:publicProfile(currentUser(res))}));
app.patch('/api/profile',auth,async(req,res)=>{
  const issue=validateProfile(req.body);if(issue)return void fail(res,issue);
  const map:Record<string,string>={name:'name',email:'email',wardrobeName:'wardrobe_name',accent:'accent',dailyInspiration:'daily_inspiration',stylingTips:'styling_tips',emailUpdates:'email_updates',avatar:'avatar'};
  const entries=Object.entries(req.body as Record<string,unknown>);
  const sets=entries.map(([k],i)=>`${map[k]}=$${i+1}`);
  const values=entries.map(([k,v])=>k==='email'?String(v).trim().toLowerCase():typeof v==='string'&&k!=='avatar'?v.trim():v);
  try{
    const {rows}=await pool.query<UserRow>(`UPDATE users SET ${sets.join(',')} WHERE id=$${entries.length+1} RETURNING *`,[...values,currentUser(res).id]);
    res.json({profile:publicProfile(rows[0]!)});
  }catch(e){if((e as {code?:string}).code==='23505')return void fail(res,'E-mail já usado por outra conta.',409);throw e;}
});

// Imagens: até 4 MB, salvas no disco; no banco apenas os metadados e os IDs.
const uploader=multer({storage:multer.memoryStorage(),limits:{fileSize:4*1024*1024,files:1,fields:2},fileFilter:(_req,file,cb)=>{
  if(!['image/png','image/jpeg','image/webp'].includes(file.mimetype))return cb(new Error('Envie uma imagem PNG, JPG ou WEBP.'));
  cb(null,true);
}});
function sniffImage(buffer:Buffer):'image/png'|'image/jpeg'|'image/webp'|null{
  if(buffer.length>=8 && buffer.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')))return 'image/png';
  if(buffer.length>=3 && buffer.subarray(0,3).equals(Buffer.from('ffd8ff','hex')))return 'image/jpeg';
  if(buffer.length>=12 && buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')return 'image/webp';
  return null;
}
async function saveImage(userId:string,buffer:Buffer,mime:string,originalName:string,processed=false,sourceId:string|null=null){
  const id=randomUUID();const ext=mime==='image/png'?'png':mime==='image/jpeg'?'jpg':'webp';
  const filename=`${id}.${ext}`;
  await mkdir(config.uploadDir,{recursive:true});
  await writeFile(join(config.uploadDir,filename),buffer,{flag:'wx'});
  try{
    await pool.query(`INSERT INTO images(id,user_id,stored_name,original_name,mime_type,is_processed,source_image_id) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [id,userId,filename,originalName.slice(0,160),mime,processed,sourceId]);
  }catch(e){await unlink(join(config.uploadDir,filename)).catch(()=>{});throw e;}
  return {imageId:id,imageUrl:imageUrl(id),isProcessed:processed};
}
async function getOwnedImage(userId:string,id:string){
  const {rows}=await pool.query<ImageRow>('SELECT * FROM images WHERE id=$1 AND user_id=$2',[id,userId]);
  return rows[0];
}
async function consumeLimited(response:globalThis.Response,maxBytes:number):Promise<Buffer>{
  const length=Number(response.headers.get('content-length')??0);
  if(length>maxBytes)throw new Error('Resultado do Rembg excede o limite de tamanho.');
  if(!response.body)throw new Error('Serviço Rembg não retornou imagem.');
  const reader=response.body.getReader();const chunks:Buffer[]=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes)throw new Error('Resultado do Rembg excede o limite de tamanho.');chunks.push(Buffer.from(value));}}
  finally{await reader.cancel().catch(()=>{});}
  return Buffer.concat(chunks);
}
async function removeBackground(buffer:Buffer,mime:string):Promise<Buffer>{
  const data=new FormData();data.append('file',new Blob([new Uint8Array(buffer)],{type:mime}),'roupa');
  let response:globalThis.Response;
  try{
    response=await fetch(`${config.rembgUrl}/remove`,{method:'POST',body:data,signal:AbortSignal.timeout(config.rembgTimeout)});
  }catch(e){if((e as {name?:string}).name==='TimeoutError')throw new ServiceError('O Rembg demorou além do limite configurado.',504);
    throw new ServiceError('O serviço de remoção de fundo está indisponível. Inicie o Python Rembg.',503);}
  if(!response.ok)throw new ServiceError('O Rembg não conseguiu processar a foto. Tente outra imagem.',502);
  let output:Buffer;
  try{output=await consumeLimited(response,12*1024*1024);}catch{throw new ServiceError('O resultado do Rembg ultrapassou o limite permitido.',502);}
  if(sniffImage(output)!=='image/png')throw new ServiceError('O Rembg retornou uma imagem inesperada.',502);
  return output;
}
class ServiceError extends Error{constructor(message:string,public status=503){super(message);}}
app.post('/api/images/upload',auth,uploader.single('file'),async(req,res)=>{
  if(!req.file)return void fail(res,'Selecione uma imagem.');
  const mime=sniffImage(req.file.buffer);
  if(!mime||mime!==req.file.mimetype)return void fail(res,'Conteúdo do arquivo não corresponde a uma imagem válida.');
  const image=await saveImage(currentUser(res).id,req.file.buffer,mime,req.file.originalname);
  res.status(201).json(image);
});
app.post('/api/images/remove-background',auth,limitProcess,uploader.single('file'),async(req,res)=>{
  if(!req.file)return void fail(res,'Selecione uma imagem.');
  const mime=sniffImage(req.file.buffer);
  if(!mime||mime!==req.file.mimetype)return void fail(res,'Imagem inválida.');
  const output=await removeBackground(req.file.buffer,mime);
  const processed=await saveImage(currentUser(res).id,output,'image/png','lookloop-recorte.png',true);
  res.status(201).json(processed);
});
app.post('/api/images/:id/remove-background',auth,limitProcess,async(req,res)=>{
  const id=req.params.id;if(!uuid(id))return void fail(res,'ID inválido.');
  const image=await getOwnedImage(currentUser(res).id,id);
  if(!image)return void fail(res,'Imagem não encontrada.',404);
  if(image.is_processed)return void fail(res,'A imagem já foi processada.');
  const buffer=await readFile(join(config.uploadDir,image.stored_name));
  const output=await removeBackground(buffer,image.mime_type);
  const processed=await saveImage(currentUser(res).id,output,'image/png',`recorte-${image.original_name}`,true,id);
  res.status(201).json(processed);
});
app.get('/api/images/:id',auth,async(req,res,next)=>{
  const id=req.params.id;if(!uuid(id))return void fail(res,'ID inválido.');
  const image=await getOwnedImage(currentUser(res).id,id);
  if(!image)return void fail(res,'Imagem não encontrada.',404);
  res.type(image.mime_type).set('Content-Disposition','inline').set('Cache-Control','private, no-store');
  const stream=createReadStream(join(config.uploadDir,image.stored_name));
  stream.on('error',next);stream.pipe(res);
});
app.delete('/api/images/:id',auth,async(req,res)=>{
  const id=req.params.id;if(!uuid(id))return void fail(res,'ID inválido.');
  const image=await getOwnedImage(currentUser(res).id,id);
  if(!image)return void fail(res,'Imagem não encontrada.',404);
  const used=await pool.query('SELECT 1 FROM clothes WHERE image_id=$1 LIMIT 1',[id]);
  if(used.rowCount)return void fail(res,'Esta imagem está sendo usada por uma roupa.',409);
  await pool.query('DELETE FROM images WHERE id=$1 AND user_id=$2',[id,currentUser(res).id]);
  await unlink(join(config.uploadDir,image.stored_name)).catch(()=>{});
  res.json({ok:true});
});
async function ownerImage(userId:string,imageId:unknown){
  if(imageId===undefined||imageId===null)return true;
  if(!uuid(imageId))return false;
  return !!await getOwnedImage(userId,imageId);
}
const itemColumns:Record<string,string>={name:'name',category:'category',color:'color',hex:'hex',season:'season',occasion:'occasion',style:'style',favorite:'favorite',imageId:'image_id'};
app.get('/api/items',auth,async(_req,res)=>res.json({items:await allClothes(currentUser(res).id)}));
app.get('/api/items/:id',auth,async(req,res)=>{
  if(!uuid(req.params.id))return void fail(res,'ID inválido.');
  const {rows}=await pool.query<ItemRow>('SELECT * FROM clothes WHERE id=$1 AND user_id=$2',[req.params.id,currentUser(res).id]);
  if(!rows[0])return void fail(res,'Peça não encontrada.',404);
  res.json({item:publicItem(rows[0])});
});
app.post('/api/items',auth,async(req,res)=>{
  const issue=validateClothing(req.body);if(issue)return void fail(res,issue);
  const body=req.body as Record<string,any>;const userId=currentUser(res).id;
  if(!await ownerImage(userId,body.imageId))return void fail(res,'Imagem não pertence a esta conta.',403);
  const id=randomUUID();
  const {rows}=await pool.query<ItemRow>(`INSERT INTO clothes(id,user_id,name,category,color,hex,season,occasion,style,favorite,image_id)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [id,userId,body.name.trim(),body.category,body.color.trim(),body.hex,body.season,body.occasion,body.style.trim(),body.favorite??false,body.imageId??null]);
  res.status(201).json({item:publicItem(rows[0]!)});
});
app.patch('/api/items/:id',auth,async(req,res)=>{
  if(!uuid(req.params.id))return void fail(res,'ID inválido.');
  const issue=validateClothing(req.body,true);if(issue)return void fail(res,issue);
  if('imageId' in req.body && !await ownerImage(currentUser(res).id,req.body.imageId))return void fail(res,'Imagem não pertence a esta conta.',403);
  const pairs=Object.entries(req.body as Record<string,unknown>);
  const sql=pairs.map(([key],i)=>`${itemColumns[key]}=$${i+1}`).join(',');
  const values=pairs.map(([k,v])=>typeof v==='string' && ['name','color','style'].includes(k)?v.trim():v);
  const {rows}=await pool.query<ItemRow>(`UPDATE clothes SET ${sql} WHERE id=$${pairs.length+1} AND user_id=$${pairs.length+2} RETURNING *`,[...values,req.params.id,currentUser(res).id]);
  if(!rows[0])return void fail(res,'Peça não encontrada.',404);
  res.json({item:publicItem(rows[0])});
});
app.delete('/api/items/:id',auth,async(req,res)=>{
  if(!uuid(req.params.id))return void fail(res,'ID inválido.');
  const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const deleted=await client.query('DELETE FROM clothes WHERE id=$1 AND user_id=$2 RETURNING id',[req.params.id,currentUser(res).id]);
    if(!deleted.rowCount){await client.query('ROLLBACK');return void fail(res,'Peça não encontrada.',404);}
    await client.query(`DELETE FROM outfits o WHERE o.user_id=$1 AND (SELECT count(*) FROM outfit_items oi WHERE oi.outfit_id=o.id)<2`,[currentUser(res).id]);
    await client.query('COMMIT');res.json({ok:true});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
});

async function ensureOwnItems(client:PoolClient,userId:string,ids:string[]){
  const {rows}=await client.query('SELECT id FROM clothes WHERE user_id=$1 AND id=ANY($2::uuid[])',[userId,ids]);
  return rows.length===ids.length;
}
app.get('/api/outfits',auth,async(_req,res)=>res.json({outfits:await allOutfits(currentUser(res).id)}));
app.post('/api/outfits',auth,async(req,res)=>{
  const issue=validateOutfit(req.body);if(issue)return void fail(res,issue);
  const b=req.body as {name:string;occasion:string;notes:string;itemIds:string[];favorite?:boolean};const client=await pool.connect();
  try{
    await client.query('BEGIN');
    if(!await ensureOwnItems(client,currentUser(res).id,b.itemIds)){await client.query('ROLLBACK');return void fail(res,'Uma ou mais peças não pertencem a esta conta.',403);}
    const id=randomUUID();
    const {rows}=await client.query<OutfitRow>('INSERT INTO outfits(id,user_id,name,occasion,notes,favorite) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',[id,currentUser(res).id,b.name.trim(),b.occasion,b.notes.trim(),b.favorite??false]);
    for(const [index,itemId] of b.itemIds.entries())await client.query('INSERT INTO outfit_items(outfit_id,clothing_id,sort_order) VALUES($1,$2,$3)',[id,itemId,index]);
    await client.query('COMMIT');res.status(201).json({outfit:publicOutfit(rows[0]!,b.itemIds)});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
});
app.patch('/api/outfits/:id',auth,async(req,res)=>{
  if(!uuid(req.params.id))return void fail(res,'ID inválido.');
  const issue=validateOutfit(req.body,true);if(issue)return void fail(res,issue);
  const b=req.body as Record<string,any>;const client=await pool.connect();
  try{
    await client.query('BEGIN');
    const existing=await client.query('SELECT id FROM outfits WHERE id=$1 AND user_id=$2 FOR UPDATE',[req.params.id,currentUser(res).id]);
    if(!existing.rowCount){await client.query('ROLLBACK');return void fail(res,'Look não encontrado.',404);}
    if(b.itemIds && !await ensureOwnItems(client,currentUser(res).id,b.itemIds)){await client.query('ROLLBACK');return void fail(res,'Uma ou mais peças não pertencem a esta conta.',403);}
    const map:Record<string,string>={name:'name',occasion:'occasion',notes:'notes',favorite:'favorite'};
    const pairs=Object.entries(b).filter(([k])=>k in map);
    if(pairs.length){
      const columns=pairs.map(([k],i)=>`${map[k]}=$${i+1}`).join(',');
      const values=pairs.map(([k,v])=>typeof v==='string'?v.trim():v);
      await client.query(`UPDATE outfits SET ${columns} WHERE id=$${pairs.length+1} AND user_id=$${pairs.length+2}`,[...values,req.params.id,currentUser(res).id]);
    }
    if(b.itemIds){
      await client.query('DELETE FROM outfit_items WHERE outfit_id=$1',[req.params.id]);
      for(const [i,itemId] of (b.itemIds as string[]).entries())await client.query('INSERT INTO outfit_items(outfit_id,clothing_id,sort_order) VALUES($1,$2,$3)',[req.params.id,itemId,i]);
    }
    const {rows}=await client.query<OutfitRow>('SELECT * FROM outfits WHERE id=$1',[req.params.id]);
    const links=await client.query<{clothing_id:string}>('SELECT clothing_id FROM outfit_items WHERE outfit_id=$1 ORDER BY sort_order',[req.params.id]);
    await client.query('COMMIT');res.json({outfit:publicOutfit(rows[0]!,links.rows.map(r=>r.clothing_id))});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
});
app.delete('/api/outfits/:id',auth,async(req,res)=>{
  if(!uuid(req.params.id))return void fail(res,'ID inválido.');
  const result=await pool.query('DELETE FROM outfits WHERE id=$1 AND user_id=$2',[req.params.id,currentUser(res).id]);
  if(!result.rowCount)return void fail(res,'Look não encontrado.',404);
  res.json({ok:true});
});
app.post('/api/closet/clear',auth,async(_req,res)=>{
  const client=await pool.connect();
  try{await client.query('BEGIN');await client.query('DELETE FROM outfits WHERE user_id=$1',[currentUser(res).id]);await client.query('DELETE FROM clothes WHERE user_id=$1',[currentUser(res).id]);await client.query('COMMIT');res.json({ok:true});}
  catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
});
app.use('/api',(req,res)=>fail(res,`Rota não encontrada: ${req.method} ${req.path}`,404));
app.use((err:unknown,_req:Request,res:Response,next:NextFunction)=>{
  if(res.headersSent)return next(err);
  const error=err as {code?:string;name?:string;message?:string;status?:number;type?:string};
  if(error instanceof ServiceError)return void fail(res,error.message,error.status);
  if(error instanceof multer.MulterError){return void fail(res,error.code==='LIMIT_FILE_SIZE'?'A imagem excede 4 MB.': 'Erro no envio da imagem.',413);}
  if(error.message==='Envie uma imagem PNG, JPG ou WEBP.')return void fail(res,error.message);
  if(error.type==='entity.too.large')return void fail(res,'JSON excede o tamanho permitido.',413);
  if(error instanceof SyntaxError && 'body' in error)return void fail(res,'JSON inválido.');
  if((error as {code?:string}).code==='23505')return void fail(res,'Registro duplicado.',409);
  console.error('[LookLoop API]',error);
  return void fail(res,'Ocorreu um erro interno. Confira o terminal do backend.',500);
});

const server=app.listen(config.port,()=>console.log(`LookLoop API: http://localhost:${config.port}/api/health`));
function stop(){server.close(()=>void pool.end().finally(()=>process.exit(0)));}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
