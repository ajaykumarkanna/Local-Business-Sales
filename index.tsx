import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { findBusinesses, generatePitchAndGap } from './services/geminiService';
import { getCurrentPosition, formatCoordinates } from './services/locationService';
import { useOutreach } from './hooks/useOutreach';
import { Business, OutreachStatus, OutreachRecord } from './types';

// Icons
const MapIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ListIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>;
const RefreshIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const XIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const PhoneIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>;
const CogIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const GlobeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SparklesIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;

const STATUS_OPTIONS = [
  { value: OutreachStatus.DRAFTED, label: 'Drafted', color: 'bg-slate-100 text-slate-700' },
  { value: OutreachStatus.CALLED, label: 'Called', color: 'bg-blue-100 text-blue-700' },
  { value: OutreachStatus.SENT_WHATSAPP, label: 'Sent WA', color: 'bg-green-100 text-green-700' },
  { value: OutreachStatus.SENT_EMAIL, label: 'Sent Email', color: 'bg-indigo-100 text-indigo-700' },
  { value: OutreachStatus.REPLIED, label: 'Replied', color: 'bg-purple-100 text-purple-700' },
  { value: OutreachStatus.INTERESTED, label: 'Interested', color: 'bg-orange-100 text-orange-700' },
  { value: OutreachStatus.NOT_INTERESTED, label: 'Not Interested', color: 'bg-red-100 text-red-700' },
];

const SEARCH_SUGGESTIONS = [
    { label: "Restaurants w/o Website", query: "Restaurants without websites" },
    { label: "Dentists < 4 Stars", query: "Dentists with rating less than 4" },
    { label: "Plumbers near me", query: "Plumbers" },
    { label: "Cafes", query: "Cafes" }
];

const RESULT_FILTERS = [
    { id: 'no_website', label: 'No Website' },
    { id: 'has_phone', label: 'Has Phone' },
    { id: 'high_rating', label: '4.0+ Stars' },
    { id: 'low_rating', label: '< 4.0 Stars' }
];

interface TrackerCardProps {
  record: OutreachRecord;
  onUpdate: (r: OutreachRecord) => void;
}

