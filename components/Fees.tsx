import React, { useState, useMemo } from 'react';
import { AppData, FeePayment, FeeStructure, Student, PaymentMethod, StudentFeeBalance, PaymentStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import PageTransition from './PageTransition';
import {
    Wallet, Search, Plus, X, Send, Phone, CreditCard, Banknote, ArrowUpRight,
    TrendingUp, TrendingDown, Users, Filter, ChevronDown, CheckCircle, Clock,
    AlertTriangle, Receipt, DollarSign, FileText, MoreHorizontal, Smartphone,
    MessageSquare, Download
} from 'lucide-react';
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
   Summary Stat Card
   ───────────────────────────────────────────── */
const SummaryCard: React.FC<{
    icon: React.ReactNode; label: string; value: string; sub: string;
    gradient: string; delay?: number;
}> = ({ icon, label, value, sub, gradient, delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, type: 'spring', stiffness: 260, damping: 24 }}
        className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm overflow-hidden"
    >
        <div className={clsx('h-1 w-full', gradient)} />
        <div className="p-5">
            <div className="flex items-center gap-2.5 mb-3">
                <div className={clsx('p-2.5 rounded-xl text-white shadow-md', gradient)}>{icon}</div>
                <span className="text-[10px] font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-[0.12em]">{label}</span>
            </div>
            <p className="text-3xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums">{value}</p>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] font-medium mt-1">{sub}</p>
        </div>
    </motion.div>
);

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
const Fees: React.FC<FeesProps> = ({
    data, onAddPayment, onAddFeeStructure, onDeletePayment,
    onDeleteFeeStructure, onInitiateMpesa, onSendReminder, onNavigate
}) => {
    const { user } = useAuth();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
    const [termFilter, setTermFilter] = useState<0 | 1 | 2 | 3>(0);
    const [showAddPayment, setShowAddPayment] = useState(false);
    const [showAddFee, setShowAddFee] = useState(false);
    const [tab, setTab] = useState<'overview' | 'payments' | 'structures'>('overview');

    // Form states
    const [payStudentId, setPayStudentId] = useState<number | string>('');
    const [payAmount, setPayAmount] = useState('');
    const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
    const [payPhone, setPayPhone] = useState('');
    const [payNotes, setPayNotes] = useState('');
    const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<FeePayment | null>(null);
    const [payTerm, setPayTerm] = useState<1 | 2 | 3>(1);
    const [payFeeId, setPayFeeId] = useState('');

    const [feeName, setFeeName] = useState('');
    const [feeAmount, setFeeAmount] = useState('');
    const [feeTerm, setFeeTerm] = useState<1 | 2 | 3 | undefined>(undefined);
    const [feeRecurring, setFeeRecurring] = useState(false);
    const [feeDesc, setFeeDesc] = useState('');

    /* ─── Derived Data ─── */
    const payments = data.payments || [];
    const feeStructures = data.feeStructures || [];
    const students = data.students || [];

    const totalCollected = useMemo(() =>
        payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0)
        , [payments]);

    const totalPending = useMemo(() =>
        payments.filter(p => p.status?.toLowerCase() === 'pending').reduce((sum, p) => sum + p.amount, 0)
        , [payments]);

    const totalExpectedPerTerm = useMemo(() =>
        feeStructures.reduce((sum, f) => sum + f.amount, 0) * students.length
        , [feeStructures, students]);

    const completedCount = payments.filter(p => p.status?.toLowerCase() === 'completed').length;
    const mpesaCount = payments.filter(p => p.method?.toLowerCase() === 'mpesa' && p.status?.toLowerCase() === 'completed').length;

    // Student balance list
    const studentBalances: StudentFeeBalance[] = useMemo(() => {
        return students.map(student => {
            const studentPayments = payments.filter(p => p.studentId === student.id);
            const totalPaid = studentPayments.filter(p => p.status?.toLowerCase() === 'completed').reduce((s, p) => s + p.amount, 0);
            const totalFees = feeStructures.reduce((s, f) => s + f.amount, 0);
            const lastPayment = studentPayments.filter(p => p.status?.toLowerCase() === 'completed').sort((a, b) => b.transactionDate.localeCompare(a.transactionDate))[0];
            return {
                studentId: student.id,
                studentName: student.name,
                totalFees,
                totalPaid,
                balance: totalFees - totalPaid,
                lastPaymentDate: lastPayment?.transactionDate,
                payments: studentPayments
            };
        }).sort((a, b) => b.balance - a.balance);
    }, [students, payments, feeStructures]);

    const filteredPayments = useMemo(() => {
        let list = payments;
        if (filter !== 'all') {
            if (filter === 'failed') {
                list = list.filter(p => p.status?.toLowerCase() === 'failed' || p.status?.toLowerCase() === 'cancelled');
            } else {
                list = list.filter(p => p.status?.toLowerCase() === filter);
            }
        }
        if (termFilter > 0) list = list.filter(p => p.term === termFilter);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(p => p.studentName.toLowerCase().includes(q) || p.mpesaReceiptNumber?.toLowerCase().includes(q));
        }
        return list;
    }, [payments, filter, termFilter, search]);

    const filteredBalances = useMemo(() => {
        if (!search) return studentBalances;
        const q = search.toLowerCase();
        return studentBalances.filter(b => b.studentName.toLowerCase().includes(q));
    }, [studentBalances, search]);

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

        // For M-Pesa payments, embed the checkoutRequestId in the notes field
        // so the mpesa-callback Edge Function can locate and update this payment.
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
            isRecurring: feeRecurring,
            description: feeDesc || undefined
        });
        setShowAddFee(false);
        setFeeName('');
        setFeeAmount('');
        setFeeDesc('');
        setFeeRecurring(false);
        setFeeTerm(undefined);
    };

    const methodIcon = (m: PaymentMethod) => {
        if (m === 'mpesa') return <Smartphone size={14} className="text-green-600" />;
        if (m === 'bank_transfer') return <CreditCard size={14} className="text-blue-600" />;
        return <Banknote size={14} className="text-amber-600" />;
    };

    const statusBadge = (status: string) => {
        const map: Record<string, string> = {
            completed: 'bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
            pending: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
            failed: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400',
            cancelled: 'bg-gray-100 dark:bg-gray-800/20 text-gray-600 dark:text-gray-400',
        };
        return <span className={clsx('text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg', map[status] || map.pending)}>{status}</span>;
    };

    /* ─── RENDER ─── */
    return (
        <PageTransition>
            <div className="space-y-6 pb-12 max-w-[1400px] mx-auto font-sans">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-google font-black text-[var(--md-sys-color-on-surface)] tracking-tight flex items-center gap-3">
                            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-md">
                                <Wallet size={22} />
                            </div>
                            Fee Management
                        </h1>
                        <p className="text-sm text-[var(--md-sys-color-secondary)] mt-1">Track payments, manage fees, and send M-Pesa requests</p>
                    </div>
                    <div className="flex gap-3">
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAddFee(true)}
                            className="px-4 py-2.5 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-on-surface)] rounded-xl font-bold text-sm hover:bg-[var(--md-sys-color-surface-variant)] transition-colors flex items-center gap-2">
                            <FileText size={16} /> Add Fee Type
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowAddPayment(true)}
                            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-shadow flex items-center gap-2">
                            <Plus size={16} /> Record Payment
                        </motion.button>
                    </div>
                </motion.div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <SummaryCard icon={<DollarSign size={20} />} label="Total Collected" value={`KES ${totalCollected.toLocaleString()}`} sub={`${completedCount} payments received`} gradient="bg-gradient-to-r from-emerald-500 to-green-600" delay={0.1} />
                    <SummaryCard icon={<Clock size={20} />} label="Pending" value={`KES ${totalPending.toLocaleString()}`} sub="Awaiting confirmation" gradient="bg-gradient-to-r from-amber-400 to-orange-500" delay={0.15} />
                    <SummaryCard icon={<Smartphone size={20} />} label="M-Pesa" value={`${mpesaCount}`} sub="Payments via M-Pesa" gradient="bg-gradient-to-r from-green-600 to-lime-500" delay={0.2} />
                    <SummaryCard icon={<Users size={20} />} label="Outstanding" value={`${studentBalances.filter(b => b.balance > 0).length}`} sub="Students with balance" gradient="bg-gradient-to-r from-red-400 to-rose-500" delay={0.25} />
                </div>

                {/* Tab Bar */}
                <div className="flex gap-1 bg-[var(--md-sys-color-surface-variant)] p-1 rounded-2xl w-fit">
                    {(['overview', 'payments', 'structures'] as const).map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={clsx(
                                'px-5 py-2 rounded-xl text-sm font-bold transition-all capitalize',
                                tab === t ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] shadow-sm' : 'text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]'
                            )}
                        >
                            {t === 'structures' ? 'Fee Types' : t}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--md-sys-color-secondary)]" />
                    <input
                        type="text"
                        placeholder="Search students or receipts..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] rounded-2xl text-sm text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-secondary)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] transition-shadow"
                    />
                </div>

                {/* ═══ TAB: OVERVIEW ═══ */}
                {tab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                            <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)]">Student Balances</h3>
                            <span className="text-xs text-[var(--md-sys-color-secondary)]">{filteredBalances.length} students</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)]">
                                        <th className="text-left px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Student</th>
                                        <th className="text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Total Fees</th>
                                        <th className="text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Paid</th>
                                        <th className="text-right px-4 py-3 font-bold text-[10px] uppercase tracking-widest">Balance</th>
                                        <th className="text-right px-6 py-3 font-bold text-[10px] uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBalances.length > 0 ? filteredBalances.slice(0, 20).map((bal, idx) => {
                                        const student = students.find(s => s.id === bal.studentId);
                                        return (
                                            <motion.tr
                                                key={bal.studentId}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.02 }}
                                                className="border-b border-[var(--md-sys-color-outline-variant)]/50 hover:bg-[var(--md-sys-color-surface-variant)]/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-[var(--md-sys-color-on-surface)]">{bal.studentName}</p>
                                                    {bal.lastPaymentDate && <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5">Last paid: {new Date(bal.lastPaymentDate).toLocaleDateString()}</p>}
                                                </td>
                                                <td className="text-right px-4 py-4 font-medium text-[var(--md-sys-color-on-surface-variant)] tabular-nums">KES {bal.totalFees.toLocaleString()}</td>
                                                <td className="text-right px-4 py-4 font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">KES {bal.totalPaid.toLocaleString()}</td>
                                                <td className="text-right px-4 py-4">
                                                    <span className={clsx('font-black tabular-nums', bal.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400')}>
                                                        KES {bal.balance.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="text-right px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {bal.balance > 0 && student?.guardianPhone && (
                                                            <button onClick={() => onSendReminder(bal.studentName, student.guardianPhone!, bal.balance)}
                                                                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors tap-target" title="Send SMS Reminder">
                                                                <MessageSquare size={14} />
                                                            </button>
                                                        )}
                                                        <button onClick={() => { setPayStudentId(bal.studentId); setShowAddPayment(true); }}
                                                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors tap-target" title="Record Payment">
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    }) : (
                                        <tr><td colSpan={5} className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                            <Users size={36} className="mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">No students found</p>
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* ═══ TAB: PAYMENTS ═══ */}
                {tab === 'payments' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[var(--md-sys-color-surface)] rounded-3xl border border-[var(--md-sys-color-outline-variant)] shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center justify-between gap-3">
                            <h3 className="font-google font-bold text-[var(--md-sys-color-on-surface)]">Payment History</h3>
                            <div className="flex gap-2 flex-wrap">
                                {(['all', 'completed', 'pending', 'failed'] as const).map(f => (
                                    <button key={f} onClick={() => setFilter(f)}
                                        className={clsx('px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all',
                                            filter === f ? 'bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] shadow-sm' : 'bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:text-[var(--md-sys-color-on-surface)]')}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/50">
                            {filteredPayments.length > 0 ? filteredPayments.slice(0, 30).map((payment, idx) => (
                                <motion.div
                                    key={payment.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.02 }}
                                    className="px-6 py-4 flex items-center gap-4 hover:bg-[var(--md-sys-color-surface-variant)]/30 transition-colors"
                                >
                                    <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-variant)]">
                                        {methodIcon(payment.method)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-[var(--md-sys-color-on-surface)] truncate">{payment.studentName}</p>
                                        <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-0.5 flex items-center gap-2">
                                            <span>{new Date(payment.transactionDate).toLocaleDateString()} · {payment.method.toUpperCase()}</span>
                                            {payment.mpesaReceiptNumber && <span className="font-mono">#{payment.mpesaReceiptNumber}</span>}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                                        {statusBadge(payment.status)}
                                        <span className="font-black text-[var(--md-sys-color-on-surface)] tabular-nums">KES {payment.amount.toLocaleString()}</span>
                                        {payment.status?.toLowerCase() === 'completed' && (
                                            <button
                                                onClick={() => setSelectedReceiptPayment(payment)}
                                                className="ml-2 p-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-secondary)] hover:bg-[var(--md-sys-color-primary)] hover:text-[var(--md-sys-color-on-primary)] transition-colors tap-target"
                                                title="Generate Receipt"
                                            >
                                                <Download size={14} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-12 text-[var(--md-sys-color-secondary)]">
                                    <Receipt size={36} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No payments found</p>
                                    <p className="text-xs mt-1">Record a payment to get started</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ═══ TAB: STRUCTURES ═══ */}
                {tab === 'structures' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {feeStructures.length > 0 ? feeStructures.map((fee, idx) => (
                            <motion.div
                                key={fee.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-[var(--md-sys-color-surface)] rounded-2xl border border-[var(--md-sys-color-outline-variant)] shadow-sm p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                                        <FileText size={16} className="text-green-600 dark:text-green-400" />
                                    </div>
                                    <button onClick={() => onDeleteFeeStructure(fee.id)}
                                        className="p-1.5 rounded-lg text-[var(--md-sys-color-secondary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors tap-target" title="Delete">
                                        <X size={14} />
                                    </button>
                                </div>
                                <h4 className="font-bold text-[var(--md-sys-color-on-surface)] mb-1">{fee.name}</h4>
                                <p className="text-2xl font-google font-black text-[var(--md-sys-color-on-surface)] tabular-nums">KES {fee.amount.toLocaleString()}</p>
                                <div className="flex items-center gap-2 mt-3 flex-wrap">
                                    {fee.term && <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md uppercase">Term {fee.term}</span>}
                                    {fee.isRecurring && <span className="text-[9px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md uppercase">Recurring</span>}
                                    {fee.studentGroup && <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md uppercase">{fee.studentGroup}</span>}
                                </div>
                                {fee.description && <p className="text-xs text-[var(--md-sys-color-secondary)] mt-2">{fee.description}</p>}
                            </motion.div>
                        )) : (
                            <div className="col-span-full text-center py-16 text-[var(--md-sys-color-secondary)]">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-lg mb-1">No fee types defined</p>
                                <p className="text-sm">Create fee structures like &quot;Term 1 Tuition&quot; or &quot;Registration Fee&quot;</p>
                                <button onClick={() => setShowAddFee(true)}
                                    className="mt-4 px-5 py-2.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-xl font-bold text-sm">
                                    <Plus size={16} className="inline mr-1" /> Add First Fee Type
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ═══ MODAL: ADD PAYMENT ═══ */}
                <AnimatePresence>
                    {showAddPayment && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setShowAddPayment(false)}>
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                className="bg-[var(--md-sys-color-surface)] rounded-3xl shadow-xl border border-[var(--md-sys-color-outline-variant)] w-full max-w-md max-h-[90vh] overflow-y-auto"
                                onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                                    <h3 className="font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]">Record Payment</h3>
                                    <button onClick={() => setShowAddPayment(false)} className="p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    {/* Student Select */}
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Student</label>
                                        <select value={payStudentId === '' ? '' : payStudentId.toString()} onChange={e => setPayStudentId(e.target.value)} title="Select student"
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]">
                                            <option value="">Select student...</option>
                                            {students.map(s => <option key={s.id} value={s.id.toString()}>{s.name} ({s.grade} - {s.subject})</option>)}
                                        </select>
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Amount (KES)</label>
                                        <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="5000"
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                                    </div>

                                    {/* Method */}
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Payment Method</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {([
                                                { val: 'cash' as const, icon: <Banknote size={18} />, label: 'Cash', color: 'amber' },
                                                { val: 'mpesa' as const, icon: <Smartphone size={18} />, label: 'M-Pesa', color: 'green' },
                                                { val: 'bank_transfer' as const, icon: <CreditCard size={18} />, label: 'Bank', color: 'blue' },
                                            ]).map(m => (
                                                <button key={m.val} onClick={() => setPayMethod(m.val)}
                                                    className={clsx(
                                                        'p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 text-xs font-bold transition-all',
                                                        payMethod === m.val ? `border-${m.color}-500 bg-${m.color}-50 dark:bg-${m.color}-900/20 text-${m.color}-700 dark:text-${m.color}-400` : 'border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-secondary)] hover:border-[var(--md-sys-color-outline)]'
                                                    )}>
                                                    {m.icon}{m.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* M-Pesa Phone */}
                                    {payMethod === 'mpesa' && (
                                        <div>
                                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">M-Pesa Phone Number</label>
                                            <input type="tel" value={payPhone} onChange={e => setPayPhone(e.target.value)} placeholder="07XX XXX XXX"
                                                className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-green-500" />
                                            <p className="text-[10px] text-[var(--md-sys-color-secondary)] mt-1.5 flex items-center gap-1">
                                                <Smartphone size={10} /> An STK push will be sent to this phone
                                            </p>
                                        </div>
                                    )}

                                    {/* Fee Type & Term */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Fee Type</label>
                                            <select value={payFeeId} onChange={e => setPayFeeId(e.target.value)} title="Fee type"
                                                className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm outline-none text-[var(--md-sys-color-on-surface)]">
                                                <option value="">General</option>
                                                {feeStructures.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Term</label>
                                            <select value={payTerm.toString()} onChange={e => setPayTerm(Number(e.target.value) as 1 | 2 | 3)} title="Term"
                                                className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm outline-none text-[var(--md-sys-color-on-surface)]">
                                                <option value="1">Term 1</option>
                                                <option value="2">Term 2</option>
                                                <option value="3">Term 3</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Notes (Optional)</label>
                                        <input type="text" value={payNotes} onChange={e => setPayNotes(e.target.value)} placeholder="Additional details..."
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                                    </div>

                                    <button onClick={handleAddPayment} disabled={!payStudentId || !payAmount}
                                        className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
                                        {payMethod === 'mpesa' ? <><Smartphone size={16} /> Send M-Pesa Request</> : <><CheckCircle size={16} /> Record Payment</>}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ═══ MODAL: ADD FEE STRUCTURE ═══ */}
                <AnimatePresence>
                    {showAddFee && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
                            onClick={() => setShowAddFee(false)}>
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                                className="bg-[var(--md-sys-color-surface)] rounded-3xl shadow-xl border border-[var(--md-sys-color-outline-variant)] w-full max-w-md"
                                onClick={e => e.stopPropagation()}>
                                <div className="p-6 border-b border-[var(--md-sys-color-outline-variant)] flex items-center justify-between">
                                    <h3 className="font-google font-bold text-lg text-[var(--md-sys-color-on-surface)]">Add Fee Type</h3>
                                    <button onClick={() => setShowAddFee(false)} className="p-2 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] transition-colors">
                                        <X size={18} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Fee Name</label>
                                        <input type="text" value={feeName} onChange={e => setFeeName(e.target.value)} placeholder="e.g. Term 1 Tuition"
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Amount (KES)</label>
                                        <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} placeholder="25000"
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Term (Optional)</label>
                                        <select value={feeTerm === undefined ? '' : feeTerm.toString()} onChange={e => setFeeTerm(e.target.value ? Number(e.target.value) as 1 | 2 | 3 : undefined)} title="Term"
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm outline-none text-[var(--md-sys-color-on-surface)]">
                                            <option value="">All terms</option>
                                            <option value="1">Term 1</option>
                                            <option value="2">Term 2</option>
                                            <option value="3">Term 3</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-3 cursor-pointer p-3 bg-[var(--md-sys-color-surface-variant)] rounded-xl">
                                        <input type="checkbox" checked={feeRecurring} onChange={e => setFeeRecurring(e.target.checked)}
                                            className="w-5 h-5 rounded-md accent-[var(--md-sys-color-primary)]" />
                                        <span className="text-sm font-medium text-[var(--md-sys-color-on-surface)]">Recurring every term</span>
                                    </label>
                                    <div>
                                        <label className="text-xs font-bold text-[var(--md-sys-color-secondary)] uppercase tracking-wider mb-1.5 block">Description (Optional)</label>
                                        <input type="text" value={feeDesc} onChange={e => setFeeDesc(e.target.value)} placeholder="Brief description..."
                                            className="w-full p-3 bg-[var(--md-sys-color-surface-variant)] border border-[var(--md-sys-color-outline-variant)] rounded-xl text-sm text-[var(--md-sys-color-on-surface)] outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]" />
                                    </div>
                                    <button onClick={handleAddFee} disabled={!feeName || !feeAmount}
                                        className="w-full py-3.5 bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                                        Create Fee Type
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
