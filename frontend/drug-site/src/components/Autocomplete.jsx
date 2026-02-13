import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Loader2, Pill } from 'lucide-react';

export const Autocomplete = ({ onSelect, defaultValue = '' }) => {
  const [input, setInput] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      
      // Cancel previous request if it exists
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        console.log("🔍 Autocomplete searching for:", input);
        const { data, error } = await supabase.rpc('search_drugs_autocomplete', {
          search_term: input
        });

        if (error) {
          console.error("❌ Supabase RPC Error:", error);
          throw error;
        }
        
        console.log("✅ Results found:", data?.length || 0);
        setSuggestions(data || []);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Autocomplete fetching error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [input]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        onSelect?.(input);
      }
      setIsOpen(false);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (suggestion) => {
    setInput(suggestion.res_brand_name);
    setIsOpen(false);
    onSelect?.(suggestion.res_brand_name);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative shadow-xl rounded-2xl overflow-hidden group">
        <input 
          type="text"
          placeholder="Search by Brand or Generic name..."
          className="w-full p-6 pl-14 text-lg border-none focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => input.length >= 2 && setIsOpen(true)}
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          ) : (
            <Search className="w-6 h-6 group-focus-within:text-blue-500 transition-colors" />
          )}
        </div>
        <button 
          onClick={() => onSelect?.(input)}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          Search
        </button>
      </div>

      {isOpen && !loading && input.length >= 2 && suggestions.length === 0 && (
        <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 text-center z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-slate-500 font-medium">No medicines found matching "{input}"</p>
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-slate-50 px-6 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
            Suggested Matches
          </div>
          {suggestions.map((item, index) => (
            <button
               key={item.res_id}
               onClick={() => handleSelect(item)}
               onMouseEnter={() => setSelectedIndex(index)}
               className={`w-full text-left px-6 py-4 flex items-center justify-between transition border-b border-slate-50 last:border-none ${
                 index === selectedIndex ? 'bg-blue-50' : 'hover:bg-slate-50'
               }`}
             >
               <div className="flex items-center gap-4">
                 <div className="bg-blue-100/50 p-2 rounded-lg">
                   <Pill className="w-5 h-5 text-blue-600" />
                 </div>
                 <div>
                   <div className="font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                     {item.res_brand_name}
                   </div>
                   <div className="text-sm text-slate-500 font-medium">
                     {item.res_generic_name} • <span className="text-slate-400">{item.res_strength}</span>
                   </div>
                 </div>
               </div>
               <div className="text-[10px] font-extrabold bg-slate-100 text-slate-500 px-2 py-1 rounded-md uppercase tracking-tighter">
                 {item.res_dosage_form}
               </div>
             </button>
          ))}
        </div>
      )}
    </div>
  );
};
