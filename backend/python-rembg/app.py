"""Serviço local do LookLoop para recortar peças de roupa com Rembg."""
import os
from io import BytesIO
from threading import Lock

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import Response
from PIL import Image, UnidentifiedImageError
from rembg import new_session, remove
from starlette.concurrency import run_in_threadpool

MODEL = os.getenv('REMBG_MODEL', 'isnet-general-use')
MAX_BYTES = 4 * 1024 * 1024
MAX_PIXELS = 24_000_000
app = FastAPI(title='LookLoop Rembg', docs_url=None, redoc_url=None)
_session = None
_session_lock = Lock()


def process(data: bytes) -> bytes:
    global _session
    # A validação evita aceitar arquivos arbitrários sob nome de imagem.
    try:
        with Image.open(BytesIO(data)) as image:
            if image.width * image.height > MAX_PIXELS:
                raise ValueError('Imagem com resolução excessiva.')
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError) as exc:
        raise ValueError('Imagem inválida ou com resolução excessiva.') from exc
    if _session is None:
        with _session_lock:
            if _session is None:
                _session = new_session(MODEL)
    return remove(data, session=_session, force_return_bytes=True)


@app.get('/health')
def health():
    return {'ok': True, 'model': MODEL}


@app.post('/remove')
async def remove_background(file: UploadFile = File(...)):
    if file.content_type not in ('image/png', 'image/jpeg', 'image/webp'):
        raise HTTPException(415, 'Use PNG, JPG ou WEBP.')
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise HTTPException(413, 'Imagem maior que 4 MB.')
    try:
        output = await run_in_threadpool(process, data)
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc
    return Response(content=output, media_type='image/png')
