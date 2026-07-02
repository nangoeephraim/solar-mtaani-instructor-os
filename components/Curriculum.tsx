import React, { useState, useMemo } from 'react';
import { AppData, CurriculumUnit } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import PageHeader from './PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Sparkles, AlertCircle, ChevronDown, ChevronUp, GraduationCap, ShieldAlert, Zap, Layers, Calendar, ClipboardList } from 'lucide-react';
import { getSubjectEmoji, getSubjectIconBg } from '../utils/subjectUtils';
import clsx from 'clsx';

interface CurriculumProps {
  data: AppData;
  onNavigate: (view: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: "spring" as const, stiffness: 350, damping: 25 }
  }
};

export const Curriculum: React.FC<CurriculumProps> = ({ data, onNavigate }) => {
  const { preferences } = useTheme();
  const activeCurriculum = preferences?.selectedCurriculum || 'TVET_CDACC';
  const subjects = useMemo(() => Object.keys(data.curriculum || {}), [data.curriculum]);

  const [activeSubject, setActiveSubject] = useState<string>(() => subjects[0] || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});

  // Reset active subject when subjects list changes
  React.useEffect(() => {
    if (subjects.length > 0 && !subjects.includes(activeSubject)) {
      setActiveSubject(subjects[0]);
    }
  }, [subjects, activeSubject]);

  const toggleUnit = (unitTitle: string) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitTitle]: !prev[unitTitle]
    }));
  };

  const filteredUnits = useMemo(() => {
    const units = data.curriculum?.[activeSubject] || [];
    if (!searchQuery.trim()) return units;
    
    const query = searchQuery.toLowerCase();
    return units.filter(u => 
      u.unit.toLowerCase().includes(query) ||
      u.title.toLowerCase().includes(query) ||
      u.outcomes.some(o => o.toLowerCase().includes(query)) ||
      u.activities.toLowerCase().includes(query)
    );
  }, [data.curriculum, activeSubject, searchQuery]);

  const curriculumDetails = useMemo(() => {
    switch (activeCurriculum) {
      case 'CBC':
        return {
          title: 'CBC (Competency Based Curriculum)',
          subtitle: 'Kenya Institute of Curriculum Development (KICD)',
          desc: 'Formative competencies focusing on learner outcomes, value-based education, and core competencies (e.g., communication, critical thinking, citizenship).',
          badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
          accent: 'emerald'
        };
      case 'KNEC':
        return {
          title: 'KNEC (Kenya National Examinations Council)',
          subtitle: 'Traditional Academic Framework (8-4-4 Standards)',
          desc: 'Continuous Assessment Tests (CATs) and summative examinations mapped to terminal performance grades.',
          badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
          accent: 'indigo'
        };
      case 'TVET_CDACC':
        return {
          title: 'TVET CDACC (Curriculum Development, Assessment & Certification Council)',
          subtitle: 'Competency-Based Education and Training (CBET)',
          desc: 'Occupational standards designed for vocational mastery. Focuses on hand-on practice, safety portfolios, and workplace execution checklists.',
          badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
          accent: 'amber'
        };
      case 'NITA':
        return {
          title: 'NITA (National Industrial Training Authority)',
          subtitle: 'Industrial Skills Testing and Certification',
          desc: 'Trade testing structure (Grade III, II, I) for commercial trades. Heavy emphasis on safety code execution and timed trade test practical tasks.',
          badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
          accent: 'rose'
        };
      default:
        return {
          title: 'Custom Curriculum',
          subtitle: 'Institution Preset Outline',
          desc: 'Customized educational pathways adjusted to organizational standards.',
          badgeBg: 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
          accent: 'slate'
        };
    }
  }, [activeCurriculum]);

  // Determine if this is a Solar Mtaani vocational context
  const isSolarMtaaniContext = activeCurriculum === 'TVET_CDACC' || activeCurriculum === 'NITA';

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 custom-scrollbar space-y-6">
      <PageHeader 
        title="Curriculum Hub" 
        subtitle="Manage and audit active syllabus modules, lessons, and student competency outcomes"
      />

      {/* Curriculum Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] p-6 lg:p-8 shadow-sm">
        {/* Glow Effects */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-[var(--md-sys-color-primary-container)] opacity-40 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 rounded-full bg-[var(--md-sys-color-secondary-container)] opacity-30 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={clsx("px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border", curriculumDetails.badgeBg)}>
                {curriculumDetails.title}
              </span>
              {isSolarMtaaniContext && (
                <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-full bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 animate-pulse">
                  <Zap size={10} className="fill-current" /> Solar Mtaani Preset
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold font-google text-[var(--md-sys-color-on-surface)]">
              {curriculumDetails.subtitle}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--md-sys-color-on-surface-variant)]">
              {curriculumDetails.desc}
            </p>
          </div>

          <button
            onClick={() => onNavigate('settings')}
            className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[var(--md-sys-color-primary)] text-white hover:bg-[var(--md-sys-color-primary-hover)] active:scale-95 transition-all text-sm font-google font-bold shadow-md shadow-indigo-500/15"
          >
            Configure Preset
          </button>
        </div>
      </div>

      {/* Solar Mtaani Highlight Box */}
      {isSolarMtaaniContext && (
        <div className="p-5 rounded-2xl border border-orange-200 dark:border-orange-950/40 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/10 dark:to-amber-950/10 flex gap-4 items-start shadow-sm">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex-shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-orange-850 dark:text-orange-300 font-google">Solar Mtaani Vocational Standard (Kibera/Mtaani Project)</h4>
            <p className="text-xs text-orange-750 dark:text-orange-400 mt-1 leading-relaxed">
              This preset loads the standardized TVET CDACC / NITA syllabus for Solar PV Technology and Basic ICT. It is specifically designed to bridge the learning gap for local youth by providing practical assessment modules for workplace safety, battery bank configuration, and system commissioning under EPRA standards.
            </p>
          </div>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full custom-scrollbar flex-1">
          {subjects.length === 0 ? (
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">No active subjects loaded.</p>
          ) : (
            subjects.map(sub => {
              const isActive = activeSubject === sub;
              return (
                <button
                  key={sub}
                  onClick={() => {
                    setActiveSubject(sub);
                    setSearchQuery('');
                  }}
                  className={clsx(
                    "flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-google font-bold text-xs whitespace-nowrap border transition-all duration-200 active:scale-95",
                    isActive
                      ? "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)] border-[var(--md-sys-color-primary)] shadow-sm"
                      : "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-on-surface-variant)] border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-variant)]"
                  )}
                >
                  <span className={clsx("w-6 h-6 rounded-lg flex items-center justify-center text-sm", getSubjectIconBg(sub))}>
                    {getSubjectEmoji(sub)}
                  </span>
                  <span>{sub}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Search syllabus units, outcomes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl text-xs border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:border-[var(--md-sys-color-primary)] transition-all placeholder:text-[var(--md-sys-color-on-surface-variant)]"
          />
        </div>
      </div>

      {/* Units List */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        key={`${activeSubject}-${searchQuery}`}
        className="space-y-4"
      >
        {filteredUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-dashed border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-low)]">
            <BookOpen size={48} className="text-[var(--md-sys-color-outline)] mb-3 animate-pulse" />
            <h3 className="font-google font-bold text-sm text-[var(--md-sys-color-on-surface)]">No modules found</h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1 max-w-sm">
              We couldn't find any syllabus items matching your query or selected course subject.
            </p>
          </div>
        ) : (
          filteredUnits.map((u, idx) => {
            const isExpanded = expandedUnits[u.title] !== false; // Default expanded for search visibility
            return (
              <motion.div
                key={u.title}
                variants={cardVariants}
                className="overflow-hidden rounded-2xl border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface-container-high)] shadow-sm hover:border-[var(--md-sys-color-outline)] transition-all duration-200"
              >
                {/* Card Header */}
                <div 
                  onClick={() => toggleUnit(u.title)}
                  className="flex items-center justify-between p-4 lg:p-5 cursor-pointer select-none bg-[var(--md-sys-color-surface-container-highest)] hover:bg-[var(--md-sys-color-surface-variant)] transition-colors duration-150"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex-shrink-0 flex items-center justify-center mt-0.5">
                      {u.week || u.session ? (
                        <div className="flex flex-col items-center justify-center leading-none">
                          <span className="text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-primary)]">
                            {u.week ? 'WEEK' : 'SESS'}
                          </span>
                          <span className="text-sm font-black mt-0.5">
                            {u.week || u.session}
                          </span>
                        </div>
                      ) : (
                        <Layers size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider">
                        {u.unit}
                      </p>
                      <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)] mt-0.5 font-google truncate">
                        {u.title}
                      </h3>
                    </div>
                  </div>

                  <div className="text-[var(--md-sys-color-on-surface-variant)] ml-4">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </div>

                {/* Card Body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <div className="p-5 border-t border-[var(--md-sys-color-outline-variant)] space-y-4">
                        {/* Outcomes */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--md-sys-color-on-surface-variant)] flex items-center gap-1.5">
                            <ClipboardList size={12} /> Expected Competency Outcomes
                          </h4>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {u.outcomes.map((outcome, oIdx) => (
                              <li 
                                key={oIdx}
                                className="flex gap-2.5 items-start p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] text-xs text-[var(--md-sys-color-on-surface)]"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-[var(--md-sys-color-primary)] mt-1.5 flex-shrink-0" />
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Activities */}
                        {u.activities && (
                          <div className="space-y-1.5 p-3 rounded-xl bg-[var(--md-sys-color-surface-container-low)]">
                            <h4 className="text-[9px] font-black uppercase tracking-widest text-[var(--md-sys-color-secondary)]">
                              Suggested Student Activities / Pedagogy
                            </h4>
                            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                              {u.activities}
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </motion.div>
    </div>
  );
};

export default Curriculum;
