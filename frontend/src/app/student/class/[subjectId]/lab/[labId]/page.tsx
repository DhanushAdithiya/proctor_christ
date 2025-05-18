"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Check, BrainCircuit } from 'lucide-react';
import LabInfo from '@/app/components/labInfo';
import { fetchLab } from '@/app/actions/labs';
import PlagiarismChecker from '@/app/components/PlagarismChecker';
import { Lab } from '@/app/components/labInfo';

export default function StudentsLabPage() {
    const [lab, setLab] = useState<Lab | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [evaluationStarted, setEvaluationStarted] = useState(false);

    const { subjectId, labId } = useParams();
    const studentId = sessionStorage.getItem("regno");

    useEffect(() => {
        fetchLab(labId, studentId).then((fetchedLab) => {
            if (!fetchedLab.success) {
                setError(fetchedLab.error || "error");
            } else {
                setLab(fetchedLab.lab);
            }
            setLoading(false);
        });
    }, [subjectId, labId]);

    const handleStartEvaluation = () => {
        setEvaluationStarted(true);
    };

    if (loading) {
        return <div className="text-gray-700 p-6">Loading lab details...</div>;
    }

    if (error) {
        return <div className="text-red-500 p-6">Error: {error}</div>;
    }

    if (!lab) {
        return <div className="text-gray-700 p-6">Lab not found.</div>;
    }

    const hasDueDatePassed = new Date(lab.dueDate) < new Date();

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 space-y-6">
                <LabInfo labInfo={lab} admin={false} />

                {/* Submission Status */}
                <div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-4">Submission Status</h2>
                    {lab.submitted ? (
                        <div className="bg-green-50/50 border border-green-200 rounded-lg p-4 flex items-center gap-4">
                            <CheckCircle className="text-green-600 h-6 w-6" />
                            <p className="text-gray-700 font-medium">
                                Submitted {lab.submissionFile ? `(${lab.submissionFile.name})` : ''}
                                {lab.evaluated ? (
                                    <span className="text-blue-600 ml-2 flex items-center gap-1">
                                        <Check className="h-4 w-4" /> Evaluated
                                    </span>
                                ) : (
                                    <span className="text-yellow-600 ml-2">Pending Evaluation</span>
                                )}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-yellow-50/50 border border-yellow-200 rounded-lg p-4 flex items-center gap-4">
                            <AlertTriangle className="text-yellow-600 h-6 w-6" />
                            <p className="text-gray-700 font-medium">Not Submitted</p>
                        </div>
                    )}
                </div>

                {/* Upload and Submission Section (only if not submitted and due date hasn't passed) */}
                {!lab.submitted && !hasDueDatePassed && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700">Upload Lab Submission</h2>
                        <PlagiarismChecker labInfo={lab} />
                    </div>
                )}

                {/* Start Evaluation Button */}
                {lab.submitted && !evaluationStarted && (
                    <Button
                        onClick={handleStartEvaluation}
                        className="w-full bg-purple-500 hover:bg-purple-700 text-white"
                    >
                        <BrainCircuit className="mr-2 h-4 w-4" />
                        Start Self-Evaluation (LLM)
                    </Button>
                )}

                {/* Evaluation Started Message */}
                {evaluationStarted && (
                    <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 flex items-center gap-4">
                        <CheckCircle className="text-blue-600 h-6 w-6" />
                        <p className="text-gray-700 font-medium">
                            Evaluation process has been started.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
