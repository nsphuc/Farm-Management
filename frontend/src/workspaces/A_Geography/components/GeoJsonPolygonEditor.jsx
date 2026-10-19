import React, { useState, useEffect } from 'react';
import { Map, Code, Eye, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function GeoJsonPolygonEditor({ value, onChange, farmCenter = null }) {
  const [mode, setMode] = useState('preview'); // 'preview' | 'json'
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [parsedPolygon, setParsedPolygon] = useState(null);

  useEffect(() => {
    if (value) {
      try {
        const parsed = typeof value === 'string' ? JSON.parse(value) : value;
        setParsedPolygon(parsed);
        setJsonText(JSON.stringify(parsed, null, 2));
        setError('');
      } catch (err) {
        setError('JSON Polygon không đúng định dạng GeoJSON chuẩn');
      }
    } else {
      setParsedPolygon(null);
      setJsonText('');
      setError('');
    }
  }, [value]);

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonText(text);
    if (!text.trim()) {
      setError('');
      onChange?.(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (parsed.type !== 'Polygon' || !Array.isArray(parsed.coordinates)) {
        setError('GeoJSON phải có type: "Polygon" và mảng "coordinates"');
        return;
      }
      setError('');
      setParsedPolygon(parsed);
      onChange?.(JSON.stringify(parsed));
    } catch {
      setError('Cú pháp JSON chưa hợp lệ');
    }
  };

  const generateDefaultCoordinates = () => {
    const lat = farmCenter?.latitude || 10.772;
    const lng = farmCenter?.longitude || 106.681;
    const delta = 0.0015;

    const sample = {
      type: 'Polygon',
      coordinates: [
        [
          [Number((lng - delta).toFixed(6)), Number((lat + delta).toFixed(6))],
          [Number((lng + delta).toFixed(6)), Number((lat + delta).toFixed(6))],
          [Number((lng + delta).toFixed(6)), Number((lat - delta).toFixed(6))],
          [Number((lng - delta).toFixed(6)), Number((lat - delta).toFixed(6))],
          [Number((lng - delta).toFixed(6)), Number((lat + delta).toFixed(6))],
        ],
      ],
    };
    const str = JSON.stringify(sample, null, 2);
    setJsonText(str);
    setParsedPolygon(sample);
    setError('');
    onChange?.(JSON.stringify(sample));
  };

  // Tính tọa độ SVG viewBox từ các điểm GPS
  const renderSvgPolygon = () => {
    if (!parsedPolygon || !parsedPolygon.coordinates || !parsedPolygon.coordinates[0]) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
          <Map className="h-8 w-8 mb-2 stroke-1 text-slate-300" />
          <span>Chưa có tọa độ đa giác mặt bằng</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={generateDefaultCoordinates}
            className="mt-3 text-xs"
          >
            Tạo mẫu đa giác từ GPS trang trại
          </Button>
        </div>
      );
    }

    const ring = parsedPolygon.coordinates[0];
    if (ring.length < 3) return null;

    const lngs = ring.map((p) => p[0]);
    const lats = ring.map((p) => p[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const padLng = (maxLng - minLng) * 0.15 || 0.0005;
    const padLat = (maxLat - minLat) * 0.15 || 0.0005;

    const vMinLng = minLng - padLng;
    const vMaxLng = maxLng + padLng;
    const vMinLat = minLat - padLat;
    const vMaxLat = maxLat + padLat;

    const width = 360;
    const height = 220;

    const points = ring
      .map(([lng, lat]) => {
        const x = ((lng - vMinLng) / (vMaxLng - vMinLng)) * width;
        // Invert Y axis for screen coordinates
        const y = height - ((lat - vMinLat) / (vMaxLat - vMinLat)) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    return (
      <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-700/80 p-2">
        <div className="absolute top-2 left-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-slate-800/80 px-2 py-0.5 rounded backdrop-blur-xs">
          <span>GeoJSON: {ring.length - 1} đỉnh</span>
        </div>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 block"
        >
          {/* Grid lines */}
          <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#334155" strokeDasharray="3,3" />
          <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#334155" strokeDasharray="3,3" />

          {/* Polygon fill & stroke */}
          <polygon
            points={points}
            fill="rgba(16, 185, 129, 0.25)"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Vertices */}
          {ring.map(([lng, lat], i) => {
            const cx = ((lng - vMinLng) / (vMaxLng - vMinLng)) * width;
            const cy = height - ((lat - vMinLat) / (vMaxLat - vMinLat)) * height;
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r="4"
                fill="#ffffff"
                stroke="#047857"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <Map className="h-4 w-4 text-emerald-700" />
          <span>Sơ Đồ Đa Giác Phân Khu (GeoJSON Polygon)</span>
        </label>
        <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              mode === 'preview'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="h-3 w-3" />
            Trực quan
          </button>
          <button
            type="button"
            onClick={() => setMode('json')}
            className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-colors ${
              mode === 'json'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="h-3 w-3" />
            Sửa JSON
          </button>
        </div>
      </div>

      {mode === 'preview' ? (
        <div>{renderSvgPolygon()}</div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={jsonText}
            onChange={handleJsonChange}
            rows={7}
            placeholder='{\n  "type": "Polygon",\n  "coordinates": [...]\n}'
            className="w-full font-mono text-xs rounded-lg border border-slate-300 p-2.5 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && (
            <div className="flex items-center gap-1 text-[11px] text-rose-600 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default GeoJsonPolygonEditor;
