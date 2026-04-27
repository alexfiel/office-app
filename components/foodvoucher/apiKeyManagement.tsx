"use client"

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { createApiKey, deleteApiKey } from "@/lib/actions/foodvoucher";
import { Key, Plus, Trash2, Copy, Check, ShieldCheck } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

export default function ApiKeyManagement({ 
    userId, 
    initialKeys,
    role
}: { 
    userId: string, 
    initialKeys: any[],
    role?: string
}) {
    const [keys, setKeys] = useState(initialKeys);
    const [newName, setNewName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCreate = async () => {
        if (!newName) return toast.error("Please enter a name for the key");
        
        setIsSubmitting(true);
        try {
            const newKey = await createApiKey({
                name: newName,
                userId
            });
            setKeys([newKey, ...keys]);
            setNewName('');
            toast.success("API Key generated successfully");
        } catch (error) {
            toast.error("Failed to generate API Key");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this API Key? Any system using it will lose access.")) return;
        
        try {
            await deleteApiKey(id);
            setKeys(keys.filter(k => k.id !== id));
            toast.success("API Key deleted");
        } catch (error) {
            toast.error("Failed to delete API Key");
        }
    };

    const copyToClipboard = (key: string) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        toast.success("API Key copied to clipboard");
        setTimeout(() => setCopiedKey(null), 2000);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Key className="w-5 h-5 text-slate-500" />
                                API Key Management
                            </CardTitle>
                            <CardDescription>
                                {role === 'ADMIN' 
                                    ? "Generate keys for external systems to submit vendor claims." 
                                    : "View your active API keys for system integrations."}
                            </CardDescription>
                        </div>
                        <ShieldCheck className="w-8 h-8 text-blue-500 opacity-20" />
                    </div>
                </CardHeader>
                {role === 'ADMIN' ? (
                    <CardContent className="pt-6">
                        <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex-1 space-y-2">
                                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Key Name (e.g. POS System, Mobile App)</Label>
                                <Input 
                                    placeholder="Enter system name..." 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-white"
                                />
                            </div>
                            <Button 
                                className="bg-slate-900 hover:bg-slate-800 text-white font-bold" 
                                onClick={handleCreate}
                                disabled={isSubmitting}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {isSubmitting ? "Generating..." : "Generate New Key"}
                            </Button>
                        </div>
                    </CardContent>
                ) : (
                    <CardContent className="pt-6">
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-700 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Only administrators can generate new API keys. Contact your IT department for new integrations.</span>
                        </div>
                    </CardContent>
                )}
            </Card>

            <Card className="shadow-sm border-slate-200">
                <CardHeader>
                    <CardTitle className="text-md font-bold">Active Keys</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="font-bold">Name</TableHead>
                                <TableHead className="font-bold">API Key</TableHead>
                                <TableHead className="font-bold">Created</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {keys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-slate-400 italic">
                                        No active API keys found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                keys.map((key) => (
                                    <TableRow key={key.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-bold text-slate-700">{key.name}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-600 border border-slate-200">
                                                    {key.key.substring(0, 8)}...{key.key.substring(key.key.length - 4)}
                                                </code>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                    onClick={() => copyToClipboard(key.key)}
                                                >
                                                    {copiedKey === key.key ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs text-slate-500">
                                            {new Date(key.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleDelete(key.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600 h-fit">
                    <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-amber-900">Security Note</h4>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        API keys grant full access to submit vendor claims on your behalf. Never share these keys 
                        in public repositories or client-side code. If a key is compromised, delete it immediately 
                        and generate a new one.
                    </p>
                </div>
            </div>
        </div>
    );
}
