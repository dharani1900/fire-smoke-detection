import React from 'react';
import { Cpu, AlertTriangle, Layers, Eye } from 'lucide-react';

export const ModelInfoPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-200">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Machine Learning Model & Architecture Specifications</h1>
            <p className="text-xs text-slate-500">PyTorch MobileNetV2 Transfer Learning Pipeline & Explainable Grad-CAM AI</p>
          </div>
        </div>
      </div>

      {/* Explicit Scientific Disclaimer Card */}
      <div className="bg-amber-950/90 border-2 border-amber-600 text-amber-100 p-6 rounded-2xl shadow-lg space-y-3">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
          <h2 className="text-base font-bold text-amber-200 uppercase tracking-wide">
            CRITICAL SCIENTIFIC & TECHNICAL LIMITATION NOTICE
          </h2>
        </div>
        <p className="text-xs leading-relaxed text-amber-100">
          Standard RGB optical camera sensors operate strictly within the visible electromagnetic spectrum (400–700 nm). They are trained to classify <strong>visible optical features such as open flames, smoke plumes, scorch discoloration, and combustion indicators</strong>.
        </p>
        <p className="text-xs leading-relaxed text-amber-200/90">
          Standard optical cameras <strong>cannot penetrate sealed metal containers or directly detect invisible molecular gas concentrations</strong>. Generated heatmaps, plume overlays, confidence scores, and severity ratings are model-derived visual decision-support tools. They must NEVER be treated as direct physical gas concentration measurements.
        </p>
      </div>

      {/* Architecture & Pipeline Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MobileNetV2 Transfer Learning */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>MobileNetV2 Neural Network</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            MobileNetV2 uses inverted residual blocks and depthwise separable convolutions for high accuracy with minimal latency on edge and cloud hardware.
          </p>
          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Input Resolution:</span>
              <span className="font-bold text-slate-900">224 x 224 x 3 (RGB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Feature Extractor:</span>
              <span className="font-bold text-slate-900">Pretrained ImageNet Weights</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Classifier Head:</span>
              <span className="font-bold text-slate-900">Dropout(0.2) + Linear(1280, 2)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Classes:</span>
              <span className="font-bold text-slate-900">['normal', 'hazard_detected']</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Test Accuracy:</span>
              <span className="font-bold text-emerald-600">99.15% (100% Hazard Recall)</span>
            </div>
          </div>
        </div>

        {/* Grad-CAM Explainability */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span>Grad-CAM Explainable AI</span>
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Gradient-weighted Class Activation Mapping (Grad-CAM) extracts gradients flowing into the final convolutional layer (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono">features[-1]</code>) to produce a 2D spatial activation heatmap.
          </p>
          <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Target Conv Layer:</span>
              <span className="font-bold text-slate-900">features[-1] (1280 channels)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200">
              <span>Colormap Rendering:</span>
              <span className="font-bold text-slate-900">COLORMAP_JET (Blue-Cyan-Red)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Interpretation:</span>
              <span className="font-bold text-slate-900">Neural Attention Highlight</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model Lifecycle & Inference Pipeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">
          End-to-End Image Processing Pipeline
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs text-center">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs mb-2">1</span>
            <p className="font-bold text-slate-800">RGB Upload</p>
            <p className="text-[11px] text-slate-500 mt-0.5">JPEG/PNG optical image validation</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs mb-2">2</span>
            <p className="font-bold text-slate-800">Preprocessing</p>
            <p className="text-[11px] text-slate-500 mt-0.5">224x224 resize & ImageNet normalize</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs mb-2">3</span>
            <p className="font-bold text-slate-800">PyTorch Inference</p>
            <p className="text-[11px] text-slate-500 mt-0.5">MobileNetV2 classification & Grad-CAM</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold inline-flex items-center justify-center text-xs mb-2">4</span>
            <p className="font-bold text-slate-800">Simulated Visualization</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Heatmap overlay & browser audio siren</p>
          </div>
        </div>
      </div>
    </div>
  );
};
