'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import UnifiedBackButton from '../../../../components/UnifiedBackButton';
import JsBarcode from 'jsbarcode';
import { QRCodeCanvas } from 'qrcode.react';

export default function BarcodeGeneratorPage() {
    const router = useRouter();
    const { user } = useSelector((state) => state.auth);
    const [isReady, setIsReady] = useState(false);
    const barcodeRef = useRef(null);
    const qrRef = useRef(null);

    const [formData, setFormData] = useState({
        text: 'MYFLEET-2026',
        format: 'CODE128',
        width: 2,
        height: 100,
        displayValue: true,
        fontSize: 20,
        margin: 10
    });

    const [error, setError] = useState('');

    // SSR-safe auth check
    useEffect(() => {
        if (!user || user.role !== 'SUPER_ADMIN') {
            router.push('/');
        } else {
            setIsReady(true);
        }
    }, [user, router]);

    // Generate barcode whenever form data changes
    useEffect(() => {
        if (!isReady || !formData.text) return;

        setError('');

        if (formData.format === 'QR') {
            // QR code is handled by QRCodeCanvas component
            return;
        }

        try {
            if (barcodeRef.current) {
                JsBarcode(barcodeRef.current, formData.text, {
                    format: formData.format,
                    width: formData.width,
                    height: formData.height,
                    displayValue: formData.displayValue,
                    fontSize: formData.fontSize,
                    margin: formData.margin,
                    background: '#ffffff',
                    lineColor: '#000000'
                });
            }
        } catch (err) {
            setError(err.message || 'Invalid barcode data for selected format');
        }
    }, [formData, isReady]);

    const handleDownloadPNG = () => {
        const canvas = formData.format === 'QR'
            ? qrRef.current?.querySelector('canvas')
            : barcodeRef.current;

        if (!canvas) return;

        const link = document.createElement('a');
        link.download = `barcode-${formData.text}-${formData.format}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const handleDownloadSVG = () => {
        if (formData.format === 'QR') {
            alert('SVG download is only available for standard barcodes. Use PNG for QR codes.');
            return;
        }

        const svg = barcodeRef.current;
        if (!svg) return;

        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(svg);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.download = `barcode-${formData.text}-${formData.format}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!isReady) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with Deep Space Gradient */}
            <header className="bg-gradient-to-r from-gray-900 to-indigo-900 shadow-lg text-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <UnifiedBackButton href="/super-admin" label="Back" />
                            <div>
                                <h1 className="text-2xl font-bold text-white">Barcode Generator</h1>
                                <p className="text-sm text-indigo-200">Generate professional barcodes & QR codes</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Configuration Panel */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm">⚙️</span>
                                    Configuration
                                </h3>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Barcode Text */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Barcode Content *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.text}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-mono"
                                        placeholder="Enter text or number..."
                                    />
                                </div>

                                {/* Format Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        Barcode Format
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR'].map((format) => (
                                            <button
                                                key={format}
                                                onClick={() => setFormData({ ...formData, format })}
                                                className={`px-4 py-3 rounded-xl border-2 transition font-medium text-sm ${formData.format === format
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 hover:border-indigo-200 text-gray-700'
                                                    }`}
                                            >
                                                {format}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Advanced Options (only for non-QR) */}
                                {formData.format !== 'QR' && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                    Width
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={formData.width}
                                                    onChange={(e) => setFormData({ ...formData, width: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                    Height
                                                </label>
                                                <input
                                                    type="number"
                                                    min="50"
                                                    max="200"
                                                    step="10"
                                                    value={formData.height}
                                                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={formData.displayValue}
                                                onChange={(e) => setFormData({ ...formData, displayValue: e.target.checked })}
                                                id="displayValue"
                                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor="displayValue" className="text-sm font-medium text-gray-900 cursor-pointer">
                                                Display text below barcode
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Format Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <span>ℹ️</span> Format Guidelines
                            </h4>
                            <ul className="text-sm text-blue-800 space-y-1">
                                <li><strong>CODE128:</strong> Alphanumeric, best for general use</li>
                                <li><strong>CODE39:</strong> Alphanumeric + special chars</li>
                                <li><strong>EAN13:</strong> 13 digits (product barcodes)</li>
                                <li><strong>UPC:</strong> 12 digits (retail products)</li>
                                <li><strong>QR:</strong> Any text, URLs, contact info</li>
                            </ul>
                        </div>
                    </div>

                    {/* Preview & Download Panel */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">👁️</span>
                                    Live Preview
                                </h3>
                            </div>

                            <div className="p-8">
                                {error ? (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                                        <div className="text-4xl mb-3">⚠️</div>
                                        <p className="text-red-700 font-medium">{error}</p>
                                        <p className="text-sm text-red-600 mt-2">Please check your input and format selection</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center min-h-[200px] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-8">
                                        {formData.format === 'QR' ? (
                                            <div ref={qrRef}>
                                                <QRCodeCanvas
                                                    value={formData.text}
                                                    size={256}
                                                    level="H"
                                                    includeMargin={true}
                                                />
                                            </div>
                                        ) : (
                                            <svg ref={barcodeRef}></svg>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!error && (
                                <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-3">
                                    <button
                                        onClick={handleDownloadPNG}
                                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg hover:shadow-indigo-500/30 font-bold flex items-center justify-center gap-2"
                                    >
                                        <span>📥</span> Download as PNG
                                    </button>
                                    {formData.format !== 'QR' && (
                                        <button
                                            onClick={handleDownloadSVG}
                                            className="w-full px-6 py-3 bg-white border-2 border-indigo-500 text-indigo-600 rounded-xl hover:bg-indigo-50 transition font-bold flex items-center justify-center gap-2"
                                        >
                                            <span>📄</span> Download as SVG
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Quick Presets */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm">⚡</span>
                                    Quick Presets
                                </h3>
                            </div>
                            <div className="p-6 space-y-2">
                                <button
                                    onClick={() => setFormData({ ...formData, text: 'PACKAGE-' + Date.now().toString().slice(-6) })}
                                    className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition"
                                >
                                    📦 Package ID
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, text: 'VEHICLE-' + Math.random().toString(36).substr(2, 6).toUpperCase() })}
                                    className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition"
                                >
                                    🚗 Vehicle Code
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, text: 'DRIVER-' + Math.random().toString(36).substr(2, 6).toUpperCase() })}
                                    className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-left text-sm font-medium text-gray-700 transition"
                                >
                                    👤 Driver Badge
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
