
import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface PDFViewerProps {
  url: string;
}




const PDFViewer: React.FC<PDFViewerProps> = ({ url }) => {
  const [loadError, setLoadError] = useState<Error | string | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  // Publieke test PDF (fallback)
  const testPdf = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  const effectiveUrl = url || testPdf;

  // Log de URL en reset errors bij nieuwe url
  useEffect(() => {
    setLoadError(null);
    setTimedOut(false);
    console.log('PDFViewer received url:', effectiveUrl);
    // Timeout na 10 seconden
    const timeout = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(timeout);
  }, [effectiveUrl]);

    if (!url) {
      return <div style={{ color: 'red', padding: 16 }}>Geen PDF-url opgegeven.</div>;
    }
    return (
      <div style={{ width: '100%', height: '70vh', background: '#fff', borderRadius: 8 }}>
        <embed
          src={url}
          type="application/pdf"
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: 500, borderRadius: 8 }}
        />
      </div>
    );
};

export default PDFViewer;
