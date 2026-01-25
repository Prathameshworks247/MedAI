import React, { useState } from 'react';
import { Pill, Clock, AlertCircle, CheckCircle, Calendar, Info, Bell } from 'lucide-react';
import { medications } from '../../data/dummyData';

const Medications = () => {
    const [selectedMed, setSelectedMed] = useState(null);

    const groupByTime = () => {
        const groups = {
            morning: [],
            evening: [],
            night: []
        };

        medications.forEach(med => {
            if (med.timing.includes('Morning') || med.timing.includes('8:00 AM')) {
                groups.morning.push(med);
            }
            if (med.timing.includes('Evening') || med.timing.includes('6:00 PM')) {
                groups.evening.push(med);
            }
            if (med.timing.includes('Night') || med.timing.includes('9:00 PM')) {
                groups.night.push(med);
            }
        });

        return groups;
    };

    const medicationGroups = groupByTime();

    const TimeGroup = ({ title, time, icon: Icon, medications, color }) => (
        <div className="card hover:shadow-xl transition-all duration-200">
            <div className="flex items-center space-x-3 mb-4">
                <div className={`${color} p-2 rounded-xl shadow-md`}>
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{time}</p>
                </div>
            </div>
            <div className="space-y-3">
                {medications.map((med) => (
                    <div
                        key={med.id}
                        onClick={() => setSelectedMed(med)}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-all duration-200"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900 dark:text-white">{med.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{med.dosage} • {med.frequency}</p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{med.purpose}</p>
                            </div>
                            <button className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors">
                                <CheckCircle className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">My Medications</h2>
                <p className="text-gray-600 dark:text-gray-400">View your medication schedule and instructions</p>
            </div>

            {/* Important Notice */}
            <div className="card mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">Important</h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            Never skip or stop your medications without consulting your doctor.
                            If you experience any side effects, contact Dr. Priya Mehta immediately.
                        </p>
                    </div>
                </div>
            </div>

            {/* Medication Schedule by Time */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
                <TimeGroup
                    title="Morning"
                    time="8:00 AM"
                    icon={Clock}
                    medications={medicationGroups.morning}
                    color="bg-orange-500"
                />
                <TimeGroup
                    title="Evening"
                    time="6:00 PM"
                    icon={Clock}
                    medications={medicationGroups.evening}
                    color="bg-blue-500"
                />
                <TimeGroup
                    title="Night"
                    time="9:00 PM"
                    icon={Clock}
                    medications={medicationGroups.night}
                    color="bg-purple-500"
                />
            </div>

            {/* All Medications List */}
            <div className="card mb-6 hover:shadow-xl transition-all duration-200">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Pill className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Complete Medication List
                </h3>
                <div className="space-y-4">
                    {medications.map((med) => (
                        <div key={med.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:bg-gray-700/50 transition-all">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{med.name}</h4>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">{med.purpose}</p>
                                </div>
                                <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-semibold">
                                    Active
                                </span>
                            </div>

                            <div className="grid md:grid-cols-4 gap-3 mb-3">
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Dosage</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{med.dosage}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Frequency</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{med.frequency}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Timing</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{med.timing}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{med.duration}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded p-3">
                                <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-1">Instructions:</p>
                                <p className="text-sm text-blue-800 dark:text-blue-300">{med.instructions}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Medication Reminders */}
            <div className="card bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700 hover:shadow-xl transition-all duration-200">
                <div className="flex items-start space-x-3">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-xl shadow-md">
                        <Bell className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Automatic Reminders Enabled</h3>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            You will receive notifications 15 minutes before each medication time.
                        </p>
                        <button className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-semibold transition-colors">
                            Manage Reminder Settings →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Medications;