const TrackerCard: React.FC<TrackerCardProps> = ({ record, onUpdate }) => {
  const [expanded, setExpanded] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ ...record, status: e.target.value as OutreachStatus, lastUpdated: Date.now() });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...record, followUpDate: e.target.value });
  };

  const statusConfig = STATUS_OPTIONS.find(o => o.value === record.status) || STATUS_OPTIONS[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800">{record.businessName}</h3>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
               Last Contact: {new Date(record.lastUpdated).toLocaleDateString()}
            </p>
          </div>
          <select 
            value={record.status} 
            onChange={handleStatusChange}
            className={`text-[10px] font-bold px-2 py-1 rounded-full border-none outline-none cursor-pointer appearance-none text-center min-w-[80px] ${statusConfig.color}`}
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-white text-slate-700">
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Details Row */}
        <div className="flex gap-2 text-xs">
             <div className="flex-1 p-2 bg-slate-50 rounded-lg flex flex-col">
                 <span className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Follow Up</span>
                 <input 
                    type="date" 
                    className="bg-transparent border-none p-0 text-slate-900 text-xs focus:ring-0 w-full"
                    value={record.followUpDate || ''}
                    onChange={handleDateChange}
                 />
             </div>
        </div>

        {/* Expanded / Action Area */}
        <div className="space-y-2">
            <div>
                 <input 
                    type="text"
                    placeholder="Plan / Next Step..."
                    className="w-full text-xs border-b border-slate-100 py-1 focus:border-blue-500 outline-none bg-transparent text-slate-900 placeholder:text-slate-400"
                    value={record.plan || ''}
                    onChange={(e) => onUpdate({ ...record, plan: e.target.value })}
                 />
            </div>
            
            <button 
                onClick={() => setExpanded(!expanded)} 
                className="w-full text-center text-[10px] text-slate-400 hover:text-blue-500 pt-1 flex items-center justify-center gap-1"
            >
                {expanded ? 'Hide Details' : 'Show Notes & Details'}
                <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {expanded && (
                <div className="pt-2 space-y-3 animate-fade-in">
                    <div>
                        <label className="text-[10px] text-slate-400 uppercase font-bold">Notes</label>
                        <textarea 
                            className="w-full h-16 p-2 text-xs border rounded-lg mt-1 focus:ring-1 focus:ring-blue-500 outline-none bg-yellow-50/50 text-slate-900"
                            placeholder="Add notes..."
                            value={record.notes || ''}
                            onChange={(e) => onUpdate({ ...record, notes: e.target.value })}
                        />
                    </div>
                    {record.pitchContent && (
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold">Generated Pitch</label>
                             <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-1 italic">
                                 "{record.pitchContent.substring(0, 100)}..."
                             </div>
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const SkeletonLoader = () => (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 animate-pulse">
        <div className="flex justify-between items-start mb-2">
            <div className="space-y-2 w-full">
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
            </div>
            <div className="h-4 w-16 bg-slate-200 rounded-full"></div>
        </div>
        <div className="h-3 bg-slate-200 rounded w-full mt-3"></div>
    </div>
);

interface FilterChipProps {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick, icon }) => (
    <button 
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
            active 
            ? 'bg-blue-600 text-white shadow-sm' 
            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
        }`}
    >
        {icon && icon}
        {label}
    </button>
);

const App = () => {
  const [activeTab, setActiveTab] = useState<'discover' | 'tracker'>('discover');
  
  // Settings & Location State
  const [showSettings, setShowSettings] = useState(false);
  const [useGPS, setUseGPS] = useState(true);
  const [manualLocation, setManualLocation] = useState('New York, NY');
  const [userProfile, setUserProfile] = useState({ name: 'Ajay', role: 'Website Designer' });
  
  // App State
  const [gpsLocation, setGpsLocation] = useState<GeolocationPosition | null>(null);
  const [locationStr, setLocationStr] = useState<string>('Detecting...');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeResultFilters, setActiveResultFilters] = useState<string[]>([]);
  
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [generatedData, setGeneratedData] = useState<{ pitch: string, gap: string } | null>(null);
  const [notes, setNotes] = useState('');
  const [pitchLoading, setPitchLoading] = useState(false);
  const [pitchLanguage, setPitchLanguage] = useState<'ENGLISH' | 'TELUGU_LATIN'>('ENGLISH');
  
  // Tracker State
  const [trackerFilter, setTrackerFilter] = useState<'ALL' | 'TODO' | 'CONTACTED' | 'HOT'>('ALL');
  
  const { records, saveRecord, getRecord, updateStatus } = useOutreach();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    updateLocationDisplay();
  }, [useGPS, manualLocation, gpsLocation]);

  const adjustTextareaHeight = () => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
          textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
  };

  const updateLocationDisplay = () => {
    if (useGPS) {
        if (!gpsLocation) {
             getCurrentPosition()
            .then(pos => {
                setGpsLocation(pos);
                setLocationStr(formatCoordinates(pos.coords));
            })
            .catch(err => {
                setLocationStr("GPS Unavailable");
            });
        } else {
            setLocationStr(formatCoordinates(gpsLocation.coords));
        }
    } else {
        setLocationStr(manualLocation);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setBusinesses([]);
    setActiveResultFilters([]); // Reset filters on new search
    
    // Construct a location hint
    let locHint = "my current location";
    if (useGPS && gpsLocation) {
        locHint = `Latitude ${gpsLocation.coords.latitude}, Longitude ${gpsLocation.coords.longitude}`;
    } else if (!useGPS) {
        locHint = manualLocation;
    }

    const results = await findBusinesses(searchQuery, locHint);
    setBusinesses(results);
    setLoading(false);
  };

  const toggleResultFilter = (filterId: string) => {
      setActiveResultFilters(prev => 
          prev.includes(filterId) 
          ? prev.filter(id => id !== filterId) 
          : [...prev, filterId]
      );
  };

  // Filter businesses based on active chips
  const filteredBusinesses = businesses.filter(b => {
      if (activeResultFilters.length === 0) return true;
      let pass = true;
      if (activeResultFilters.includes('no_website') && b.website) pass = false;
      if (activeResultFilters.includes('has_phone') && !b.phoneNumber) pass = false;
      if (activeResultFilters.includes('high_rating') && (!b.rating || b.rating < 4.0)) pass = false;
      if (activeResultFilters.includes('low_rating') && (b.rating && b.rating >= 4.0)) pass = false;
      return pass;
  });

  const handleSuggestionClick = (query: string) => {
      setSearchQuery(query);
      // Small timeout to allow state update before height adjustment
      setTimeout(adjustTextareaHeight, 10);
  };

  const handleGenerate = async (biz: Business, lang: 'ENGLISH' | 'TELUGU_LATIN') => {
      setPitchLoading(true);
      const data = await generatePitchAndGap(biz, userProfile, lang);
      setGeneratedData(data);
      setPitchLoading(false);
      
      // Update record if exists, or draft new
      const existing = getRecord(biz.id);
      saveRecord({
          businessId: biz.id,
          businessName: biz.name,
          status: existing ? existing.status : OutreachStatus.DRAFTED,
          lastUpdated: Date.now(),
          pitchContent: data.pitch,
          notes: existing?.notes || notes
      });
  };

  const handleOpenBusiness = async (biz: Business) => {
    setSelectedBusiness(biz);
    
    const record = getRecord(biz.id);
    setNotes(record?.notes || '');
    setPitchLanguage('ENGLISH'); // Default reset

    if (record && record.pitchContent) {
      setGeneratedData({ pitch: record.pitchContent, gap: record.status === OutreachStatus.NEW ? 'Analysis Pending' : 'Existing Record' });
    } else {
      setGeneratedData(null);
      await handleGenerate(biz, 'ENGLISH');
    }
  };

  const handleLanguageToggle = () => {
      if (!selectedBusiness) return;
      const newLang = pitchLanguage === 'ENGLISH' ? 'TELUGU_LATIN' : 'ENGLISH';
      setPitchLanguage(newLang);
      handleGenerate(selectedBusiness, newLang);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newNotes = e.target.value;
    setNotes(newNotes);
    if (selectedBusiness) {
        const existing = getRecord(selectedBusiness.id);
        if (existing) {
            saveRecord({ ...existing, notes: newNotes, lastUpdated: Date.now() });
        }
    }
  };

  const handleCall = () => {
    if (!selectedBusiness) return;
    updateStatus(selectedBusiness.id, OutreachStatus.CALLED, 'call');
    if (selectedBusiness.phoneNumber) {
        window.open(`tel:${selectedBusiness.phoneNumber}`, '_self');
    }
  };

  const handleSend = (type: 'whatsapp' | 'email') => {
    if (!selectedBusiness || !generatedData) return;

    updateStatus(selectedBusiness.id, type === 'whatsapp' ? OutreachStatus.SENT_WHATSAPP : OutreachStatus.SENT_EMAIL, type);
    
    const text = encodeURIComponent(generatedData.pitch);
    
    if (type === 'whatsapp') {
      let url = `https://wa.me/?text=${text}`;
      if (selectedBusiness.phoneNumber) {
          const cleanPhone = selectedBusiness.phoneNumber.replace(/\D/g, '');
          if (cleanPhone.length > 6) {
              url = `https://wa.me/${cleanPhone}?text=${text}`;
          }
      }
      window.open(url, '_blank');
    } else {
      const emailTo = selectedBusiness.email || '';
      window.open(`mailto:${emailTo}?subject=Question about ${selectedBusiness.name}&body=${text}`, '_blank');
    }
  };

  // Filter Logic for Tracker
  const filteredRecords = records.filter(r => {
      if (trackerFilter === 'ALL') return true;
      if (trackerFilter === 'TODO') return [OutreachStatus.NEW, OutreachStatus.DRAFTED].includes(r.status);
      if (trackerFilter === 'CONTACTED') return [OutreachStatus.CALLED, OutreachStatus.SENT_WHATSAPP, OutreachStatus.SENT_EMAIL, OutreachStatus.REPLIED].includes(r.status);
      if (trackerFilter === 'HOT') return [OutreachStatus.INTERESTED, OutreachStatus.REPLIED].includes(r.status);
      return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-100 max-w-md mx-auto shadow-2xl relative">
      
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shrink-0 shadow-md z-10 flex justify-between items-center">
        <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
            <MapIcon /> LocalBiz
            </h1>
            <button 
                onClick={() => setShowSettings(true)}
                className="text-xs text-blue-100 mt-1 flex items-center gap-1 bg-blue-700/50 px-2 py-0.5 rounded-full hover:bg-blue-700 transition-colors"
            >
                📍 {locationStr} <span className="text-[10px] opacity-70">▼</span>
            </button>
        </div>
        <button onClick={() => setShowSettings(true)} className="p-2 bg-blue-500 rounded-full hover:bg-blue-400">
            <CogIcon />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
        
        {activeTab === 'discover' && (
          <div className="space-y-4">
            
            {/* Search Section */}
            <div className="space-y-2">
                <form onSubmit={handleSearch} className="relative">
                <textarea
                    ref={textareaRef}
                    className="w-full p-3 pl-4 pr-12 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 placeholder:text-slate-400 bg-white resize-none overflow-hidden min-h-[48px]"
                    placeholder="Describe what you are looking for..."
                    value={searchQuery}
                    rows={1}
                    onInput={(e) => {
                        setSearchQuery((e.target as HTMLTextAreaElement).value);
                        adjustTextareaHeight();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                />
                <button 
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bg-blue-500 text-white p-1.5 rounded-lg hover:bg-blue-600 disabled:opacity-50 shadow-sm"
                >
                    {loading ? <RefreshIcon /> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
                </button>
                </form>

                {/* Quick Search Suggestions */}
                {businesses.length === 0 && !loading && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {SEARCH_SUGGESTIONS.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSuggestionClick(s.query)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-white text-blue-600 border border-blue-100 hover:bg-blue-50 whitespace-nowrap transition-colors"
                            >
                                <SparklesIcon />
                                {s.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Results Section */}
            <div className="space-y-3">
              
              {/* Result Filters (Show only if we have results) */}
              {businesses.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-slate-200 pb-3">
                       {RESULT_FILTERS.map(f => (
                           <FilterChip 
                                key={f.id} 
                                label={f.label} 
                                active={activeResultFilters.includes(f.id)} 
                                onClick={() => toggleResultFilter(f.id)} 
                           />
                       ))}
                  </div>
              )}

              {loading ? (
                  // Skeleton Loading State
                  <div className="space-y-3">
                      <SkeletonLoader />
                      <SkeletonLoader />
                      <SkeletonLoader />
                  </div>
              ) : (
                  <>
                    {filteredBusinesses.map((biz) => {
                        const record = getRecord(biz.id);
                        return (
                        <div key={biz.id} onClick={() => handleOpenBusiness(biz)} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 active:scale-98 transition-transform cursor-pointer">
                            <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-slate-800">{biz.name}</h3>
                                <p className="text-xs text-slate-500">{biz.category} • {biz.rating}⭐ ({biz.reviewCount})</p>
                            </div>
                            {!biz.website && (
                                <span className="bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">NO WEBSITE</span>
                            )}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-1">{biz.address}</p>
                            {record && (
                                <div className="mt-2 inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600">
                                    {record.status.replace('_', ' ')}
                                </div>
                            )}
                        </div>
                        );
                    })}
                    
                    {businesses.length > 0 && filteredBusinesses.length === 0 && (
                         <div className="text-center text-slate-400 py-10">
                            <p className="text-sm">No businesses match your filters.</p>
                            <button onClick={() => setActiveResultFilters([])} className="text-xs text-blue-500 mt-2 underline">Clear Filters</button>
                        </div>
                    )}
                  </>
              )}
              
              {businesses.length === 0 && !loading && (
                <div className="text-center text-slate-400 mt-10">
                  <p>Search specifically to get started.</p>
                  <p className="text-xs mt-2">Try one of the quick filters above.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tracker' && (
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-700">Pipeline</h2>
                <div className="text-xs text-slate-400">{filteredRecords.length} Leads</div>
             </div>

             {/* Filters */}
             <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                 <FilterChip label="All" active={trackerFilter === 'ALL'} onClick={() => setTrackerFilter('ALL')} />
                 <FilterChip label="To Do" active={trackerFilter === 'TODO'} onClick={() => setTrackerFilter('TODO')} />
                 <FilterChip label="Contacted" active={trackerFilter === 'CONTACTED'} onClick={() => setTrackerFilter('CONTACTED')} />
                 <FilterChip label="Hot Leads" active={trackerFilter === 'HOT'} onClick={() => setTrackerFilter('HOT')} />
             </div>

             <div className="space-y-3">
                 {filteredRecords.length === 0 ? (
                     <div className="text-center py-10 text-slate-400">
                         <p className="text-sm">No records found in this filter.</p>
                     </div>
                 ) : (
                     filteredRecords.map(record => (
                         <TrackerCard key={record.businessId} record={record} onUpdate={saveRecord} />
                     ))
                 )}
             </div>
          </div>
        )}
      </main>

      {/* Navigation Bar */}
      <nav className="bg-white border-t border-slate-200 p-2 flex justify-around shrink-0 pb-6">
        <button 
            onClick={() => setActiveTab('discover')}
            className={`flex flex-col items-center p-2 rounded-lg w-full ${activeTab === 'discover' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
            <MapIcon />
            <span className="text-xs font-medium mt-1">Discover</span>
        </button>
        <button 
            onClick={() => setActiveTab('tracker')}
            className={`flex flex-col items-center p-2 rounded-lg w-full ${activeTab === 'tracker' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
        >
            <ListIcon />
            <span className="text-xs font-medium mt-1">Tracker</span>
        </button>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
          <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full rounded-2xl shadow-xl p-6 animate-fade-in space-y-6">
                  <div className="flex justify-between items-center">
                      <h2 className="text-lg font-bold text-slate-800">Settings & Location</h2>
                      <button onClick={() => setShowSettings(false)} className="text-slate-400"><XIcon /></button>
                  </div>

                  {/* Profile Section */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase">My Profile</h3>
                      <div className="grid grid-cols-2 gap-3">
                          <div>
                              <label className="text-[10px] text-slate-400">My Name</label>
                              <input 
                                type="text" 
                                className="w-full border rounded-lg p-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={userProfile.name}
                                onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-[10px] text-slate-400">My Role</label>
                              <input 
                                type="text" 
                                className="w-full border rounded-lg p-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={userProfile.role}
                                onChange={(e) => setUserProfile({...userProfile, role: e.target.value})}
                              />
                          </div>
                      </div>
                      <p className="text-[10px] text-slate-400">Used for sales pitch introduction.</p>
                  </div>

                  {/* Location Section */}
                  <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-500 uppercase">Search Location</h3>
                      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
                          <button 
                            onClick={() => setUseGPS(true)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${useGPS ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                          >
                              GPS (Current)
                          </button>
                          <button 
                            onClick={() => setUseGPS(false)}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${!useGPS ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                          >
                              Manual Area
                          </button>
                      </div>

                      {!useGPS && (
                          <input 
                            type="text" 
                            className="w-full border rounded-lg p-2 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Brooklyn, NY"
                            value={manualLocation}
                            onChange={(e) => setManualLocation(e.target.value)}
                          />
                      )}
                  </div>

                  <button 
                    onClick={() => setShowSettings(false)}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold active:scale-95 transition-transform"
                  >
                      Save & Close
                  </button>
              </div>
          </div>
      )}

      {/* Business Detail Modal */}
      {selectedBusiness && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-h-[90%] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
            
            <div className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg truncate pr-4 text-slate-800">{selectedBusiness.name}</h3>
              <button onClick={() => setSelectedBusiness(null)} className="text-slate-400 hover:text-slate-600">
                <XIcon />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              
              {/* Insight Card */}
              <div className={`bg-indigo-50 p-4 rounded-xl border border-indigo-100 ${pitchLoading ? 'animate-pulse' : ''}`}>
                <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-1 flex items-center gap-2">
                    AI Insight: Digital Gap
                    {pitchLoading && <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping"></div>}
                </h4>
                {pitchLoading ? (
                  <div className="h-4 bg-indigo-200 rounded w-3/4 mt-2"></div>
                ) : (
                  <p className="text-indigo-900 font-medium text-sm">{generatedData?.gap}</p>
                )}
              </div>

               {/* Notes Section */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase flex items-center justify-between">
                    <span>Call Notes</span>
                    {selectedBusiness.phoneNumber && <span className="text-[10px] text-slate-400 font-normal">{selectedBusiness.phoneNumber}</span>}
                </label>
                <textarea 
                    className="w-full h-20 p-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-yellow-50 placeholder:text-slate-400"
                    placeholder="Jot down notes during your call..."
                    value={notes}
                    onChange={handleNoteChange}
                />
              </div>

              {/* Pitch Editor */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Sales Pitch</label>
                    <button 
                        onClick={handleLanguageToggle}
                        className="text-[10px] flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full text-blue-600 font-medium border border-blue-100"
                    >
                        <GlobeIcon />
                        {pitchLanguage === 'ENGLISH' ? 'English' : 'Telugu (Eng)'}
                    </button>
                </div>
                
                {pitchLoading ? (
                   <div className="space-y-2 animate-pulse bg-slate-50 p-3 rounded-xl">
                       <div className="h-4 bg-slate-200 rounded w-full"></div>
                       <div className="h-4 bg-slate-200 rounded w-full"></div>
                       <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                   </div>
                ) : (
                    <div className="relative">
                        <textarea 
                            className="w-full h-32 p-3 text-sm border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 bg-slate-50"
                            value={generatedData?.pitch || ''}
                            onChange={(e) => setGeneratedData(prev => prev ? {...prev, pitch: e.target.value} : null)}
                        />
                         <button 
                            onClick={() => handleGenerate(selectedBusiness, pitchLanguage)}
                            className="absolute bottom-2 right-2 p-1.5 bg-white border rounded-lg text-slate-400 hover:text-blue-500 shadow-sm"
                            title="Regenerate"
                         >
                             <RefreshIcon />
                         </button>
                    </div>
                )}
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t bg-slate-50 grid grid-cols-3 gap-3">
              <button 
                onClick={handleCall}
                disabled={!selectedBusiness.phoneNumber}
                className="flex flex-col items-center justify-center bg-blue-100 text-blue-700 py-3 rounded-xl font-semibold hover:bg-blue-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PhoneIcon />
                <span className="text-xs mt-1">Call</span>
              </button>

              <button 
                onClick={() => handleSend('whatsapp')}
                disabled={pitchLoading}
                className="flex flex-col items-center justify-center bg-green-100 text-green-700 py-3 rounded-xl font-semibold hover:bg-green-200 active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                <span className="text-xs mt-1">WhatsApp</span>
              </button>
              
              <button 
                onClick={() => handleSend('email')}
                disabled={pitchLoading}
                className="flex flex-col items-center justify-center bg-slate-200 text-slate-700 py-3 rounded-xl font-semibold hover:bg-slate-300 active:scale-95 transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <span className="text-xs mt-1">Email</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.2s ease-in;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);