import React from 'react';
import { Pill, Activity, ShieldCheck, Mail, MapPin, Phone } from 'lucide-react';

export const About = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-4">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
           <Pill className="w-8 h-8 text-blue-600" />
           <span className="text-2xl font-extrabold text-slate-900 tracking-tight">PharmaSearch</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6">Connecting Healthcare Across Uganda</h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            PharmaSearch is the central digital infrastructure connecting verified pharmaceutical wholesalers with pharmacies and hospitals. Our mission is to eliminate drug shortages and ensure transparency in the supply chain.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto py-16 px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="bg-blue-50 p-4 rounded-2xl mb-4 text-blue-600">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Real-Time Inventory</h3>
          <p className="text-slate-500">Know exactly who has stock of essential medicines instantly, updated by suppliers in real-time.</p>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="bg-green-50 p-4 rounded-2xl mb-4 text-green-600">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Suppliers</h3>
          <p className="text-slate-500">Every supplier is verified by our administration to ensure safety and licensing compliance.</p>
        </div>

        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col items-center text-center">
          <div className="bg-purple-50 p-4 rounded-2xl mb-4 text-purple-600">
            <MapPin className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Nationwide Coverage</h3>
          <p className="text-slate-500">Find supplies in your city or region without making endless phone calls.</p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-slate-900 text-white py-16 px-4 mt-auto">
        <div className="max-w-4xl mx-auto text-center">
           <h2 className="text-3xl font-bold mb-8">Get in Touch</h2>
           <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <a href="mailto:support@pharmasearch.gmail.com" className="flex items-center gap-3 bg-slate-800 px-6 py-4 rounded-2xl hover:bg-slate-700 transition">
                 <Mail className="w-5 h-5 text-blue-400" />
                 <span className="font-bold">support@pharmasearch.gmail.com</span>
              </a>
              <div className="flex items-center gap-3 bg-slate-800 px-6 py-4 rounded-2xl">
                 <Phone className="w-5 h-5 text-green-400" />
                 <span className="font-bold">+256 700 000 000</span>
              </div>
           </div>
        </div>
      </section>
      
      <footer className="w-full p-8 text-center text-slate-400 text-xs font-medium bg-slate-50">
        © 2026 PharmaSearch MVP • Connecting Healthcare
      </footer>
    </div>
  );
};
