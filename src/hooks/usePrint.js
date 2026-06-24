import { useCallback } from 'react';

/**
 * Custom hook to handle HTML layout printing inside a hidden iframe.
 */
export function usePrint() {
  const printHtml = useCallback((htmlContent) => {
    // 1. Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    iframe.style.left = '-1000px';
    iframe.style.top = '-1000px';
    
    document.body.appendChild(iframe);

    // 2. Write HTML content to the iframe
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // 3. Trigger printing once content is ready
    iframe.contentWindow.focus();
    
    // Give it a tiny delay for styling evaluation and browser layout calculations
    setTimeout(() => {
      try {
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Print trigger failed', err);
      } finally {
        // Clean up the iframe from the document
        // We delay removal slightly to make sure the print dialog is fully loaded
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    }, 300);
  }, []);

  return { printHtml };
}
