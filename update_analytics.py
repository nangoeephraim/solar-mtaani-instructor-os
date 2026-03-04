import re

with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\StudentAnalytics.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make Smart Insights card look better
smart_insights_old = """                        {/* AI Insights Card */}
                        <motion.div
                            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 p-5 shadow-sm"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400 mt-1">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-900 dark:text-blue-100 text-sm mb-1 flex items-center gap-2">
                                        Smart Insights <span className="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-[10px] rounded-full uppercase tracking-widest text-blue-700 dark:text-blue-300">Beta</span>
                                    </h3>
                                    <p className="text-sm text-blue-800/80 dark:text-blue-200/80 leading-relaxed">
                                        {studentAvg >= classAvg ? (
                                            <><strong>{student.name}</strong> is performing <span className="text-emerald-600 dark:text-emerald-400 font-bold">above class average</span> (+{(studentAvg - classAvg).toFixed(1)} pts). They show exceptional mastery. Consider assigning advanced technical projects. Period attendance is {dynamicAttendancePct}%, which is {dynamicAttendancePct >= 85 ? 'excellent' : 'a potential area of concern'}.</>
                                        ) : (
                                            <><strong>{student.name}</strong> is performing <span className="text-amber-600 dark:text-amber-400 font-bold">below class average</span>. Focus on foundational theory to build confidence before attempting complex practicals. Period attendance is {dynamicAttendancePct}%. A 1-on-1 check-in is recommended.</>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </motion.div>"""

smart_insights_new = """                        {/* AI Insights - Redesigned into actionable categories */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                        >
                            <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800 p-5 shadow-sm">
                                <h3 className="font-bold text-emerald-900 dark:text-emerald-100 text-sm mb-2 flex items-center gap-2">
                                    <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400" /> Strengths
                                </h3>
                                <p className="text-xs text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed">
                                    {studentAvg >= classAvg ? (
                                        <>Performing <span className="font-bold">above class average</span> (+{(studentAvg - classAvg).toFixed(1)} pts). Shows exceptional mastery in practical skills.</>
                                    ) : (
                                        <>Consistent attendance record shows dedication despite academic challenges.</>
                                    )}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-100 dark:border-amber-800 p-5 shadow-sm">
                                <h3 className="font-bold text-amber-900 dark:text-amber-100 text-sm mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400" /> Areas of Concern
                                </h3>
                                <p className="text-xs text-amber-800/80 dark:text-amber-200/80 leading-relaxed">
                                    {dynamicAttendancePct < 85 ? (
                                        <>Attendance has dropped to <span className="font-bold text-red-600 dark:text-red-400">{dynamicAttendancePct}%</span> in the selected period. This may impact upcoming assessments.</>
                                    ) : studentAvg < classAvg ? (
                                        <>Theoretical understanding is lagging behind practical performance.</>
                                    ) : (
                                        <>No major concerns detected in the current period.</>
                                    )}
                                </p>
                            </div>

                            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800 p-5 shadow-sm">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-100 text-sm mb-2 flex items-center gap-2">
                                    <Target size={16} className="text-indigo-600 dark:text-indigo-400" /> Recommended Action
                                </h3>
                                <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed">
                                    {studentAvg >= classAvg ? (
                                        <>Consider assigning advanced peer-mentoring roles or challenging supplementary projects.</>
                                    ) : (
                                        <>Schedule a 1-on-1 check-in to review foundational theory concepts.</>
                                    )}
                                </p>
                            </div>
                        </motion.div>"""
content = content.replace(smart_insights_old, smart_insights_new)

# Upgrading Charts

# 1. Radar Chart custom tooltip
radar_tooltip_old = """<PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                                            <Radar name="Student" dataKey="student" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} />
                                            <Radar name="Class Avg" dataKey="class" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="5 5" />"""

radar_tooltip_new = """<PolarRadiusAxis angle={30} domain={[0, 4]} tick={false} axisLine={false} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', borderColor: 'var(--md-sys-color-outline)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ fontWeight: 'bold' }}
                                                labelStyle={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--md-sys-color-outline)', paddingBottom: '4px' }}
                                            />
                                            <Radar name="Student" dataKey="student" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} strokeWidth={2} activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }} />
                                            <Radar name="Class Avg" dataKey="class" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="5 5" activeDot={{ r: 6, fill: '#10b981', stroke: 'white', strokeWidth: 2 }} />"""
content = content.replace(radar_tooltip_old, radar_tooltip_new)

# 2. Area Chart smooth curve
area_curve_old = """                                            <Area type="monotone" dataKey="rate" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />"""
area_curve_new = """                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--md-sys-color-surface)', borderColor: 'var(--md-sys-color-outline)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                itemStyle={{ fontWeight: 'bold', color: '#8b5cf6' }}
                                                labelStyle={{ color: 'var(--md-sys-color-on-surface)', fontWeight: 'bold' }}
                                                formatter={(value) => [`${value}%`, 'Attendance Rate']}
                                            />
                                            <Area type="natural" dataKey="rate" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} activeDot={{ r: 6, fill: '#8b5cf6', stroke: 'white', strokeWidth: 2 }} />"""
content = content.replace(area_curve_old, area_curve_new)


with open(r'c:\Users\DELL\Downloads\solar-mtaani-instructor-os\components\StudentAnalytics.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated StudentAnalytics.tsx")
