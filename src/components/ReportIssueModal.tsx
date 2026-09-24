import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Camera,
  MapPin,
  Sparkles,
  Zap,
  AlertTriangle,
  Layers,
  CheckCircle2,
  Loader2,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { analyzeIssuePreview, createIssue, CivicIncident, AnalysisResponse } from '../utils/api';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated: (incident: CivicIncident) => void;
  initialData?: {
    title?: string;
    description?: string;
    category?: string;
    imageUrl?: string;
    lat?: number;
    lng?: number;
    locationName?: string;
  } | null;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated,
  initialData,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Pothole');
  const [locationName, setLocationName] = useState('Downtown Metro Area');
  const [lat, setLat] = useState(37.7749);
  const [lng, setLng] = useState(-122.4194);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse['data'] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sample presets for quick testing
  const samplePresets = [
    {
      name: 'Water Main Break',
      title: 'Pressurized Water Main Leak on Streetcar Line',
      desc: 'Subterranean water line broken. Pressurized clean water bubbling through cracked asphalt near tram stop.',
      cat: 'Water Leakage',
      lat: 37.7842,
      lng: -122.4069,
      loc: 'Market St & 4th Street',
      img: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Deep Arterial Pothole',
      title: 'Dangerous 18-inch Pothole in Cyclist & Bus Lane',
      desc: 'Severe pavement erosion creating sharp jagged rim. Vehicles swerving into oncoming traffic to avoid it.',
      cat: 'Pothole',
      lat: 37.7649,
      lng: -122.4194,
      loc: '16th St & Mission St',
      img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Exposed Wires on Pole',
      title: 'Exposed High-Voltage Electrical Wires on Broken Lamp',
      desc: 'Vehicle collision broke lamppost base. Live 240V conduits dangling at sidewalk level near pedestrian path.',
      cat: 'Broken Streetlight',
      lat: 37.7791,
      lng: -122.4208,
      loc: 'Van Ness Ave & McAllister St',
      img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
    },
  ];

  // Pre-fill when opened with voice or initial data
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.imageUrl) setImagePreviewUrl(initialData.imageUrl);
      if (initialData.lat) setLat(initialData.lat);
      if (initialData.lng) setLng(initialData.lng);
      if (initialData.locationName) setLocationName(initialData.locationName);
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof samplePresets[0]) => {
    setTitle(preset.title);
    setDescription(preset.desc);
    setCategory(preset.cat);
    setLat(preset.lat);
    setLng(preset.lng);
    setLocationName(preset.loc);
    setImagePreviewUrl(preset.img);
    setImageFile(null);
    setAnalysisResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!description && !title && !imageFile && !imagePreviewUrl) {
      setErrorMsg('Please enter a description or upload an image before running AI triage.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('lat', lat.toString());
      formData.append('lng', lng.toString());
      formData.append('locationName', locationName);

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreviewUrl) {
        formData.append('imageUrl', imagePreviewUrl);
      }

      const res = await analyzeIssuePreview(formData);
      if (res.success && res.data) {
        setAnalysisResult(res.data);
        if (res.data.issueType) setCategory(res.data.issueType);
      } else {
        setErrorMsg('AI analysis failed. Please verify input data.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error communicating with Gemini triage service.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('lat', lat.toString());
      formData.append('lng', lng.toString());
      formData.append('locationName', locationName);
      formData.append('reportedBy', 'Verified Citizen Reporter');

      if (imageFile) {
        formData.append('image', imageFile);
      } else if (imagePreviewUrl) {
        formData.append('imageUrl', imagePreviewUrl);
      }

      const res = await createIssue(formData);
      if (res.success && res.data) {
        onIssueCreated(res.data);
        onClose();
      } else {
        setErrorMsg((res as any).error || 'Failed to submit issue');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error communicating with municipal server');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Report Civic Infrastructure Issue
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI multimodal scanner &amp; geospatial priority engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Demo Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Test Scenarios:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {samplePresets.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/60 hover:border-sky-300 dark:hover:border-sky-700 hover:text-sky-700 dark:hover:text-sky-300 transition-all shadow-xs"
                >
                  ⚡ {preset.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Issue Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Hazardous Pothole in Bus Lane, Leaking Water Pipe..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Category & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900 cursor-pointer"
                >
                  <option value="Pothole" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Pothole / Road Surface</option>
                  <option value="Water Leakage" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Water Leakage / Pipe Burst</option>
                  <option value="Drainage" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Drainage &amp; Flooding</option>
                  <option value="Garbage" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Garbage &amp; Sanitation</option>
                  <option value="Broken Streetlight" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Broken Streetlight / Electrical</option>
                  <option value="Other" className="text-slate-800 dark:bg-slate-800 dark:text-slate-200">Other Civic Hazard</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Location / Cross Streets *
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Market St & 4th St, Downtown"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-8 pr-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Description of Hazard &amp; Severity *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe visible damage, pedestrian hazard, flooding, or safety impact..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Photo Attachment & Live Scanner Trigger */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Photo Evidence
                </label>
                <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Upload className="h-6 w-6 text-slate-400 dark:text-slate-500 mb-1" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Click to upload photo evidence
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">PNG, JPG up to 10MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* Image Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Evidence Preview
                </label>
                <div className="h-28 w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                  {imagePreviewUrl ? (
                    <img
                      src={imagePreviewUrl}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500">
                      <ImageIcon className="mx-auto h-6 w-6 opacity-40 mb-1" />
                      <span className="text-[11px]">No image selected</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* AI Diagnostics Scanner Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 py-2.5 text-xs font-bold text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-all shadow-xs"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400" />
                    <span>Gemini Multimodal Triage in Progress...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    <span>Run AI Triage Pre-Scan (Preview Priority &amp; Clustered Duplicates)</span>
                  </>
                )}
              </button>
            </div>

            {/* Live AI Analysis Preview Card */}
            {analysisResult && (
              <div className="rounded-2xl border border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/50 p-4 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-sky-100 dark:border-sky-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider">
                      AI Triage Diagnostics
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-300">
                    Confidence: {Math.round(analysisResult.confidence * 100)}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-xl bg-white dark:bg-slate-800 p-2 border border-sky-100 dark:border-sky-900 shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Classified Type</span>
                    <strong className="text-slate-800 dark:text-slate-200">{analysisResult.issueType}</strong>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 p-2 border border-sky-100 dark:border-sky-900 shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Severity</span>
                    <strong className="text-amber-700 dark:text-amber-400">{analysisResult.severity}</strong>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 p-2 border border-sky-100 dark:border-sky-900 shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Estimated Score</span>
                    <strong className="text-red-700 dark:text-red-400">
                      {analysisResult.priorityBreakdown?.totalScore ?? 75}/100
                    </strong>
                  </div>
                  <div className="rounded-xl bg-white dark:bg-slate-800 p-2 border border-sky-100 dark:border-sky-900 shadow-xs">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Cluster Matches</span>
                    <strong className="text-purple-700 dark:text-purple-300">
                      {analysisResult.nearbyDuplicateCount} within 150m
                    </strong>
                  </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-sky-100 dark:border-sky-900">
                  <strong>Diagnostic Reasoning:</strong> {analysisResult.reason}
                </p>

                {analysisResult.potentialUrbanRisk && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                    ⚠️ <strong>Potential Risk:</strong> {analysisResult.potentialUrbanRisk}
                  </p>
                )}
              </div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 p-3 text-xs text-amber-800 dark:text-amber-300">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 py-3 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:from-sky-500 hover:to-indigo-500 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Registering Ticket with Municipal Dispatch...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4" />
                    <span>Submit &amp; Dispatch to Municipal Queue</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
