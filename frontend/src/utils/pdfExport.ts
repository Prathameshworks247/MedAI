import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Export a React component as PDF by capturing it as an image
 * @param elementRef - React ref to the HTML element to capture
 * @param filename - Name for the PDF file (without .pdf extension)
 * @param options - Optional configuration
 */
export const exportComponentAsPDF = async (
  elementRef: React.RefObject<HTMLElement>,
  filename: string,
  options?: { 
    width?: number; 
    height?: number;
    padding?: number;
    backgroundColor?: string;
  }
) => {
  if (!elementRef.current) {
    console.error('Element ref is not available');
    return;
  }

  const element = elementRef.current;
  const padding = options?.padding || 20;
  const backgroundColor = options?.backgroundColor || '#ffffff';

  try {
    // Capture the element as canvas
    const canvas = await html2canvas(element, {
      backgroundColor: backgroundColor,
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      allowTaint: false,
    });

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const imgData = canvas.toDataURL('image/png');

    // PDF dimensions (A4 size in mm)
    const pdfWidth = 210; // A4 width in mm
    const pdfHeight = 297; // A4 height in mm
    const imgAspectRatio = imgWidth / imgHeight;

    // Calculate dimensions to fit PDF width
    const maxWidth = pdfWidth - (padding * 2);
    const maxHeight = pdfHeight - (padding * 2);
    
    // Calculate scaled dimensions maintaining aspect ratio
    let finalWidth = maxWidth;
    let finalHeight = finalWidth / imgAspectRatio;

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');

    // If content fits on one page, add it
    if (finalHeight <= maxHeight) {
      pdf.addImage(
        imgData,
        'PNG',
        padding,
        padding,
        finalWidth,
        finalHeight
      );
    } else {
      // Content is too tall - split across multiple pages
      const totalPages = Math.ceil(finalHeight / maxHeight);
      const imgDataUrl = imgData;
      
      for (let page = 0; page < totalPages; page++) {
        if (page > 0) {
          pdf.addPage();
        }

        // Calculate y position for this page (negative to show the correct portion)
        const yOffset = -(maxHeight * page);
        const pageHeight = page === totalPages - 1 
          ? finalHeight - (maxHeight * (totalPages - 1))
          : maxHeight;

        // Add the full image, positioned to show the correct portion
        pdf.addImage(
          imgDataUrl,
          'PNG',
          padding,
          padding + yOffset,
          finalWidth,
          finalHeight
        );
      }
    }

    // Save PDF
    pdf.save(`${filename}.pdf`);
    console.log(`✅ PDF exported: ${filename}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};
