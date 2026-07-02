import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, FeePayment, FeeStructure, Student, PaymentMethod, StudentFeeBalance, PaymentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PageTransition from './PageTransition';
import {
    Wallet, Search, Plus, X, CreditCard, Banknote, Users, Filter, ChevronDown, 
    CheckCircle, Clock, Receipt, DollarSign, FileText, Smartphone, MessageSquare, 
    Download, Sparkles, ChevronUp, BarChart3, HelpCircle, CalendarRange, Send
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import ReceiptModal from './ReceiptModal';

/* ─────────────────────────────────────────────
   Props
   ───────────────────────────────────────────── */
interface FeesProps {
    data: AppData;
    onAddPayment: (payment: Omit<FeePayment, 'id'>) => Promise<void>;
    onAddFeeStructure: (fee: Omit<FeeStructure, 'id'>) => Promise<void>;
    onDeletePayment: (id: string) => Promise<void>;
    onDeleteFeeStructure: (id: string) => Promise<void>;
    onInitiateMpesa: (phone: string, amount: number, studentId: number, studentName: string) => Promise<string | null>;
    onSendReminder: (studentName: string, guardianPhone: string, balance: number) => Promise<void>;
    onNavigate: (view: string) => void;
}

/* ─────────────────────────────────────────────
   Animated Numeric Counter
   ───────────────────────────────────────────── */
const AnimatedNumber: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = '', suffix = '' }) => {
    const [displayVal, setDisplayVal] = useState(0);
    const ref = useRef<number | null>(null);

    useEffect(() => {
        ref.current = null;
        let frameId: number;
        const step = (ts: number) => {
            if (!ref.current) ref.current = ts;
            const progress = Math.min((ts - ref.current) / 800, 1);
            setDisplayVal(Math.floor(progress * value));
            if (progress < 1) {
                frameId = requestAnimationFrame(step);
            } else {
                setDisplayVal(value);
            }
        };
        frameId = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frameId);
    }, [value]);

    return (
        <span className="tabular-nums">
            {prefix}
            {displayVal.toLocaleString()}
            {suffix}
        </span>
    );
};

/* ─────────────────────────────────────────────
   Futuristic Orbit Header
   ───────────────────────────────────────────── */
interface RadialOrbitProps {
    pct: number;
    collected: number;
    target: number;
    onToggle: () => void;
    active: boolean;
}

