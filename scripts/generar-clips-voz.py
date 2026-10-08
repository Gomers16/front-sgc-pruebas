"""Genera los 45 clips WAV de la locución del turnero (ver
src/views/turnero/composables/useClipsAnuncio.ts).

Voz: edge-tts es-CO-SalomeNeural a VELOCIDAD (+10 %: a la velocidad normal
sonaba pausada en la sala). Internet solo al generar, nunca en el TV.
La letra "a" sola la lee como preposición (0.19 s, casi muda), así que se
sintetiza dentro de "la vocal a." y se corta desde donde empieza esa palabra
(tiempos de WordBoundary de edge-tts) — ver CONTEXTO.
Cada clip: MP3 de edge-tts -> WAV mono 22050 Hz 16 bit, silencio recortado
al inicio y al final (dejando ~70 ms de aire) y nivel medio igualado a
NIVEL_MEDIO_DB con un limitador de picos. El silencio de arranque de la
locución y las pausas entre clips NO van en los clips: los pone el turnero al
pegarlos en un solo WAV (SILENCIO_*_MS en src/views/turnero/config/constantes.ts). Los MP3 intermedios van a una
carpeta temporal del sistema y se borran: nunca quedan en el repo.

Uso (desde la raíz del repo):
    python -m pip install edge-tts      # una vez; requiere ffmpeg en el PATH
    python scripts/generar-clips-voz.py

Los textos de modulo-N deben coincidir con MODULOS_TURNERO
(src/views/turnero/config/constantes.ts): si cambia un módulo allí, se
cambia aquí y se regenera.
"""

import asyncio
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import edge_tts

VOZ = 'es-CO-SalomeNeural'
VELOCIDAD = '+10%'  # parámetro rate de edge-tts
DESTINO = Path(__file__).resolve().parent.parent / 'src/views/turnero/assets/sonidos/voz'
NIVEL_MEDIO_DB = -16.0  # nivel medio (RMS) objetivo de cada clip
PICO_MAX = 0.89  # ~ -1 dBFS, límite del alimiter
AIRE_S = 0.07  # silencio que se conserva al inicio y al final
UMBRAL_SILENCIO = '-45dB'

LETRAS = {
    'a': 'a', 'b': 'be', 'c': 'ce', 'd': 'de', 'e': 'e', 'f': 'efe', 'g': 'ge',
    'h': 'hache', 'i': 'i', 'j': 'jota', 'k': 'ka', 'l': 'ele', 'm': 'eme',
    'n': 'ene', 'o': 'o', 'p': 'pe', 'q': 'cu', 'r': 'erre', 's': 'ese',
    't': 'te', 'u': 'u', 'v': 'uve', 'w': 'doble ve', 'x': 'equis', 'y': 'ye',
    'z': 'zeta',
}
DIGITOS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']

CLIPS = {
    'turno-con-placa': 'Turno con placa',
    'dirijase-al': 'diríjase al',
    'por-favor-acerquese-al': 'por favor acérquese al',
    'modulo-1': 'módulo uno, caja SOAT',
    'modulo-2': 'módulo dos, caja SOAT',
    'modulo-3': 'módulo tres, caja SOAT',
    'modulo-4': 'módulo cuatro, entrega',
    'modulo-5': 'módulo cinco, caja RTM',
    'modulo-6': 'módulo seis, caja RTM',
    **{f'letra-{letra}': texto for letra, texto in LETRAS.items()},
    **{f'digito-{n}': texto for n, texto in enumerate(DIGITOS)},
}

# Clips que se sintetizan dentro de una frase y se cortan desde el inicio de
# su última palabra: clip -> frase de contexto.
CONTEXTO = {'letra-a': 'la vocal a.'}
MARGEN_CORTE_S = 0.02  # se corta un poco antes del inicio de la palabra


async def sintetizar(texto: str, destino: Path) -> float:
    """Escribe el MP3 y devuelve el inicio (s) de la última palabra."""
    comunicador = edge_tts.Communicate(texto, VOZ, rate=VELOCIDAD, boundary='WordBoundary')
    inicio_ultima = 0.0
    with destino.open('wb') as archivo:
        async for trozo in comunicador.stream():
            if trozo['type'] == 'audio':
                archivo.write(trozo['data'])
            elif trozo['type'] == 'WordBoundary':
                inicio_ultima = trozo['offset'] / 1e7
    return inicio_ultima


def ejecutar(args: list[str]) -> str:
    resultado = subprocess.run(args, capture_output=True, text=True, encoding='utf-8')
    if resultado.returncode != 0:
        sys.exit(f'Falló: {" ".join(args)}\n{resultado.stderr}')
    return resultado.stderr


def nivel_medio(ruta: Path) -> float:
    salida = ejecutar(['ffmpeg', '-hide_banner', '-nostats', '-i', str(ruta),
                       '-af', 'volumedetect', '-f', 'null', '-'])
    return float(re.search(r'mean_volume: (-?[\d.]+) dB', salida).group(1))


def main() -> None:
    if not shutil.which('ffmpeg'):
        sys.exit('Falta ffmpeg en el PATH.')

    DESTINO.mkdir(parents=True, exist_ok=True)
    recorte = (f'silenceremove=start_periods=1:start_threshold={UMBRAL_SILENCIO}'
               f':start_silence={AIRE_S}')

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for nombre, texto in CLIPS.items():
            mp3 = tmp / f'{nombre}.mp3'
            recortado = tmp / f'{nombre}.wav'
            frase = CONTEXTO.get(nombre, texto)
            inicio_ultima = asyncio.run(sintetizar(frase, mp3))
            desde = max(inicio_ultima - MARGEN_CORTE_S, 0) if nombre in CONTEXTO else 0
            # Recorte en ambos extremos: silenceremove solo corta al inicio,
            # así que se invierte, se corta y se vuelve a invertir.
            ejecutar(['ffmpeg', '-y', '-hide_banner', '-ss', f'{desde:.3f}', '-i', str(mp3), '-af',
                      f'{recorte},areverse,{recorte},areverse',
                      '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le', str(recortado)])
            ganancia = NIVEL_MEDIO_DB - nivel_medio(recortado)
            ejecutar(['ffmpeg', '-y', '-hide_banner', '-i', str(recortado), '-af',
                      f'volume={ganancia:.2f}dB,alimiter=limit={PICO_MAX}:level=false',
                      '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le',
                      str(DESTINO / f'{nombre}.wav')])
            print(f'{nombre:<24} "{texto}"  ganancia {ganancia:+.1f} dB')

    validar()


def validar() -> None:
    """45 WAV, ninguno vacío, cada uno entre 0.2 y 3 s."""
    wavs = sorted(DESTINO.glob('*.wav'))
    errores = [] if len(wavs) == len(CLIPS) else [f'hay {len(wavs)} WAV, se esperaban {len(CLIPS)}']
    for wav in wavs:
        duracion = float(subprocess.run(
            ['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(wav)],
            capture_output=True, text=True).stdout)
        if wav.stat().st_size == 0 or not 0.2 <= duracion <= 3:
            errores.append(f'{wav.name}: {duracion:.3f} s, {wav.stat().st_size} B')
    total = sum(wav.stat().st_size for wav in wavs)
    print(f'{len(wavs)} clips en {DESTINO} ({total} bytes)')
    if errores:
        sys.exit('Validación fallida:\n' + '\n'.join(errores))


if __name__ == '__main__':
    main()
