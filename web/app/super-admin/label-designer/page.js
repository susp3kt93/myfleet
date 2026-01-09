'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { Rnd } from 'react-rnd';
import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// InPost Template Definition
const INPOST_TEMPLATE = {
    name: "InPost Style",
    elements: [
        // Top Barcode
        { id: 'top-barcode', type: 'barcode', x: 50, y: 10, width: 500, height: 70, value: '2LGBCA13LA+01000015', format: 'CODE128', displayValue: true },

        // Black boxes (left side)
        { id: 'box-1', type: 'rectangle', x: 50, y: 100, width: 150, height: 70, fill: '#000000' },
        { id: 'box-2', type: 'rectangle', x: 50, y: 180, width: 150, height: 25, fill: '#000000' },
        { id: 'box-3', type: 'rectangle', x: 50, y: 215, width: 150, height: 45, fill: '#000000' },

        // Address section
        { id: 'address-1', type: 'text', x: 220, y: 105, width: 350, height: 25, content: '11 cumwhinton road, Carlisle', fontSize: 14, fontWeight: 'normal' },
        { id: 'address-2', type: 'text', x: 220, y: 130, width: 350, height: 25, content: 'Carlisle', fontSize: 14, fontWeight: 'normal' },
        { id: 'postcode', type: 'text', x: 220, y: 165, width: 150, height: 30, content: 'CA1 3LA', fontSize: 18, fontWeight: 'bold' },
        { id: 'country', type: 'text', x: 480, y: 165, width: 80, height: 30, content: 'GB', fontSize: 18, fontWeight: 'bold' },

        // Service info (white text on black)
        { id: 'service-label', type: 'text', x: 60, y: 185, width: 130, height: 20, content: 'Service:', fontSize: 10, color: '#ffffff', fontWeight: 'normal' },
        { id: 'service-code', type: 'text', x: 70, y: 205, width: 100, height: 30, content: '2C2N', fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
        { id: 'service-dom', type: 'text', x: 220, y: 205, width: 100, height: 30, content: 'DOM', fontSize: 20, fontWeight: 'bold' },

        // Customer info
        { id: 'customer-label', type: 'text', x: 220, y: 185, width: 200, height: 20, content: 'Customer Name:', fontSize: 10 },
        { id: 'customer-name', type: 'text', x: 220, y: 205, width: 300, height: 25, content: 'Janice Losh', fontSize: 14 },

        // Order reference
        { id: 'order-label', type: 'text', x: 60, y: 225, width: 200, height: 20, content: 'Order Reference:', fontSize: 10, color: '#ffffff' },

        // Bottom section - InPost logo placeholder
        { id: 'logo-text', type: 'text', x: 80, y: 280, width: 100, height: 25, content: 'InPost', fontSize: 16, fontWeight: 'bold' },
        { id: 'home-box', type: 'rectangle', x: 350, y: 275, width: 200, height: 35, fill: '#000000' },
        { id: 'home-text', type: 'text', x: 370, y: 285, width: 160, height: 30, content: 'HOME 48', fontSize: 20, fontWeight: 'bold', color: '#ffffff' },

        // Scan instruction
        { id: 'scan-box', type: 'rectangle', x: 50, y: 320, width: 500, height: 25, fill: '#000000' },
        { id: 'scan-text', type: 'text', x: 130, y: 327, width: 350, height: 20, content: 'PLEASE SCAN BARCODE BELOW', fontSize: 12, fontWeight: 'bold', color: '#ffffff' },

        // Bottom barcode
        { id: 'bottom-barcode', type: 'barcode', x: 100, y: 355, width: 400, height: 80, value: '(J)JD00 022 338 7471 7634', format: 'CODE128', displayValue: true }
    ]
};

export default function LabelDesignerPage() {
    const router = useRouter();
    const { user } = useSelector((state) => state.auth);
    const [isReady, setIsReady] = useState(false);
    const canvasRef = useRef(null);

    const [elements, setElements] = useState([]);
    const [selectedElement, setSelectedElement] = useState(null);
    const [zoom, setZoom] = useState(100);
    const [showGrid, setShowGrid] = useState(true);

    // SSR-safe auth check
    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else {
            setIsReady(true);
            // Load InPost template by default
            loadTemplate(INPOST_TEMPLATE);
        }
    }, [user, router]);

    const loadTemplate = (template) => {
        setElements(template.elements);
        setSelectedElement(null);
    };

    const updateElement = (id, updates) => {
        setElements(prev => prev.map(el =>
            el.id === id ? { ...el, ...updates } : el
        ));
    };

    const deleteElement = () => {
        if (selectedElement) {
            setElements(prev => prev.filter(el => el.id !== selectedElement));
            setSelectedElement(null);
        }
    };

    const addElement = (type) => {
        const newElement = {
            id: `${type}-${Date.now()}`,
            type,
            x: 100,
            y: 100,
            width: type === 'barcode' ? 300 : 150,
            height: type === 'barcode' ? 60 : type === 'rectangle' ? 50 : 30,
            ...(type === 'text' && { content: 'New Text', fontSize: 14, fontWeight: 'normal', color: '#000000' }),
            ...(type === 'barcode' && { value: 'SAMPLE123', format: 'CODE128', displayValue: true }),
            ...(type === 'rectangle' && { fill: '#000000' })
        };
        setElements(prev => [...prev, newElement]);
        setSelectedElement(newElement.id);
    };

    const exportToPDF = async () => {
        if (!canvasRef.current) return;

        try {
            // Temporarily hide selection borders
            const selected = selectedElement;
            setSelectedElement(null);

            // Wait for re-render
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(canvasRef.current, {
                scale: 3, // High quality
                backgroundColor: '#ffffff',
                logging: false
            });

            // Restore selection
            setSelectedElement(selected);

            // Create PDF (4x6 inches at 72 DPI = 288x432 points)
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [4, 6]
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 0, 0, 6, 4);
            pdf.save('shipping-label.pdf');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        }
    };

    const saveTemplate = () => {
        const templateName = prompt('Enter template name:');
        if (!templateName) return;

        const template = {
            name: templateName,
            elements: elements
        };

        // Save to localStorage
        const savedTemplates = JSON.parse(localStorage.getItem('labelTemplates') || '[]');
        savedTemplates.push(template);
        localStorage.setItem('labelTemplates', JSON.stringify(savedTemplates));
        alert(`Template "${templateName}" saved successfully!`);
    };

    if (!isReady) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    const selectedEl = elements.find(el => el.id === selectedElement);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-lg text-white">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/super-admin"
                                className="w-10 h-10 bg-white/10 backdrop-blur rounded-lg flex items-center justify-center border border-white/20 hover:bg-white/20 transition text-white"
                            >
                                ←
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Shipping Label Designer</h1>
                                <p className="text-sm text-indigo-200">Create professional 4x6 inch labels</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                className="px-4 py-2 bg-white/10 border border-white/20 text-white rounded-lg backdrop-blur"
                                onChange={(e) => {
                                    if (e.target.value === 'inpost') loadTemplate(INPOST_TEMPLATE);
                                }}
                                defaultValue="inpost"
                            >
                                <option value="inpost">InPost Template</option>
                            </select>
                            <button
                                onClick={saveTemplate}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur text-white rounded-lg transition font-medium border border-white/10"
                            >
                                💾 Save Template
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition font-medium shadow-lg border border-indigo-400"
                            >
                                📥 Export PDF
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-80px)]">
                {/* Left Sidebar - Elements Palette */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">+</span>
                        Add Elements
                    </h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => addElement('text')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-left transition flex items-center gap-2"
                        >
                            <span className="text-xl">📝</span>
                            <span className="font-medium text-gray-700">Text</span>
                        </button>
                        <button
                            onClick={() => addElement('barcode')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-left transition flex items-center gap-2"
                        >
                            <span className="text-xl">🏷️</span>
                            <span className="font-medium text-gray-700">Barcode</span>
                        </button>
                        <button
                            onClick={() => addElement('rectangle')}
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-lg text-left transition flex items-center gap-2"
                        >
                            <span className="text-xl">⬛</span>
                            <span className="font-medium text-gray-700">Rectangle</span>
                        </button>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="font-bold text-gray-900 mb-3">View Options</h3>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={(e) => setShowGrid(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-700">Show Grid</span>
                            </label>
                            <div>
                                <label className="text-sm text-gray-700 block mb-1">Zoom: {zoom}%</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="150"
                                    step="25"
                                    value={zoom}
                                    onChange={(e) => setZoom(parseInt(e.target.value))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {selectedElement && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={deleteElement}
                                className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg transition font-medium"
                            >
                                🗑️ Delete Selected
                            </button>
                        </div>
                    )}
                </div>

                {/* Center Canvas */}
                <div className="flex-1 p-8 overflow-auto bg-gray-100">
                    <div className="flex justify-center">
                        <div
                            ref={canvasRef}
                            className="bg-white shadow-2xl relative"
                            style={{
                                width: `${600 * (zoom / 100)}px`,
                                height: `${400 * (zoom / 100)}px`,
                                backgroundImage: showGrid ? 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)' : 'none',
                                backgroundSize: showGrid ? `${10 * (zoom / 100)}px ${10 * (zoom / 100)}px` : 'auto'
                            }}
                        >
                            {elements.map((element) => (
                                <ElementRenderer
                                    key={element.id}
                                    element={element}
                                    zoom={zoom}
                                    isSelected={selectedElement === element.id}
                                    onSelect={() => setSelectedElement(element.id)}
                                    onUpdate={(updates) => updateElement(element.id, updates)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Properties Panel */}
                {selectedEl && (
                    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
                        <h3 className="font-bold text-gray-900 mb-4">Properties</h3>
                        <PropertiesPanel
                            element={selectedEl}
                            onUpdate={(updates) => updateElement(selectedEl.id, updates)}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Element Renderer Component
function ElementRenderer({ element, zoom, isSelected, onSelect, onUpdate }) {
    const scale = zoom / 100;
    const barcodeRef = useRef(null);

    useEffect(() => {
        if (element.type === 'barcode' && barcodeRef.current && element.value) {
            try {
                JsBarcode(barcodeRef.current, element.value, {
                    format: element.format || 'CODE128',
                    width: 2,
                    height: 50,
                    displayValue: element.displayValue !== false,
                    fontSize: 12,
                    margin: 0
                });
            } catch (err) {
                console.error('Barcode error:', err);
            }
        }
    }, [element]);

    return (
        <Rnd
            position={{ x: element.x * scale, y: element.y * scale }}
            size={{ width: element.width * scale, height: element.height * scale }}
            onDragStop={(e, d) => {
                onUpdate({ x: d.x / scale, y: d.y / scale });
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
                onUpdate({
                    width: parseInt(ref.style.width) / scale,
                    height: parseInt(ref.style.height) / scale,
                    x: position.x / scale,
                    y: position.y / scale
                });
            }}
            bounds="parent"
            enableResizing={element.type !== 'barcode'}
            onClick={onSelect}
            style={{
                border: isSelected ? '2px solid #4F46E5' : '1px solid transparent',
                cursor: 'move'
            }}
        >
            {element.type === 'text' && (
                <div
                    style={{
                        fontSize: `${element.fontSize * scale}px`,
                        fontWeight: element.fontWeight || 'normal',
                        color: element.color || '#000000',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}
                    onDoubleClick={() => {
                        const newContent = prompt('Edit text:', element.content);
                        if (newContent !== null) onUpdate({ content: newContent });
                    }}
                >
                    {element.content}
                </div>
            )}

            {element.type === 'barcode' && (
                <svg ref={barcodeRef} style={{ width: '100%', height: '100%' }}></svg>
            )}

            {element.type === 'rectangle' && (
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: element.fill || '#000000'
                    }}
                />
            )}
        </Rnd>
    );
}

// Properties Panel Component
function PropertiesPanel({ element, onUpdate }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Element Type</label>
                <div className="px-3 py-2 bg-gray-100 rounded text-sm font-medium text-gray-700 capitalize">
                    {element.type}
                </div>
            </div>

            {element.type === 'text' && (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Content</label>
                        <textarea
                            value={element.content}
                            onChange={(e) => onUpdate({ content: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            rows="2"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Font Size</label>
                        <input
                            type="number"
                            value={element.fontSize}
                            onChange={(e) => onUpdate({ fontSize: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Font Weight</label>
                        <select
                            value={element.fontWeight}
                            onChange={(e) => onUpdate({ fontWeight: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="normal">Normal</option>
                            <option value="bold">Bold</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Color</label>
                        <input
                            type="color"
                            value={element.color}
                            onChange={(e) => onUpdate({ color: e.target.value })}
                            className="w-full h-10 border border-gray-300 rounded-lg"
                        />
                    </div>
                </>
            )}

            {element.type === 'barcode' && (
                <>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Barcode Value</label>
                        <input
                            type="text"
                            value={element.value}
                            onChange={(e) => onUpdate({ value: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Format</label>
                        <select
                            value={element.format}
                            onChange={(e) => onUpdate({ format: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="CODE128">CODE128</option>
                            <option value="CODE39">CODE39</option>
                            <option value="EAN13">EAN13</option>
                        </select>
                    </div>
                </>
            )}

            {element.type === 'rectangle' && (
                <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Fill Color</label>
                    <input
                        type="color"
                        value={element.fill}
                        onChange={(e) => onUpdate({ fill: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                    />
                </div>
            )}

            <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">X</label>
                        <input
                            type="number"
                            value={Math.round(element.x)}
                            onChange={(e) => onUpdate({ x: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Y</label>
                        <input
                            type="number"
                            value={Math.round(element.y)}
                            onChange={(e) => onUpdate({ y: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Width</label>
                        <input
                            type="number"
                            value={Math.round(element.width)}
                            onChange={(e) => onUpdate({ width: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Height</label>
                        <input
                            type="number"
                            value={Math.round(element.height)}
                            onChange={(e) => onUpdate({ height: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
