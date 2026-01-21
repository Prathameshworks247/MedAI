import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker source - using the worker from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

/**
 * PDF Viewer Component with Coordinate-based Highlighting
 * Uses pdfjs-dist to render PDF on canvas - no scrolling, full control
 */
const PDFViewer = ({ pdfFile, pageNumber, coordinates, onClose }) => {
    const canvasRef = useRef(null);
    const textLayerRef = useRef(null);
    const containerRef = useRef(null);
    const [pdf, setPdf] = useState(null);
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1.5);
    const [viewport, setViewport] = useState(null);
    const [textItems, setTextItems] = useState([]);

    // Load PDF document from File object
    useEffect(() => {
        if (!pdfFile) return;

        let isMounted = true;

        const loadPDF = async () => {
            try {
                setLoading(true);
                setError(null);

                // Convert File to ArrayBuffer
                const arrayBuffer = await pdfFile.arrayBuffer();

                // Load PDF
                const loadingTask = pdfjsLib.getDocument({
                    data: arrayBuffer,
                });

                const pdfDoc = await loadingTask.promise;

                if (isMounted) {
                    setPdf(pdfDoc);
                }
            } catch (err) {
                console.error('Error loading PDF:', err);
                if (isMounted) {
                    setError(`Failed to load PDF: ${err.message}`);
                }
            }
        };

        loadPDF();

        return () => {
            isMounted = false;
        };
    }, [pdfFile]);

    // Load specific page
    useEffect(() => {
        if (!pdf || !pageNumber) return;

        let isMounted = true;

        const loadPage = async () => {
            try {
                setLoading(true);
                const pdfPage = await pdf.getPage(pageNumber);

                if (isMounted) {
                    setPage(pdfPage);
                    const vp = pdfPage.getViewport({ scale });
                    setViewport(vp);
                }
            } catch (err) {
                console.error('Error loading page:', err);
                if (isMounted) {
                    setError(`Failed to load page ${pageNumber}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadPage();

        return () => {
            isMounted = false;
        };
    }, [pdf, pageNumber, scale]);

    // Render page to canvas and extract text
    useEffect(() => {
        if (!page || !viewport || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const renderContext = {
            canvasContext: context,
            viewport: viewport,
        };

        page.render(renderContext).promise.then(async () => {
            // Extract text items for highlighting
            try {
                const textContent = await page.getTextContent();
                const items = textContent.items.map((item, index) => {
                    // Transform coordinates from PDF space to viewport space
                    // PDF coordinates use bottom-left origin (y increases upward)
                    // Viewport coordinates use top-left origin (y increases downward)
                    const transform = item.transform;
                    
                    // PDF coordinates (bottom-left origin)
                    const pdfX = transform[4];
                    const pdfY = transform[5]; // Y position in PDF coordinates
                    const pdfWidth = item.width || 0;
                    const pdfHeight = item.height || 0;
                    
                    // Convert to viewport coordinates (top-left origin)
                    // In viewport, y = 0 is at the top, and page height is at bottom
                    const viewportX = pdfX * viewport.scale;
                    const viewportY = (page.view[3] - pdfY) * viewport.scale; // Flip Y axis
                    const viewportWidth = pdfWidth * viewport.scale;
                    const viewportHeight = pdfHeight * viewport.scale;
                    
                    return {
                        ...item,
                        str: item.str || '',
                        index: index,
                        // Viewport coordinates for rendering
                        x: viewportX,
                        y: viewportY - viewportHeight, // Adjust because PDF Y is bottom-left
                        width: Math.max(viewportWidth, 2),
                        height: Math.max(viewportHeight, 2),
                        fontSize: viewportHeight || 12,
                        // Original PDF coordinates for bbox matching
                        pdfX: pdfX,
                        pdfY: pdfY, // Original PDF Y (bottom-left origin)
                        pdfWidth: pdfWidth,
                        pdfHeight: pdfHeight,
                        pdfRight: pdfX + pdfWidth,
                        pdfBottom: pdfY - pdfHeight, // In PDF coords, smaller Y is lower
                    };
                });
                setTextItems(items);
            } catch (err) {
                console.error('Error extracting text:', err);
            }
        }).catch((err) => {
            console.error('Error rendering PDF:', err);
        });
    }, [page, viewport]);

    // Helper function to find which text items should be highlighted
    const getHighlightedTextItems = (bbox, viewport, pageHeight, allTextItems) => {
        const [x0, y0, x1, y1] = bbox;
        const highlightedIndices = new Set();
        
        // Find all text items that overlap with or are near the bbox
        const itemsInBbox = [];
        
        allTextItems.forEach((item, index) => {
            // Use PDF coordinates for matching (item.pdfX, item.pdfY are in PDF space)
            // In PDF coordinates: Y increases upward (bottom-left origin)
            // bbox: [x0, y0, x1, y1] where y0 is bottom, y1 is top
            const itemRight = item.pdfRight;
            const itemLeft = item.pdfX;
            const itemTop = item.pdfY; // Top of text in PDF coords (larger Y is higher)
            const itemBottom = item.pdfBottom; // Bottom of text in PDF coords
            
            // Check if item overlaps with bbox (with some tolerance)
            const tolerance = 15; // PDF units
            const overlaps = (
                itemLeft <= x1 + tolerance && // Item starts before or at bbox end
                itemRight >= x0 - tolerance && // Item ends after or at bbox start
                itemTop >= y0 - tolerance && // Item top is above or at bbox bottom
                itemBottom <= y1 + tolerance // Item bottom is below or at bbox top
            );
            
            if (overlaps) {
                itemsInBbox.push(index);
                highlightedIndices.add(index);
            }
        });
        
        if (itemsInBbox.length === 0) {
            // Fallback: find nearest items to bbox
            const bboxCenterX = (x0 + x1) / 2;
            const bboxCenterY = (y0 + y1) / 2;
            
            allTextItems.forEach((item, index) => {
                const itemCenterX = item.pdfX + item.pdfWidth / 2;
                const itemCenterY = item.pdfY - item.pdfHeight / 2;
                const distance = Math.sqrt(
                    Math.pow(itemCenterX - bboxCenterX, 2) + 
                    Math.pow(itemCenterY - bboxCenterY, 2)
                );
                
                if (distance < 50) { // Within 50 PDF units
                    itemsInBbox.push(index);
                    highlightedIndices.add(index);
                }
            });
        }
        
        if (itemsInBbox.length === 0) {
            return highlightedIndices;
        }
        
        // Find the first item in bbox
        const firstIndex = Math.min(...itemsInBbox);
        const firstItem = allTextItems[firstIndex];
        const lastBboxIndex = Math.max(...itemsInBbox);
        
        // Continue highlighting for 3-4 sentences after the bbox
        let sentenceCount = 0;
        let lastWasEndOfSentence = false;
        
        // Start from the last item in bbox and continue forward
        for (let i = lastBboxIndex + 1; i < allTextItems.length; i++) {
            const item = allTextItems[i];
            const text = item.str || '';
            
            // Check distance from first item to avoid going too far
            const lineHeight = firstItem.pdfHeight || 12;
            const verticalDistance = Math.abs(item.pdfY - firstItem.pdfY);
            
            // Stop if we go too far down (more than 6-7 lines)
            if (verticalDistance > lineHeight * 7) {
                break;
            }
            
            // Add to highlight
            highlightedIndices.add(i);
            
            // Count sentences (look for sentence-ending punctuation)
            const trimmedText = text.trim();
            if (trimmedText) {
                // Check if text ends with sentence-ending punctuation
                const endsWithPunctuation = /[.!?]\s*$/.test(trimmedText);
                if (endsWithPunctuation && !lastWasEndOfSentence) {
                    sentenceCount++;
                }
                
                // Also check if text contains sentence-ending punctuation in the middle
                const hasSentenceEnd = /[.!?]\s+/.test(trimmedText);
                if (hasSentenceEnd && !endsWithPunctuation && !lastWasEndOfSentence) {
                    sentenceCount++;
                }
                
                lastWasEndOfSentence = endsWithPunctuation || hasSentenceEnd;
            }
            
            // Stop after 4 sentences
            if (sentenceCount >= 4) {
                // Continue a bit more to include the last sentence fully
                if (sentenceCount >= 5 || verticalDistance > lineHeight * 6) {
                    break;
                }
            }
        }
        
        return highlightedIndices;
    };

    if (!pdfFile) {
        return null;
    }

    // Convert coordinates object to bbox array for the helper function
    const bbox = coordinates ? [coordinates.x0, coordinates.y0, coordinates.x1, coordinates.y1] : null;
    const highlightedIndices = bbox && viewport && page && textItems.length > 0
        ? getHighlightedTextItems(bbox, viewport, page.view[3], textItems)
        : new Set();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-semibold text-gray-900">Citation View - Page {pageNumber}</h3>
                        {coordinates && (
                            <div className="text-xs text-gray-600 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                                📍 Highlighted region
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* PDF Canvas Container - No Scroll */}
                <div
                    ref={containerRef}
                    className="relative bg-gray-200 p-4 flex items-center justify-center overflow-hidden"
                    style={{
                        maxHeight: 'calc(90vh - 120px)',
                        overflow: 'hidden',
                    }}
                >
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-gray-600">Loading PDF...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <p className="text-red-600 font-semibold mb-2">Error Loading PDF</p>
                                <p className="text-gray-600 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {!error && viewport && (
                        <div className="relative inline-block bg-white shadow-lg">
                            {/* CSS Animation for highlight blinking */}
                            <style>{`
                                @keyframes highlightBlink {
                                    0%, 100% {
                                        opacity: 0.75;
                                    }
                                    50% {
                                        opacity: 0.95;
                                    }
                                }
                            `}</style>
                            <canvas ref={canvasRef} />
                            
                            {/* Text layer for highlighting */}
                            {textItems.length > 0 && coordinates && (
                                <div
                                    ref={textLayerRef}
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        width: `${viewport.width}px`,
                                        height: `${viewport.height}px`,
                                    }}
                                >
                                    {textItems.map((item, index) => {
                                        if (!highlightedIndices.has(index)) return null;
                                        
                                        // Calculate highlight dimensions
                                        const highlightWidth = Math.max(item.width, 3);
                                        const highlightHeight = Math.max(item.height, 3);
                                        
                                        return (
                                            <span
                                                key={`highlight-${index}`}
                                                className="absolute bg-yellow-300 rounded-sm"
                                                style={{
                                                    left: `${item.x}px`,
                                                    top: `${item.y}px`,
                                                    width: `${highlightWidth}px`,
                                                    height: `${highlightHeight}px`,
                                                    minWidth: '2px',
                                                    minHeight: '2px',
                                                    mixBlendMode: 'multiply',
                                                    animation: 'highlightBlink 2s ease-in-out infinite',
                                                    opacity: 0.8,
                                                }}
                                                title={item.str ? `${item.str.substring(0, 50)}...` : ''}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Info */}
                {coordinates && (
                    <div className="p-3 bg-yellow-50 border-t border-yellow-200 text-sm text-gray-700">
                        <p className="font-semibold">📍 Highlighted Citation Region</p>
                        <p className="text-xs mt-1">
                            Page {pageNumber} • Coordinates: ({coordinates.x0.toFixed(1)}, {coordinates.y0.toFixed(1)}) to ({coordinates.x1.toFixed(1)}, {coordinates.y1.toFixed(1)})
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;
