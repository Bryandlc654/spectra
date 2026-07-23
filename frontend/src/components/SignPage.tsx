import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { HiOutlineCheckCircle, HiOutlineDocumentText, HiOutlineExclamationCircle } from 'react-icons/hi2';
import { signatureService } from '../services/api';
import type { SignerResponse, Signer } from '../types';

const SAVED_SIG_KEY = 'spectra_saved_signature';

interface CanvasEvent extends MouseEvent {
  clientX: number;
  clientY: number;
}

interface TouchEvent extends globalThis.TouchEvent {
  touches: TouchList;
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [signer, setSigner] = useState<SignerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [sigPos, setSigPos] = useState<{ x: number; y: number } | null>(null);

  const [useSaved, setUseSaved] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const docRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);

  const savedSig = localStorage.getItem(SAVED_SIG_KEY);

  useEffect(() => {
    if (token) {
      signatureService.getByToken(token)
        .then((data) => { setSigner(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [token]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#006d70';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    const getPos = (e: CanvasEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'clientX' in e ? e.clientX : e.touches?.[0]?.clientX ?? 0;
      const clientY = 'clientY' in e ? e.clientY : e.touches?.[0]?.clientY ?? 0;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };
    const start = (e: CanvasEvent | TouchEvent) => {
      isDrawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };
    const draw = (e: CanvasEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };
    const end = () => { isDrawing.current = false; };

    canvas.addEventListener('mousedown', start as EventListener);
    canvas.addEventListener('mousemove', draw as EventListener);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start as EventListener, { passive: true });
    canvas.addEventListener('touchmove', draw as EventListener, { passive: true });
    canvas.addEventListener('touchend', end);

    return () => {
      canvas.removeEventListener('mousedown', start as EventListener);
      canvas.removeEventListener('mousemove', draw as EventListener);
      canvas.removeEventListener('mouseup', end);
      canvas.removeEventListener('touchstart', start as EventListener);
      canvas.removeEventListener('touchmove', draw as EventListener);
      canvas.removeEventListener('touchend', end);
    };
  }, [signer]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const getSignatureData = (): string | undefined => {
    if (useSaved && savedSig) return savedSig;
    if (mode === 'type' && typedName.trim()) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '36px "Brush Script MT", cursive';
        ctx.fillStyle = '#006d70';
        ctx.textAlign = 'center';
        ctx.fillText(typedName, 200, 75);
      }
      return canvas.toDataURL();
    }
    return canvasRef.current?.toDataURL();
  };

  const handleDocClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!docRef.current) return;
    const rect = docRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setSigPos({ x, y });
  };

  const handleSign = async () => {
    const signature = getSignatureData();
    if (!signature) { setError('Por favor dibuja o escribe tu firma primero'); return; }
    setSigning(true); setError('');
    try {
      await signatureService.sign(token!, {
        signature,
        x: sigPos ? Math.round(sigPos.x) : undefined,
        y: sigPos ? Math.round(sigPos.y) : undefined,
      });
      localStorage.setItem(SAVED_SIG_KEY, signature);
      setDone(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al firmar';
      setError(message);
    } finally { setSigning(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-primary-500"><div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"><HiOutlineCheckCircle className="w-8 h-8 text-green-600" /></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Firma completada!</h1>
        <p className="text-gray-500">Gracias por firmar. Todos los participantes recibirán una copia del documento firmado.</p>
      </div>
    </div>
  );
  if (!signer || !signer.document) return <div className="min-h-screen flex items-center justify-center text-gray-500">Enlace inválido o expirado</div>;

  const allSigners: Signer[] = signer.document?.signers || [];
  const sortedSigners = [...allSigners].sort((a, b) => a.signOrder - b.signOrder);
  const myIndex = sortedSigners.findIndex((s) => s.id === signer.id);
  const prevSigner: Signer | null = myIndex > 0 ? sortedSigners[myIndex - 1] : null;
  const prevSigned = prevSigner ? prevSigner.hasSigned : true;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 py-4 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="bg-primary-500 p-4 sm:p-6 text-center">
            <HiOutlineDocumentText className="w-8 h-8 text-white mx-auto mb-2" />
            <h1 className="text-lg sm:text-xl font-bold text-white">{signer.document.title}</h1>
            <p className="text-primary-100 text-sm mt-1">Firma digital de documentos</p>
          </div>

          <div className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-primary-50 rounded-xl px-4 py-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-sm">
                  {(signer.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">{signer.name}</p>
                  <p className="text-xs text-gray-500">{signer.email} · {signer.role === 'signer' ? 'Firmante' : signer.role}</p>
                </div>
              </div>
              {sortedSigners.length > 1 && (
                <div className="text-xs text-gray-500 bg-white rounded-lg px-3 py-1.5">
                  Firmante {myIndex + 1} de {sortedSigners.length}
                </div>
              )}
            </div>

            {sortedSigners.length > 1 && (
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                {sortedSigners.map((s) => (
                  <div key={s.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap ${
                    s.id === signer.id ? 'bg-primary-100 text-primary-700 font-medium' :
                    s.hasSigned ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${s.hasSigned ? 'bg-green-500' : s.id === signer.id ? 'bg-primary-500' : 'bg-gray-300'}`}></span>
                    {s.name}
                    {s.hasSigned && <HiOutlineCheckCircle className="w-3 h-3" />}
                  </div>
                ))}
              </div>
            )}

            {!prevSigned && (
              <div className="flex items-center gap-2 bg-yellow-50 text-yellow-700 p-3 rounded-xl mb-4 text-sm border border-yellow-200">
                <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                Aún no es tu turno. Espera a que <strong>{prevSigner?.name}</strong> firme primero.
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-100">
                <HiOutlineExclamationCircle className="w-5 h-5 shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Documento {sigPos ? <span className="text-primary-500 font-normal">· Haz clic en el documento para colocar tu firma</span> : <span className="text-gray-400 font-normal">· Revisa el documento</span>}
              </h2>
              <div ref={docRef} className="relative border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                {signer.document.mimeType?.startsWith('image/') ? (
                  <img src={signer.document.filePath} alt="Document" className="w-full cursor-pointer" onClick={handleDocClick} />
                ) : (
                  <div className="relative">
                    <iframe src={signer.document.filePath} className="w-full h-[400px] sm:h-[500px] pointer-events-none" title="Document" sandbox="allow-same-origin" />
                    <div className="absolute inset-0 cursor-pointer" onClick={handleDocClick}></div>
                  </div>
                )}
                {sigPos && (
                  <div className="absolute w-24 h-12 border-2 border-primary-500 bg-primary-50/50 rounded-lg flex items-center justify-center text-[8px] text-primary-600 font-medium animate-pulse pointer-events-none"
                    style={{ left: `${sigPos.x}%`, top: `${sigPos.y}%`, transform: 'translate(-50%, -50%)' }}>
                    FIRMA
                  </div>
                )}
              </div>
              {!sigPos && (
                <p className="text-xs text-gray-400 mt-1.5">Haz clic en el documento donde quieras colocar tu firma (opcional)</p>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Tu firma</h2>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                  {savedSig && (
                    <button onClick={() => { setUseSaved(true); setMode('draw'); }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition ${useSaved ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Guardada</button>
                  )}
                  <button onClick={() => { setUseSaved(false); setMode('draw'); }} className={`px-3 py-1 rounded-lg text-xs font-medium transition ${!useSaved && mode === 'draw' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>Dibujar</button>
                  <button onClick={() => { setUseSaved(false); setMode('type'); }} className={`px-3 py-1 rounded-lg text-xs font-medium transition ${!useSaved && mode === 'type' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'}`}>Escribir</button>
                </div>
              </div>

              {useSaved && savedSig ? (
                <div className="border-2 border-green-200 rounded-xl p-3 bg-green-50">
                  <img src={savedSig} alt="Saved signature" className="h-12" />
                  <p className="text-xs text-green-600 mt-1">Usando firma guardada</p>
                </div>
              ) : mode === 'draw' ? (
                <div>
                  <canvas ref={canvasRef} width={400} height={120}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl bg-white cursor-crosshair touch-none"
                    style={{ maxHeight: '120px' }} />
                  <button onClick={clearCanvas} className="text-xs text-gray-400 hover:text-red-500 mt-1">Limpiar</button>
                </div>
              ) : (
                <input type="text" placeholder="Escribe tu nombre completo"
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-lg font-['Brush_Script_MT',cursive] text-primary-600 outline-none focus:border-primary-300"
                  value={typedName} onChange={(e) => setTypedName(e.target.value)} />
              )}
            </div>

            <button onClick={handleSign} disabled={signing || !prevSigned}
              className="w-full bg-primary-500 text-white py-3 rounded-xl text-sm font-medium hover:bg-primary-600 transition disabled:opacity-60 shadow-lg shadow-primary-200 flex items-center justify-center gap-2">
              {signing ? 'Firmando...' : 'Firmar documento'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">Al firmar, aceptas los términos. Tu firma quedará registrada con IP y hora. Se guardará para futuras firmas.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