const RadialOrbit: React.FC<RadialOrbitProps> = ({ pct, collected, target, onToggle, active }) => {
    const r = 46;
    const c = 2 * Math.PI * r;
    const clampedPct = Math.min(Math.max(pct, 0), 100);

    return (
        <div className="relative overflow-hidden bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-white group">
            {/* Glowing Mesh Background */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-center gap-6 flex-1 min-w-0">
                {/* Radial Indicator */}
                <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                    <svg width={100} height={100} className="-rotate-90">
                        <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
                        <motion.circle
                            cx={50} cy={50} r={r} fill="none"
                            stroke="url(#orbitGradient)" strokeWidth={6} strokeLinecap="round"
                            strokeDasharray={c}
                            initial={{ strokeDashoffset: c }}
                            animate={{ strokeDashoffset: c - (c * clampedPct) / 100 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                        <defs>
                            <linearGradient id="orbitGradient" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#6366f1" />
                                <stop offset="50%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute text-center select-none">
                        <span className="text-xl font-google font-bold leading-none tabular-nums">
                            {Math.round(clampedPct)}%
                        </span>
                        <span className="text-[7px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">settled</span>
                    </div>
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block select-none">Global Ledger Index</span>
                    <h2 className="text-4xl font-google font-medium tracking-tight text-white leading-none">
                        <AnimatedNumber value={collected} prefix="KES " />
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                        Targeting KES {target.toLocaleString()} in billables
                    </p>
                </div>
            </div>

            {/* Toggle Panel Button */}
            <button 
                onClick={onToggle}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
                <BarChart3 size={13} />
                <span>{active ? 'Hide Charts' : 'Show Charts'}</span>
            </button>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Sleek Student Ledger Pass
   ───────────────────────────────────────────── */
interface StudentLedgerPassProps {
    student: Student;
    bal: StudentFeeBalance;
    onAddPay: () => void;
    onSendSMS: () => void;
    payments: FeePayment[];
}

const StudentLedgerPass: React.FC<StudentLedgerPassProps> = ({ student, bal, onAddPay, onSendSMS, payments }) => {
    const [expanded, setExpanded] = useState(false);
    const pctPaid = bal.totalFees > 0 ? (bal.totalPaid / bal.totalFees) * 100 : 0;
    
    const groupThemes: Record<string, { border: string; text: string; shadow: string; accent: string; badge: string }> = {
        'Campus': { border: 'hover:border-blue-500/40', text: 'text-blue-600 dark:text-blue-400', shadow: 'hover:shadow-blue-500/5', accent: '#3b82f6', badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
        'Academy': { border: 'hover:border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400', shadow: 'hover:shadow-emerald-500/5', accent: '#10b981', badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
        'CBC': { border: 'hover:border-purple-500/40', text: 'text-purple-600 dark:text-purple-400', shadow: 'hover:shadow-purple-500/5', accent: '#a855f7', badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
        'High School': { border: 'hover:border-orange-500/40', text: 'text-orange-600 dark:text-orange-400', shadow: 'hover:shadow-orange-500/5', accent: '#f97316', badge: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' }
    };
    
    const theme = groupThemes[student.studentGroup] || { border: 'hover:border-slate-500/40', text: 'text-slate-600 dark:text-slate-400', shadow: 'hover:shadow-slate-500/5', accent: '#64748b', badge: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' };

    return (
        <motion.div 
            layout
            onClick={() => setExpanded(!expanded)}
            className={clsx(
                "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden cursor-pointer flex flex-col justify-between min-h-[160px]",
                theme.border, theme.shadow, expanded ? 'ring-1 ring-slate-900 dark:ring-white border-transparent' : ''
            )}
        >
            <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <span className={clsx("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md", theme.badge)}>
                        {student.studentGroup}
                    </span>
                    
                    {/* Radial Percentage Ring */}
                    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                        <svg width={32} height={32} className="-rotate-90">
                            <circle cx={16} cy={16} r={12} fill="none" stroke="var(--md-sys-color-outline-variant)" strokeWidth={2.5} className="opacity-20" />
                            <circle 
                                cx={16} cy={16} r={12} fill="none" 
                                stroke={theme.accent} strokeWidth={2.5} strokeLinecap="round"
                                strokeDasharray={2 * Math.PI * 12}
                                strokeDashoffset={2 * Math.PI * 12 - (2 * Math.PI * 12 * Math.min(pctPaid, 100)) / 100}
                            />
                        </svg>
                        <span className="absolute text-[8px] font-black text-slate-850 dark:text-slate-200">{Math.round(pctPaid)}%</span>
                    </div>
                </div>

                {/* Account Label */}
                <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm truncate">{student.name}</h4>
                    <p className="text-[10px] text-slate-400 font-medium">Grade {student.grade} · Lot {student.lot}</p>
                </div>
            </div>

            {/* Outstanding deficit block */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-baseline justify-between">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">Outstanding Deficit</span>
                <span className={clsx("text-base font-google font-bold tabular-nums", bal.balance > 0 ? "text-rose-600 dark:text-rose-450" : "text-emerald-600 dark:text-emerald-450")}>
                    KES {bal.balance.toLocaleString()}
                </span>
            </div>

            {/* Drawer Expansion */}
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3 cursor-default"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="space-y-1.5">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">ledger statement</span>
                            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                {payments.length > 0 ? (
                                    payments.map(p => (
                                        <div key={p.id} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl text-[10px]">
                                            <span className="text-slate-400 font-medium">{new Date(p.transactionDate).toLocaleDateString()}</span>
                                            <span className="font-bold tabular-nums">KES {p.amount.toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[10px] text-slate-400 italic">No ledger statement records.</p>
                                )}
                             </div>
                        </div>

                        {student.guardianName && (
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-850 rounded-xl text-[9px] text-slate-500">
                                <p className="font-bold text-slate-700 dark:text-slate-350">Guardian: {student.guardianName}</p>
                                <p className="font-mono mt-0.5">{student.guardianPhone}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-1.5 pt-1">
                            {bal.balance > 0 && student.guardianPhone && (
                                <button 
                                    onClick={onSendSMS}
                                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-[9px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                    <MessageSquare size={10} />
                                    <span>Remind</span>
                                </button>
                            )}
                            <button 
                                onClick={onAddPay}
                                className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-[9px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                                <Plus size={10} />
                                <span>Record Pay</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/* ─────────────────────────────────────────────
   Main Ledger Component
   ───────────────────────────────────────────── */
const Fees: React.FC<FeesProps> = ({
    data, onAddPayment, onAddFeeStructure, onDeletePayment,
    onDeleteFeeStructure, onInitiateMpesa, onSendReminder, onNavigate
}) => {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
    const [termFilter, setTermFilter] = useState<0 | 1 | 2 | 3>(0);
    const [groupFilter, setGroupFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'balance-desc' | 'balance-asc' | 'name' | 'last-payment'>('balance-desc');
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [showAddFee, setShowAddFee] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [tab, setTab] = useState<'overview' | 'payments' | 'structures'>('overview');

    // Add payment states
    const [payStudentId, setPayStudentId] = useState<number | string>('');
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
    const [payPhone, setPayPhone] = useState('');
    const [payNotes, setPayNotes] = useState('');
    const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<FeePayment | null>(null);
    const [payTerm, setPayTerm] = useState<1 | 2 | 3>(1);
    const [payFeeId, setPayFeeId] = useState('');

    // Add fee structure states
    const [feeName, setFeeName] = useState('');
    const [feeAmount, setFeeAmount] = useState('');
    const [feeTerm, setFeeTerm] = useState<1 | 2 | 3 | undefined>(undefined);
    const [feeRecurring, setFeeRecurring] = useState(false);
    const [feeGroup, setFeeGroup] = useState<string>('');
    const [feeDesc, setFeeDesc] = useState('');

    const payments = data.payments || [];
    const feeStructures = data.feeStructures || [];
    const students = data.students || [];

    // Auto-fill student contact phone when student selection updates
    useEffect(() => {
        if (payStudentId) {
            const student = students.find(s => s.id.toString() === payStudentId.toString());
            if (student) {
                setPayPhone(student.guardianPhone || student.phone || '');
            }
        } else {
            setPayPhone('');
        }
    }, [payStudentId, students]);

    /* ─── Calculations ─── */
    const totalCollected = useMemo(() =>
        payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
        , [payments]);

    const totalPending = useMemo(() =>
        payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0)
        , [payments]);

    const totalExpected = useMemo(() => {
        return students.reduce((sum, student) => {
            const relevantFees = feeStructures.filter(f => !f.studentGroup || f.studentGroup === student.studentGroup);
            return sum + relevantFees.reduce((feeSum, f) => feeSum + f.amount, 0);
        }, 0);
    }, [feeStructures, students]);

    const collectionRate = useMemo(() => 
        totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0
        , [totalCollected, totalExpected]);

    const studentsWithBalanceCount = useMemo(() => {
        return students.filter(student => {
            const studentPayments = payments.filter(p => p.studentId === student.id && p.status === 'completed');
            const totalPaid = studentPayments.reduce((s, p) => s + p.amount, 0);
            const relevantFees = feeStructures.filter(f => !f.studentGroup || f.studentGroup === student.studentGroup);
            const totalFees = relevantFees.reduce((s, f) => s + f.amount, 0);
            return (totalFees - totalPaid) > 0;
        }).length;
    }, [students, payments, feeStructures]);

    const collectionsTrend = useMemo(() => {
        const dates = Array.from({ length: 10 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (9 - i));
            return {
                dateStr: d.toISOString().split('T')[0],
                formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                value: 0
            };
        });
        payments.forEach(p => {
            if (p.status === 'completed') {
                const pDate = p.transactionDate.split('T')[0];
                const match = dates.find(d => d.dateStr === pDate);
                if (match) {
                    match.value += p.amount;
                }
            }
        });
        return dates;
    }, [payments]);

    const termStatsData = useMemo(() => {
        const terms = [
            { name: 'Term 1', collected: 0, expected: 0 },
            { name: 'Term 2', collected: 0, expected: 0 },
            { name: 'Term 3', collected: 0, expected: 0 },
        ];
        terms.forEach((t, i) => {
            const termNum = (i + 1) as 1 | 2 | 3;
            students.forEach(student => {
                const structuresForTerm = feeStructures.filter(f => 
                    (f.term === termNum || (!f.term && f.isRecurring)) &&
                    (!f.studentGroup || f.studentGroup === student.studentGroup)
                );
                t.expected += structuresForTerm.reduce((s, f) => s + f.amount, 0);
            });
            t.collected = payments
                .filter(p => p.status === 'completed' && p.term === termNum)
                .reduce((sum, p) => sum + p.amount, 0);
        });
        return terms;
    }, [payments, feeStructures, students]);

    const studentBalances: StudentFeeBalance[] = useMemo(() => {
        return students.map(student => {
            const studentPayments = payments.filter(p => p.studentId === student.id);
            const totalPaid = studentPayments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
            const relevantFees = feeStructures.filter(f => !f.studentGroup || f.studentGroup === student.studentGroup);
            const totalFees = relevantFees.reduce((s, f) => s + f.amount, 0);
            const lastPayment = studentPayments.filter(p => p.status === 'completed')
                .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))[0];
            return {
                studentId: student.id,
                studentName: student.name,
                totalFees,
                totalPaid,
                balance: Math.max(0, totalFees - totalPaid),
                lastPaymentDate: lastPayment?.transactionDate,
                payments: studentPayments
            };
        });
    }, [students, payments, feeStructures]);

    const filteredBalances = useMemo(() => {
        let list = studentBalances;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(b => b.studentName.toLowerCase().includes(q));
        }
        if (groupFilter !== 'all') {
            list = list.filter(b => {
                const student = students.find(s => s.id === b.studentId);
                return student?.studentGroup === groupFilter;
            });
        }
        return [...list].sort((a, b) => {
            if (sortBy === 'balance-desc') return b.balance - a.balance;
            if (sortBy === 'balance-asc') return a.balance - b.balance;
            if (sortBy === 'name') return a.studentName.localeCompare(b.studentName);
            if (sortBy === 'last-payment') {
                const dateA = a.lastPaymentDate || '';
                const dateB = b.lastPaymentDate || '';
                return dateB.localeCompare(dateA);
            }
            return 0;
        });
    }, [studentBalances, search, groupFilter, sortBy, students]);

    const filteredPayments = useMemo(() => {
        let list = payments;
        if (filter !== 'all') {
            if (filter === 'failed') {
                list = list.filter(p => p.status === 'failed' || p.status === 'cancelled');
            } else {
                list = list.filter(p => p.status === filter);
            }
        }
        if (termFilter > 0) {
            list = list.filter(p => p.term === termFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(p => p.studentName.toLowerCase().includes(q) || p.mpesaReceiptNumber?.toLowerCase().includes(q));
        }
        return list.sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    }, [payments, filter, termFilter, search]);

    const groupedPayments = useMemo(() => {
        const groups: Record<string, FeePayment[]> = {};
        filteredPayments.forEach(p => {
            const date = new Date(p.transactionDate);
            const today = new Date();
            const yesterday = new Date();
            yesterday.setDate(today.getDate() - 1);
            let key = '';
            if (date.toDateString() === today.toDateString()) {
                key = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                key = 'Yesterday';
            } else {
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        });
        return groups;
    }, [filteredPayments]);

    // Bulk SMS Reminder targets selector
    const bulkRemindTargets = useMemo(() => {
        return studentBalances.filter(b => {
            const student = students.find(s => s.id === b.studentId);
            const matchesGroup = groupFilter === 'all' || student?.studentGroup === groupFilter;
            return matchesGroup && b.balance > 0 && !!student?.guardianPhone;
        });
    }, [studentBalances, students, groupFilter]);

    // Active Filter Indicator check
    const hasActiveFilters = useMemo(() => {
        return search || groupFilter !== 'all' || (tab === 'payments' && (filter !== 'all' || termFilter > 0));
    }, [search, groupFilter, tab, filter, termFilter]);

    /* ─── Handlers ─── */
    const handleClearFilters = () => {
        setSearch('');
        setGroupFilter('all');
        setFilter('all');
        setTermFilter(0);
    };

    const handleBulkRemind = async () => {
        if (bulkRemindTargets.length === 0) return;
        const cohortLabel = groupFilter === 'all' ? 'all cohorts' : `${groupFilter} cohort`;
        const names = bulkRemindTargets.map(t => t.studentName).slice(0, 5).join(', ') + (bulkRemindTargets.length > 5 ? ` and ${bulkRemindTargets.length - 5} others` : '');
        
        if (confirm(`Send automated SMS balance reminders to ${bulkRemindTargets.length} students in the ${cohortLabel}?\n\nTargeting: ${names}`)) {
            try {
                // Sequentially fire notifications to avoid request overflow
                for (const target of bulkRemindTargets) {
                    const student = students.find(s => s.id === target.studentId);
                    if (student?.guardianPhone) {
                        await onSendReminder(student.name, student.guardianPhone, target.balance);
                    }
                }
                alert(`Successfully sent SMS reminders to ${bulkRemindTargets.length} guardians!`);
            } catch (err) {
                console.error("Failed sending bulk reminders", err);
                alert("An error occurred while sending reminders.");
            }
        }
    };

    const handleAddPayment = async () => {
        if (!payStudentId || !payAmount) return;
        const student = students.find(s => s.id.toString() === payStudentId.toString());
        if (!student) return;

        let finalStatus: PaymentStatus = payMethod === 'mpesa' ? 'pending' : 'completed';
        let mpesaCheckoutId: string | null = null;

        if (payMethod === 'mpesa') {
            const phone = payPhone || student.guardianPhone || student.phone || '';
            if (!phone) return;
            mpesaCheckoutId = await onInitiateMpesa(phone, parseFloat(payAmount), student.id, student.name);
            if (!mpesaCheckoutId) {
                finalStatus = 'failed';
            }
        }

        const finalNotes = payMethod === 'mpesa' && mpesaCheckoutId
            ? `${payNotes ? payNotes + ' | ' : ''}CheckoutRequestID: ${mpesaCheckoutId}`
            : (payNotes || undefined);

        await onAddPayment({
            studentId: student.id,
            studentName: student.name,
            amount: parseFloat(payAmount),
            method: payMethod,
            status: finalStatus,
            mpesaPhoneNumber: payMethod === 'mpesa' ? payPhone : undefined,
            transactionDate: new Date().toISOString(),
            feeStructureId: payFeeId || undefined,
            term: payTerm,
            notes: finalNotes,
            recordedBy: user?.name || 'System'
        });

        setShowAddPayment(false);
        setPayStudentId('');
        setPayAmount('');
        setPayPhone('');
        setPayNotes('');
        setPayFeeId('');
    };

    const handleAddFee = async () => {
        if (!feeName || !feeAmount) return;
        await onAddFeeStructure({
            name: feeName,
            amount: parseFloat(feeAmount),
            term: feeTerm,
            studentGroup: feeGroup ? (feeGroup as any) : undefined,
            isRecurring: feeRecurring,
            description: feeDesc || undefined
        });
        setShowAddFee(false);
        setFeeName('');
        setFeeAmount('');
        setFeeDesc('');
        setFeeRecurring(false);
        setFeeTerm(undefined);
        setFeeGroup('');
    };

    const statusBadgeStyle = (status: PaymentStatus) => {
        if (status === 'completed') return 'text-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/20';
        if (status === 'pending') return 'text-amber-500 bg-amber-500/5 dark:bg-amber-950/20 animate-pulse';
        return 'text-rose-500 bg-rose-500/5 dark:bg-rose-950/20';
    };

    return (
        <PageTransition>
            <div className="space-y-6 pb-16 max-w-[1280px] mx-auto font-sans">
                
                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -8 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5"
                >
                    <div className="space-y-1">
                        <h1 className="text-2xl font-google font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                            <Wallet className="text-slate-400 dark:text-slate-500" size={22} />
                            <span>Fees Dashboard</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Highly modernized statement deck designed for seamless tuition and billing control.
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setShowAddFee(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                            Configure Fee
                        </button>
                        <button 
                            onClick={() => setShowAddPayment(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-105 text-white dark:text-slate-900 rounded-xl font-semibold text-xs transition-colors shadow-sm cursor-pointer"
                        >
                            Record Payment
                        </button>
                    </div>
                </motion.div>

                {/* Financial Orbit Header Visualizer */}
                <RadialOrbit 
                    pct={collectionRate} 
                    collected={totalCollected} 
                    target={totalExpected} 
                    onToggle={() => setShowAnalytics(!showAnalytics)} 
                    active={showAnalytics} 
                />

                {/* Floating Metric Stat Capsules */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-amber-500/5 rounded-full blur-xl" />
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Awaiting Settlement</span>
                            <span className="text-lg font-google font-bold text-slate-850 dark:text-slate-200 tabular-nums">
                                KES {totalPending.toLocaleString()}
                            </span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0 ml-3" />
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-6 -bottom-6 w-16 h-16 bg-rose-500/5 rounded-full blur-xl" />
                        <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block select-none">Deficit Accounts</span>
                            <span className="text-lg font-google font-bold text-slate-850 dark:text-slate-200 tabular-nums">
                                {studentsWithBalanceCount} Accounts
                            </span>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-3" />
                    </div>
                </div>

                {/* Collapsible Analytics Pane */}
                <AnimatePresence>
                    {showAnalytics && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Term Performance Comparison</h4>
                                    <div className="h-44 w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={termStatsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--md-sys-color-secondary)' }} stroke="none" />
                                                <YAxis tickFormatter={(val) => `KES ${val/1000}k`} tick={{ fontSize: 9, fill: 'var(--md-sys-color-secondary)' }} stroke="none" />
                                                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', borderColor: 'var(--md-sys-color-outline-variant)', borderRadius: '8px' }} />
                                                <Bar dataKey="expected" fill="var(--md-sys-color-outline)" radius={[4, 4, 0, 0]} name="Expected Target" />
                                                <Bar dataKey="collected" fill="currentColor" className="text-slate-800 dark:text-white" radius={[4, 4, 0, 0]} name="Collected" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collections Daily Trend</h4>
                                    <div className="h-44 w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={collectionsTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                                                <XAxis dataKey="formattedDate" tick={{ fontSize: 10, fill: 'var(--md-sys-color-secondary)' }} stroke="none" />
                                                <YAxis tickFormatter={(val) => `KES ${val/1000}k`} tick={{ fontSize: 9, fill: 'var(--md-sys-color-secondary)' }} stroke="none" />
                                                <Tooltip formatter={(value) => `KES ${value.toLocaleString()}`} contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', borderColor: 'var(--md-sys-color-outline-variant)', borderRadius: '8px' }} />
                                                <Area type="monotone" dataKey="value" stroke="currentColor" className="text-slate-800 dark:text-white" strokeWidth={1.5} fillOpacity={0.06} fill="currentColor" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Sub-navigation & Filters bar */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center border-b border-slate-100 dark:border-slate-800/80 pb-4 pt-2">
                    
                    {/* Minimal Borderless Tabs */}
                    <div className="flex gap-4">
                        {(['overview', 'payments', 'structures'] as const).map(t => {
                            const isActive = tab === t;
                            return (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={clsx(
                                        'relative pb-2 text-xs font-bold transition-colors cursor-pointer',
                                        isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    )}
                                >
                                    {t === 'overview' ? 'Student Passes' : t === 'payments' ? 'Transaction Ledger' : 'Billing Passes'}
                                    {isActive && (
                                        <motion.div 
                                            layoutId="tabUnderline" 
                                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white"
                                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Minimal Filters */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                        <div className="relative flex-1 min-w-[200px] md:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
                            <input 
                                type="text" 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search student or reference..."
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors"
                            />
                        </div>

                        {tab === 'overview' && (
                            <>
                                <select 
                                    value={groupFilter}
                                    onChange={e => setGroupFilter(e.target.value)}
                                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                                >
                                    <option value="all">All Cohorts</option>
                                    <option value="Campus">Campus</option>
                                    <option value="Academy">Academy</option>
                                    <option value="CBC">CBC</option>
                                    <option value="High School">High School</option>
                                </select>
                                <select 
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                                >
                                    <option value="balance-desc">Deficit: High to Low</option>
                                    <option value="balance-asc">Deficit: Low to High</option>
                                    <option value="name">Name A-Z</option>
                                    <option value="last-payment">Recently Settled</option>
                                </select>

                                {/* Bulk SMS reminders button */}
                                {bulkRemindTargets.length > 0 && (
                                    <button 
                                        onClick={handleBulkRemind}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-sm shadow-indigo-500/10"
                                        title="Send bulk SMS notifications to all outstanding deficits in this filter"
                                    >
                                        <Send size={11} />
                                        <span>Bulk Remind ({bulkRemindTargets.length})</span>
                                    </button>
                                )}
                            </>
                        )}

                        {tab === 'payments' && (
                            <>
                                <select 
                                    value={termFilter.toString()} 
                                    onChange={e => setTermFilter(Number(e.target.value) as 0 | 1 | 2 | 3)}
                                    className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 outline-none cursor-pointer"
                                >
                                    <option value="0">All Terms</option>
                                    <option value="1">Term 1</option>
                                    <option value="2">Term 2</option>
                                    <option value="3">Term 3</option>
                                </select>
                                <div className="flex bg-slate-100 dark:bg-slate-800/60 p-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
                                    {(['all', 'completed', 'pending', 'failed'] as const).map(f => (
                                        <button 
                                            key={f}
                                            onClick={() => setFilter(f)}
                                            className={clsx(
                                                'px-2.5 py-1 rounded-md text-[10px] font-bold capitalize transition-all cursor-pointer',
                                                filter === f ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                            )}
                                        >
                                            {f}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Active Filter Indicators Row */}
                {hasActiveFilters && (
                    <motion.div 
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center flex-wrap gap-2 text-[10px] text-slate-400 font-bold bg-slate-100/40 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-200/40 dark:border-slate-800"
                    >
                        <span>Active Filters:</span>
                        {search && (
                            <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-md">
                                Query: &quot;{search}&quot;
                            </span>
                        )}
                        {groupFilter !== 'all' && (
                            <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-md">
                                Cohort: {groupFilter}
                            </span>
                        )}
                        {tab === 'payments' && filter !== 'all' && (
                            <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-md">
                                Status: {filter}
                            </span>
                        )}
                        {tab === 'payments' && termFilter > 0 && (
                            <span className="px-2 py-0.5 bg-slate-200/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-md">
                                Term {termFilter}
                            </span>
                        )}
                        <button 
                            onClick={handleClearFilters}
                            className="ml-auto text-indigo-500 hover:text-indigo-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                            <X size={11} />
                            <span>Clear all</span>
                        </button>
                    </motion.div>
                )}

                {/* ═══ TAB CONTENT: OVERVIEW (STUDENT PASSES GRID) ═══ */}
                <AnimatePresence mode="wait">
                    {tab === 'overview' && (
                        <motion.div 
                            key="overview-grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredBalances.length > 0 ? filteredBalances.map(bal => {
                                const student = students.find(s => s.id === bal.studentId);
                                if (!student) return null;
                                return (
                                    <StudentLedgerPass 
                                        key={bal.studentId}
                                        student={student}
                                        bal={bal}
                                        onAddPay={() => { setPayStudentId(bal.studentId); setShowAddPayment(true); }}
                                        onSendSMS={() => onSendReminder(student.name, student.guardianPhone || '', bal.balance)}
                                        payments={bal.payments}
                                    />
                                );
                            }) : (
                                <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm">
                                    <Users size={32} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-bold text-slate-855 dark:text-slate-200 text-sm">No billing records found</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ TAB CONTENT: TRANSACTION LEDGER TIMELINE ═══ */}
                    {tab === 'payments' && (
                        <motion.div 
                            key="payments-timeline"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {Object.keys(groupedPayments).length > 0 ? (
                                <div className="relative pl-6 border-l border-slate-200/80 dark:border-slate-800/80 space-y-8 ml-3">
                                    {Object.entries(groupedPayments).map(([dateStr, paymentList]) => (
                                        <div key={dateStr} className="space-y-4 relative">
                                            {/* Date Node Header */}
                                            <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 dark:bg-white border-4 border-slate-100 dark:border-slate-955 box-content shrink-0" />
                                            
                                            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest pl-2">
                                                {dateStr}
                                            </h3>

                                            <div className="space-y-3 pl-2">
                                                {paymentList.map(payment => (
                                                    <div 
                                                        key={payment.id}
                                                        className="px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-slate-350 dark:hover:border-slate-700 transition-colors group"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200/30 dark:border-slate-700/20 text-slate-500 shrink-0">
                                                                {payment.method === 'mpesa' ? <Smartphone size={14} /> : payment.method === 'bank_transfer' ? <CreditCard size={14} /> : <Banknote size={14} />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-850 dark:text-slate-200 group-hover:text-indigo-500 transition-colors">
                                                                    {payment.studentName}
                                                                </h4>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 select-none">
                                                                    <span className="capitalize">{payment.method}</span>
                                                                    <span>·</span>
                                                                    <span className="font-mono">#{payment.id.substring(0,8).toUpperCase()}</span>
                                                                    {payment.mpesaReceiptNumber && (
                                                                        <>
                                                                            <span>·</span>
                                                                            <span className="font-mono">{payment.mpesaReceiptNumber}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3 sm:pt-0">
                                                            <div className="flex items-center gap-4">
                                                                <span className={clsx("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", statusBadgeStyle(payment.status))}>
                                                                    {payment.status}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-medium">Recorded by {payment.recordedBy}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="font-bold text-slate-800 dark:text-slate-105 tabular-nums">
                                                                    KES {payment.amount.toLocaleString()}
                                                                </span>

                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    {payment.status === 'completed' && (
                                                                        <button 
                                                                            onClick={() => setSelectedReceiptPayment(payment)}
                                                                            className="p-1.5 text-slate-400 hover:text-slate-855 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                                            title="Download Receipt"
                                                                        >
                                                                            <Download size={13} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={async (e) => {
                                                                            e.stopPropagation();
                                                                            if (confirm("Delete this ledger entry?")) {
                                                                                await onDeletePayment(payment.id);
                                                                            }
                                                                        }}
                                                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                                        title="Delete entry"
                                                                    >
                                                                        <X size={13} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm">
                                    <Receipt size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-bold text-slate-850 dark:text-slate-250 text-sm">No ledger logs found</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ TAB CONTENT: FEE PLANS (APPLE WALLET DECK) ═══ */}
                    {tab === 'structures' && (
                        <motion.div 
                            key="structures-deck"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {feeStructures.length > 0 ? feeStructures.map((fee, idx) => {
                                const targetedStudents = fee.studentGroup 
                                    ? students.filter(s => s.studentGroup === fee.studentGroup)
                                    : students;
                                const paidCount = targetedStudents.filter(s => {
                                    const sumPaid = payments
                                        .filter(p => p.studentId === s.id && p.feeStructureId === fee.id && p.status === 'completed')
                                        .reduce((sum, p) => sum + p.amount, 0);
                                    return sumPaid >= fee.amount;
                                }).length;
                                const completionRate = targetedStudents.length > 0 ? (paidCount / targetedStudents.length) * 100 : 0;

                                return (
                                    <motion.div 
                                        key={fee.id}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                        className="relative bg-gradient-to-br from-slate-900 to-indigo-950 dark:from-slate-955 dark:to-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between min-h-[180px] text-white overflow-hidden group"
                                    >
                                        <div className="absolute -top-16 -right-16 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />

                                        <div className="space-y-4 relative">
                                            <div className="flex items-start justify-between">
                                                <div className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                                                    Tuition Billing pass
                                                </div>
                                                <button 
                                                    onClick={() => onDeleteFeeStructure(fee.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="font-bold text-white text-base truncate">{fee.name}</h4>
                                                <p className="text-2xl font-google font-medium text-white tabular-nums tracking-tight">
                                                    KES {fee.amount.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-wrap pt-1">
                                                {fee.term && <span className="text-[9px] font-bold bg-white/10 border border-white/5 text-slate-350 px-2 py-0.5 rounded uppercase">Term {fee.term}</span>}
                                                {fee.studentGroup && <span className="text-[9px] font-bold bg-white/10 border border-white/5 text-slate-355 px-2 py-0.5 rounded uppercase">{fee.studentGroup} Group</span>}
                                                {fee.isRecurring && <span className="text-[9px] font-bold bg-white/10 border border-white/5 text-slate-355 px-2 py-0.5 rounded uppercase">Recurring</span>}
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-3.5 border-t border-white/10 space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                <span>Settlement Rate ({paidCount}/{targetedStudents.length})</span>
                                                <span className="text-white font-black">{completionRate.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                                <div 
                                                    style={{ width: `${completionRate}%` }} 
                                                    className="h-full bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 rounded-full" 
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm">
                                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-bold text-slate-850 dark:text-slate-200 text-sm">No custom pass plans configured</p>
                                    <p className="text-xs text-slate-400 mt-1 mb-5">Create custom billing structures to target charges.</p>
                                    <button 
                                        onClick={() => setShowAddFee(true)}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-105 text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                                    >
                                        Configure Billing pass
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ MODAL: RECORD PAYMENT ═══ */}
                <AnimatePresence>
                    {showAddPayment && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setShowAddPayment(false)}
                        >
                            <motion.div 
                                initial={{ scale: 0.96, y: 12 }} 
                                animate={{ scale: 1, y: 0 }} 
                                exit={{ scale: 0.96, y: 12 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-none"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-6 py-5 border-b border-slate-105 dark:border-slate-800/80 flex items-center justify-between">
                                    <h3 className="font-google font-bold text-slate-800 dark:text-white text-base">
                                        Collect Billing Pay
                                    </h3>
                                    <button onClick={() => setShowAddPayment(false)} className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Student Account</label>
                                        <select 
                                            value={payStudentId === '' ? '' : payStudentId.toString()} 
                                            onChange={e => setPayStudentId(e.target.value)} 
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none cursor-pointer"
                                        >
                                            <option value="">Select Student...</option>
                                            {students.map(s => <option key={s.id} value={s.id.toString()}>{s.name} ({s.studentGroup})</option>)}
                                        </select>
                                    </div>

                                    {payStudentId && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Ledger Outstanding:</span>
                                            <span className="font-bold text-rose-600 dark:text-rose-455">
                                                KES {(studentBalances.find(b => b.studentId.toString() === payStudentId.toString())?.balance || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Amount (KES)</label>
                                        <input 
                                            type="number" 
                                            value={payAmount} 
                                            onChange={e => setPayAmount(e.target.value)} 
                                            placeholder="e.g. 15000"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none focus:border-slate-400" 
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Billing Channel</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { val: 'cash' as const, icon: <Banknote size={14} />, label: 'Cash' },
                                                { val: 'mpesa' as const, icon: <Smartphone size={14} />, label: 'M-Pesa' },
                                                { val: 'bank_transfer' as const, icon: <CreditCard size={14} />, label: 'Bank' },
                                            ]).map(m => (
                                                <button 
                                                    key={m.val} 
                                                    onClick={() => setPayMethod(m.val)}
                                                    className={clsx(
                                                        'p-2 rounded-xl border flex flex-col items-center gap-1 text-[10px] font-bold transition-all cursor-pointer',
                                                        payMethod === m.val ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200/60 dark:border-slate-855 text-slate-400 hover:border-slate-300'
                                                    )}
                                                >
                                                    {m.icon}
                                                    <span>{m.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {payMethod === 'mpesa' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">M-Pesa Checkout Number</label>
                                            <input 
                                                type="tel" 
                                                value={payPhone} 
                                                onChange={e => setPayPhone(e.target.value)} 
                                                placeholder="e.g. 0712345678"
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none" 
                                            />
                                        </motion.div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Plan Category</label>
                                            <select 
                                                value={payFeeId} 
                                                onChange={e => setPayFeeId(e.target.value)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-355 cursor-pointer"
                                            >
                                                <option value="">General Balance</option>
                                                {feeStructures.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Billed Term</label>
                                            <select 
                                                value={payTerm.toString()} 
                                                onChange={e => setPayTerm(Number(e.target.value) as 1 | 2 | 3)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-355 cursor-pointer"
                                            >
                                                <option value="1">Term 1</option>
                                                <option value="2">Term 2</option>
                                                <option value="3">Term 3</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Reference notes</label>
                                        <input 
                                            type="text" 
                                            value={payNotes} 
                                            onChange={e => setPayNotes(e.target.value)} 
                                            placeholder="Transaction metadata details..."
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none" 
                                        />
                                    </div>

                                    <button 
                                        onClick={handleAddPayment} 
                                        disabled={!payStudentId || !payAmount}
                                        className="w-full py-3.5 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 dark:hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        {payMethod === 'mpesa' ? 'Send M-Pesa STK Push' : 'Record Ledger Statement'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ MODAL: CONFIGURE BILLING PLAN ═══ */}
                <AnimatePresence>
                    {showAddFee && (
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4"
                            onClick={() => setShowAddFee(false)}
                        >
                            <motion.div 
                                initial={{ scale: 0.96, y: 12 }} 
                                animate={{ scale: 1, y: 0 }} 
                                exit={{ scale: 0.96, y: 12 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-none"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-6 py-5 border-b border-slate-105 dark:border-slate-800/80 flex items-center justify-between">
                                    <h3 className="font-google font-bold text-slate-800 dark:text-white text-base">
                                        Setup Billing plan
                                    </h3>
                                    <button onClick={() => setShowAddFee(false)} className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-855 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Plan Identifier Name</label>
                                        <input 
                                            type="text" 
                                            value={feeName} 
                                            onChange={e => setFeeName(e.target.value)} 
                                            placeholder="e.g. Tuition Fee Term 2"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none" 
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Billing Amount (KES)</label>
                                        <input 
                                            type="number" 
                                            value={feeAmount} 
                                            onChange={e => setFeeAmount(e.target.value)} 
                                            placeholder="e.g. 25000"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Term</label>
                                            <select 
                                                value={feeTerm === undefined ? '' : feeTerm.toString()} 
                                                onChange={e => setFeeTerm(e.target.value ? Number(e.target.value) as 1 | 2 | 3 : undefined)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                                            >
                                                <option value="">All Terms</option>
                                                <option value="1">Term 1</option>
                                                <option value="2">Term 2</option>
                                                <option value="3">Term 3</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Cohort Group</label>
                                            <select 
                                                value={feeGroup} 
                                                onChange={e => setFeeGroup(e.target.value)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                                            >
                                                <option value="">All Groups</option>
                                                <option value="Campus">Campus</option>
                                                <option value="Academy">Academy</option>
                                                <option value="CBC">CBC</option>
                                                <option value="High School">High School</option>
                                            </select>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 rounded-xl">
                                        <input 
                                            type="checkbox" 
                                            checked={feeRecurring} 
                                            onChange={e => setFeeRecurring(e.target.checked)}
                                            className="w-4 h-4 rounded accent-slate-900 dark:accent-white shrink-0" 
                                        />
                                        <div className="flex flex-col text-xs">
                                            <span className="font-bold text-slate-850 dark:text-slate-200">Recurring Billing Plan</span>
                                            <span className="text-[10px] text-slate-400 font-medium">Charged automatically to all terms.</span>
                                        </div>
                                    </label>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Description</label>
                                        <input 
                                            type="text" 
                                            value={feeDesc} 
                                            onChange={e => setFeeDesc(e.target.value)} 
                                            placeholder="Write brief description..."
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none" 
                                        />
                                    </div>

                                    <button 
                                        onClick={handleAddFee} 
                                        disabled={!feeName || !feeAmount}
                                        className="w-full py-3.5 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 dark:hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        Create Billing Plan
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>

            <AnimatePresence>
                {selectedReceiptPayment && (
                    <ReceiptModal
                        payment={selectedReceiptPayment}
                        student={students.find(s => s.id === selectedReceiptPayment.studentId)}
                        balance={studentBalances.find(b => b.studentId === selectedReceiptPayment.studentId)?.balance || 0}
                        onClose={() => setSelectedReceiptPayment(null)}
                    />
                )}
            </AnimatePresence>

        </PageTransition>
    );
};

export default Fees;
