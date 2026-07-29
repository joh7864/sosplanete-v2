import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Copy, CheckCircle2, Download, Printer, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface WhatsAppQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  url: string;
  communityName?: string;
}

export const WhatsAppQrModal: React.FC<WhatsAppQrModalProps> = ({
  isOpen,
  onClose,
  title,
  url,
  communityName,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('whatsapp-qr-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width + 80;
      canvas.height = img.height + 80;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngFile;
        downloadLink.download = `qrcode-whatsapp-${(title || 'communaute').toLowerCase().replace(/\s+/g, '-')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const windowPrint = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    if (!windowPrint) return;

    windowPrint.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Affiche QR Code WhatsApp - ${communityName || title}</title>
          <style>
            @media print {
              @page { size: A4 portrait; margin: 20mm; }
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              color: #0f172a;
              text-align: center;
              background-color: #ffffff;
            }
            .card {
              border: 3px solid #10b981;
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
              box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            }
            .badge {
              display: inline-block;
              background-color: #ecfdf5;
              color: #047857;
              font-weight: 800;
              font-size: 12px;
              padding: 6px 16px;
              border-radius: 9999px;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 16px;
            }
            h1 {
              font-size: 24px;
              font-weight: 900;
              margin: 0 0 8px 0;
              color: #064e3b;
            }
            h2 {
              font-size: 16px;
              font-weight: 700;
              margin: 0 0 24px 0;
              color: #475569;
            }
            .qr-box {
              background: #ffffff;
              padding: 20px;
              border-radius: 20px;
              display: inline-block;
              border: 2px solid #e2e8f0;
              margin-bottom: 24px;
            }
            .instructions {
              font-size: 14px;
              color: #334155;
              line-height: 1.6;
              text-align: left;
              background: #f8fafc;
              padding: 16px 20px;
              border-radius: 16px;
              margin-top: 16px;
            }
            .instructions ol {
              margin: 8px 0 0 0;
              padding-left: 20px;
            }
            .footer-note {
              font-size: 11px;
              color: #64748b;
              margin-top: 24px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <span class="badge">🌐 EVOE - SOS Planète</span>
            <h1>Rejoindre la Communauté WhatsApp</h1>
            <h2>${communityName || title}</h2>
            <div class="qr-box">
              ${svgDataToPrintHtml()}
            </div>
            <div class="instructions">
              <strong>📱 Comment faire ?</strong>
              <ol>
                <li>Ouvrez l'appareil photo de votre smartphone ou WhatsApp.</li>
                <li>Scannez ce QR Code.</li>
                <li>Appuyez sur le lien puis sur <strong>« Rejoindre la Communauté »</strong>.</li>
              </ol>
            </div>
            <div class="footer-note">
              🔒 Masquage automatique des numéros de téléphone (Conforme Éducation / RGPD).
            </div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          </script>
        </body>
      </html>
    `);
    windowPrint.document.close();
  };

  const svgDataToPrintHtml = () => {
    const svg = document.getElementById('whatsapp-qr-svg');
    if (!svg) return '';
    return svg.outerHTML;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black tracking-tight text-white">
                  QR Code WhatsApp
                </h3>
                <p className="text-[11px] text-slate-300 font-medium truncate max-w-[220px]">
                  {title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Content */}
          <div ref={printRef} className="p-6 space-y-6 flex flex-col items-center text-center">
            {communityName && (
              <div className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200/60 text-[11px] font-extrabold uppercase tracking-wider">
                {communityName}
              </div>
            )}

            {!url ? (
              <div className="p-8 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed space-y-2">
                <p>⚠️ Aucun lien d'invitation renseigné pour le moment.</p>
                <p className="text-[11px] font-normal text-amber-800">
                  Veuillez coller un lien WhatsApp valide dans la configuration puis réessayer.
                </p>
              </div>
            ) : (
              <>
                {/* QR Code Canvas Frame */}
                <div className="p-5 bg-white rounded-3xl border-2 border-emerald-500/20 shadow-xl relative group">
                  <QRCodeSVG
                    id="whatsapp-qr-svg"
                    value={url}
                    size={220}
                    level="H"
                    includeMargin={true}
                    imageSettings={{
                      src: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg',
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>

                {/* Subtitle instructions */}
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Scannez ce code avec un smartphone
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Redirige instantanément vers la Communauté WhatsApp officielle.
                  </p>
                </div>

                {/* Copy Link Input Bar */}
                <div className="w-full p-2 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-600 truncate px-2 text-left flex-1">
                    {url}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 size={13} className="text-emerald-400" /> Copié !
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copier
                      </>
                    )}
                  </button>
                </div>

                {/* RGPD Badge */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[10px] flex items-center justify-center gap-2 border border-slate-800 w-full">
                  <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                  <span>Numéros d'élèves 100% masqués automatiquement par WhatsApp.</span>
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
          {url && (
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm transition-all"
              >
                <Download size={15} className="text-slate-600" />
                Image (PNG)
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <Printer size={15} />
                Imprimer l'Affiche (A4)
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
