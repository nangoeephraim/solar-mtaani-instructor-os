import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppData, FeePayment, FeeStructure, Student, PaymentMethod, StudentFeeBalance, PaymentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PageTransition from './PageTransition';
import {
    Wallet, Search, Plus, X, CreditCard, Banknote, Users, Filter, ChevronDown, 
    CheckCircle, Clock, Receipt, DollarSign, FileText, Smartphone, MessageSquare, 
    Download, Sparkles, ChevronUp, BarChart3, HelpCircle, CalendarRange
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
   Animated Counter Component (Typographically Clean)
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
   Main Fees Component
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
    const [expandedStudentId, setExpandedStudentId] = useState<number | null>(null);
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

    /* ─── Handlers ─── */
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
        if (status === 'completed') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400';
        if (status === 'pending') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 animate-pulse';
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';
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
                            <span>Fees Balance Ledger</span>
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Monitor targets, review transaction ledger and record payments in real time.
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={() => setShowAddFee(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold text-xs transition-colors shadow-sm"
                        >
                            Configure Fee
                        </button>
                        <button 
                            onClick={() => setShowAddPayment(true)}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold text-xs transition-colors shadow-sm"
                        >
                            Record Payment
                        </button>
                    </div>
                </motion.div>

                {/* Minimal Single-Canvas Dashboard Block */}
                <motion.div 
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6"
                >
                    <div className="space-y-4 flex-1">
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Net Collections</span>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-4xl font-google font-medium text-slate-900 dark:text-white tracking-tight">
                                    <AnimatedNumber value={totalCollected} prefix="KES " />
                                </h2>
                                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                                    collected
                                </span>
                            </div>
                        </div>

                        {/* Linear Clean Target Scale */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <span>Target Progress: {collectionRate.toFixed(1)}%</span>
                                <span>Target KES {totalExpected.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${collectionRate}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-slate-900 dark:bg-white rounded-full"
                                />
                            </div>
                        </div>

                        {/* Simple sub-metrics layout */}
                        <div className="flex items-center gap-6 pt-1 text-xs">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                <span className="text-slate-500 dark:text-slate-400">Pending: </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">KES {totalPending.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500" />
                                <span className="text-slate-500 dark:text-slate-400">Deficits: </span>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{studentsWithBalanceCount} accounts</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between items-start md:items-end border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 md:pl-6 pt-4 md:pt-0 shrink-0">
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-[240px] md:text-right">
                            Track real-time collections and outstanding student balances across Terms.
                        </p>
                        
                        <button 
                            onClick={() => setShowAnalytics(!showAnalytics)}
                            className="mt-4 px-3.5 py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <BarChart3 size={13} />
                            <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
                        </button>
                    </div>
                </motion.div>

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
                                    {t === 'overview' ? 'Students' : t === 'payments' ? 'Ledger History' : 'Billed Structures'}
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
                                placeholder="Search student or receipt..."
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
                                    <option value="balance-desc">Balance: High to Low</option>
                                    <option value="balance-asc">Balance: Low to High</option>
                                    <option value="name">Name A-Z</option>
                                    <option value="last-payment">Recently Paid</option>
                                </select>
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

                {/* ═══ TAB CONTENT: OVERVIEW ═══ */}
                <AnimatePresence mode="wait">
                    {tab === 'overview' && (
                        <motion.div 
                            key="overview"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm"
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                                            <th className="px-6 py-4 font-bold text-[9px]">Student account</th>
                                            <th className="px-4 py-4 font-bold text-[9px]">Cohort Group</th>
                                            <th className="px-4 py-4 font-bold text-[9px] w-48">Settlement progress</th>
                                            <th className="px-4 py-4 font-bold text-[9px] text-right">Paid</th>
                                            <th className="px-6 py-4 font-bold text-[9px] text-right">Outstanding balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/60 dark:divide-slate-800/40">
                                        {filteredBalances.length > 0 ? filteredBalances.map(bal => {
                                            const student = students.find(s => s.id === bal.studentId);
                                            const isExpanded = expandedStudentId === bal.studentId;
                                            const pctPaid = bal.totalFees > 0 ? (bal.totalPaid / bal.totalFees) * 100 : 0;

                                            return (
                                                <React.Fragment key={bal.studentId}>
                                                    <tr 
                                                        onClick={() => setExpandedStudentId(isExpanded ? null : bal.studentId)}
                                                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors"
                                                    >
                                                        {/* Name info */}
                                                        <td className="px-6 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-400 text-[10px] shrink-0 border border-slate-200/30 dark:border-slate-700/20">
                                                                    {bal.studentName.split(' ').map(n => n[0]).slice(0,2).join('')}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 dark:text-slate-200">{bal.studentName}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-0.5">Grade {student?.grade || 'N/A'} · Lot {student?.lot || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Group badge */}
                                                        <td className="px-4 py-3.5">
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800 px-2 py-0.5 rounded">
                                                                {student?.studentGroup}
                                                            </span>
                                                        </td>

                                                        {/* Progress scale */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="space-y-1">
                                                                <span className="text-[10px] font-bold text-slate-400 block">{pctPaid.toFixed(0)}% Settled</span>
                                                                <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                                                                    <div 
                                                                        style={{ width: `${pctPaid}%` }} 
                                                                        className={clsx("h-full rounded-full", 
                                                                            pctPaid >= 100 ? 'bg-slate-900 dark:bg-white' : 'bg-slate-400 dark:bg-slate-500'
                                                                        )}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Paid amount */}
                                                        <td className="px-4 py-3.5 text-right font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                                                            KES {bal.totalPaid.toLocaleString()}
                                                        </td>

                                                        {/* Balance remaining */}
                                                        <td className="px-6 py-3.5 text-right font-bold tabular-nums">
                                                            <div className="flex items-center justify-end gap-3.5">
                                                                <span className={clsx(bal.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400')}>
                                                                    KES {bal.balance.toLocaleString()}
                                                                </span>
                                                                <span className="text-slate-300 dark:text-slate-700">
                                                                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {/* Expanded Student Drawer Details */}
                                                    {isExpanded && (
                                                        <tr>
                                                            <td colSpan={5} className="bg-slate-50/40 dark:bg-slate-900/30 p-0">
                                                                <motion.div 
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    className="overflow-hidden border-b border-slate-100 dark:border-slate-800/80 px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-8 text-xs"
                                                                >
                                                                    <div className="space-y-3">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Ledger Logs</span>
                                                                        <div className="space-y-1.5">
                                                                            {bal.payments && bal.payments.length > 0 ? (
                                                                                bal.payments.map(p => (
                                                                                    <div key={p.id} className="flex justify-between items-center p-2 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg">
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-[9px] font-bold text-slate-500 uppercase">{p.method}</span>
                                                                                            <span className="text-[10px] text-slate-400">{new Date(p.transactionDate).toLocaleDateString()}</span>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-2 font-bold">
                                                                                            <span className={clsx("text-[9px] px-1 rounded uppercase", p.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50')}>
                                                                                                {p.status}
                                                                                            </span>
                                                                                            <span className="tabular-nums">KES {p.amount.toLocaleString()}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                ))
                                                                            ) : (
                                                                                <p className="text-xs text-slate-400 italic">No ledger transaction logs recorded.</p>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <div className="space-y-1">
                                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Account metadata</span>
                                                                            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-xl space-y-2 text-slate-600 dark:text-slate-400">
                                                                                <div className="flex justify-between">
                                                                                    <span>Guardian name:</span>
                                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student?.guardianName || 'Not Set'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span>Guardian contact:</span>
                                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student?.guardianPhone || 'Not Set'}</span>
                                                                                </div>
                                                                                <div className="flex justify-between">
                                                                                    <span>Enrollment date:</span>
                                                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student?.enrollmentDate ? new Date(student.enrollmentDate).toLocaleDateString() : 'N/A'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            {bal.balance > 0 && student?.guardianPhone && (
                                                                                <button 
                                                                                    onClick={() => onSendReminder(bal.studentName, student.guardianPhone!, bal.balance)}
                                                                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                                                                                >
                                                                                    <MessageSquare size={12} />
                                                                                    <span>Send reminder SMS</span>
                                                                                </button>
                                                                            )}
                                                                            <button 
                                                                                onClick={() => { setPayStudentId(bal.studentId); setShowAddPayment(true); }}
                                                                                className="px-3 py-1.5 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg font-bold text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                                                                            >
                                                                                <Plus size={12} />
                                                                                <span>Add payment record</span>
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </React.Fragment>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan={5} className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900">
                                                    <Users size={32} className="mx-auto mb-3 opacity-25" />
                                                    <p className="font-bold text-sm">No billing records found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ═══ TAB CONTENT: PAYMENTS LEDGER ═══ */}
                    {tab === 'payments' && (
                        <motion.div 
                            key="payments"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {Object.keys(groupedPayments).length > 0 ? (
                                <div className="space-y-6">
                                    {Object.entries(groupedPayments).map(([dateStr, paymentList]) => (
                                        <div key={dateStr} className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{dateStr}</span>
                                                <div className="h-px bg-slate-100 dark:bg-slate-800/80 flex-1" />
                                            </div>

                                            <div className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-slate-100/60 dark:divide-slate-800/40">
                                                {paymentList.map(payment => (
                                                    <div 
                                                        key={payment.id}
                                                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-4 flex-1">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800/60 flex items-center justify-center border border-slate-200/30 dark:border-slate-700/20 text-slate-500 shrink-0">
                                                                {payment.method === 'mpesa' ? <Smartphone size={14} /> : payment.method === 'bank_transfer' ? <CreditCard size={14} /> : <Banknote size={14} />}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-slate-800 dark:text-slate-200">{payment.studentName}</h4>
                                                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                                                    <span className="capitalize">{payment.method} Ledger</span>
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

                                                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-3.5 sm:pt-0">
                                                            <div className="flex items-center gap-4">
                                                                <span className={clsx("text-[9px] font-black uppercase px-2 py-0.5 rounded-md", statusBadgeStyle(payment.status))}>
                                                                    {payment.status}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400">Rec by {payment.recordedBy}</span>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <span className="font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                                                                    KES {payment.amount.toLocaleString()}
                                                                </span>

                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    {payment.status === 'completed' && (
                                                                        <button 
                                                                            onClick={() => setSelectedReceiptPayment(payment)}
                                                                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                                                            title="Download Invoice PDF"
                                                                        >
                                                                            <Download size={13} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        onClick={async () => {
                                                                            if (confirm("Permanently delete this payment record from the database ledger?")) {
                                                                                await onDeletePayment(payment.id);
                                                                            }
                                                                        }}
                                                                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                                        title="Delete record"
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
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No transaction records found</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search parameters.</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ═══ TAB CONTENT: FEE STRUCTURES ═══ */}
                    {tab === 'structures' && (
                        <motion.div 
                            key="structures"
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
                                        className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between min-h-[170px]"
                                    >
                                        <div className="space-y-3.5">
                                            <div className="flex items-start justify-between">
                                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-800 text-slate-500">
                                                    <FileText size={15} />
                                                </div>
                                                <button 
                                                    onClick={() => onDeleteFeeStructure(fee.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>

                                            <div className="space-y-1">
                                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">{fee.name}</h4>
                                                <p className="text-xl font-google font-medium text-slate-900 dark:text-white tabular-nums">
                                                    KES {fee.amount.toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                {fee.term && <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded uppercase">Term {fee.term}</span>}
                                                {fee.studentGroup && <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded uppercase">{fee.studentGroup}</span>}
                                                {fee.isRecurring && <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800/80 border border-slate-200/40 dark:border-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded uppercase">Recurring</span>}
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                                            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                                                <span>Settlement Rate ({paidCount}/{targetedStudents.length})</span>
                                                <span>{completionRate.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                                                <div 
                                                    style={{ width: `${completionRate}%` }} 
                                                    className="h-full bg-slate-900 dark:bg-white rounded-full" 
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }) : (
                                <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-sm">
                                    <FileText size={40} className="mx-auto mb-3 opacity-20" />
                                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">No custom fee structures configured</p>
                                    <p className="text-xs text-slate-400 mt-1 mb-5">Create custom billing rules to define targeted charges.</p>
                                    <button 
                                        onClick={() => setShowAddFee(true)}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                                    >
                                        Setup Billing Config
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
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <h3 className="font-google font-bold text-slate-800 dark:text-white text-base">
                                        Record Payment Receipt
                                    </h3>
                                    <button onClick={() => setShowAddPayment(false)} className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    {/* Student Selector */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Student Account</label>
                                        <select 
                                            value={payStudentId === '' ? '' : payStudentId.toString()} 
                                            onChange={e => setPayStudentId(e.target.value)} 
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors cursor-pointer"
                                        >
                                            <option value="">Select Student...</option>
                                            {students.map(s => <option key={s.id} value={s.id.toString()}>{s.name} ({s.studentGroup})</option>)}
                                        </select>
                                    </div>

                                    {/* Balance display */}
                                    {payStudentId && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/40 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                                            <span className="text-slate-400">Total Outstanding deficit:</span>
                                            <span className="font-bold text-rose-600 dark:text-rose-400">
                                                KES {(studentBalances.find(b => b.studentId.toString() === payStudentId.toString())?.balance || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}

                                    {/* Amount */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Amount (KES)</label>
                                        <input 
                                            type="number" 
                                            value={payAmount} 
                                            onChange={e => setPayAmount(e.target.value)} 
                                            placeholder="e.g. 15000"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors" 
                                        />
                                    </div>

                                    {/* Method selector */}
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Gateway Channel</label>
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
                                                        payMethod === m.val ? 'border-slate-900 bg-slate-50 dark:border-white dark:bg-slate-800 text-slate-900 dark:text-white' : 'border-slate-200/60 dark:border-slate-850 text-slate-400 hover:border-slate-300'
                                                    )}
                                                >
                                                    {m.icon}
                                                    <span>{m.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* M-Pesa Push Contact */}
                                    {payMethod === 'mpesa' && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Customer Mobile Number</label>
                                            <input 
                                                type="tel" 
                                                value={payPhone} 
                                                onChange={e => setPayPhone(e.target.value)} 
                                                placeholder="e.g. 0712345678"
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors" 
                                            />
                                        </motion.div>
                                    )}

                                    {/* Fee Category & Term Selection */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fee Category</label>
                                            <select 
                                                value={payFeeId} 
                                                onChange={e => setPayFeeId(e.target.value)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                                            >
                                                <option value="">General Balance</option>
                                                {feeStructures.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Term</label>
                                            <select 
                                                value={payTerm.toString()} 
                                                onChange={e => setPayTerm(Number(e.target.value) as 1 | 2 | 3)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                                            >
                                                <option value="1">Term 1</option>
                                                <option value="2">Term 2</option>
                                                <option value="3">Term 3</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Reference notes</label>
                                        <input 
                                            type="text" 
                                            value={payNotes} 
                                            onChange={e => setPayNotes(e.target.value)} 
                                            placeholder="Receipt reference details..."
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors" 
                                        />
                                    </div>

                                    <button 
                                        onClick={handleAddPayment} 
                                        disabled={!payStudentId || !payAmount}
                                        className="w-full py-3.5 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 dark:hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        {payMethod === 'mpesa' ? 'Send M-Pesa STK Request' : 'Record Ledger Payment'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ MODAL: ADD FEE STRUCTURE ═══ */}
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
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                    <h3 className="font-google font-bold text-slate-800 dark:text-white text-base">
                                        Setup Billing Config
                                    </h3>
                                    <button onClick={() => setShowAddFee(false)} className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                
                                <div className="p-6 space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Billing Identifier</label>
                                        <input 
                                            type="text" 
                                            value={feeName} 
                                            onChange={e => setFeeName(e.target.value)} 
                                            placeholder="e.g. Tuition Fee Term 2"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors" 
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Amount (KES)</label>
                                        <input 
                                            type="number" 
                                            value={feeAmount} 
                                            onChange={e => setFeeAmount(e.target.value)} 
                                            placeholder="e.g. 25000"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors" 
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3.5">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Term</label>
                                            <select 
                                                value={feeTerm === undefined ? '' : feeTerm.toString()} 
                                                onChange={e => setFeeTerm(e.target.value ? Number(e.target.value) as 1 | 2 | 3 : undefined)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
                                            >
                                                <option value="">All Terms</option>
                                                <option value="1">Term 1</option>
                                                <option value="2">Term 2</option>
                                                <option value="3">Term 3</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Target Group</label>
                                            <select 
                                                value={feeGroup} 
                                                onChange={e => setFeeGroup(e.target.value)} 
                                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none text-slate-700 dark:text-slate-350 cursor-pointer"
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
                                            <span className="font-bold text-slate-800 dark:text-slate-200">Recurring Billing</span>
                                            <span className="text-[10px] text-slate-400">Bill automatically every term.</span>
                                        </div>
                                    </label>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Brief description</label>
                                        <input 
                                            type="text" 
                                            value={feeDesc} 
                                            onChange={e => setFeeDesc(e.target.value)} 
                                            placeholder="e.g. Mandatory Tuition fee"
                                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-355 outline-none focus:border-slate-400 dark:focus:border-slate-600 transition-colors" 
                                        />
                                    </div>

                                    <button 
                                        onClick={handleAddFee} 
                                        disabled={!feeName || !feeAmount}
                                        className="w-full py-3.5 mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-800 dark:hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                    >
                                        Create Billing Config
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
