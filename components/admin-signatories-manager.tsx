"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FileSignature,
  Building2,
  Upload,
  X,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { uploadFile } from "@/lib/upload/upload-action";
import {
  getAllSignatories,
  createSignatory,
  updateSignatory,
  setActiveHeadOfOffice,
  deleteSignatory,
  seedDefaultHeadOfOffice,
} from "@/lib/actions/signatory-actions";
import { DEFAULT_HEAD_OF_OFFICE } from "@/lib/signatories";

type Signatory = {
  id: string;
  name: string;
  designation: string;
  office: string | null;
  signatureUrl: string;
  isHeadOfOffice: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function AdminSignatoriesManager() {
  const [signatories, setSignatories] = useState<Signatory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add / Edit Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSignatory, setEditingSignatory] = useState<Signatory | null>(null);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [office, setOffice] = useState("Office of the City Treasurer");
  const [signatureUrl, setSignatureUrl] = useState("");
  const [isHeadOfOffice, setIsHeadOfOffice] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // File Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Signature Preview Lightbox state
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSignatories();
  }, []);

  const fetchSignatories = async () => {
    try {
      setLoading(true);
      const res = await getAllSignatories();
      if (res.success && res.data) {
        setSignatories(res.data as unknown as Signatory[]);
      } else {
        toast.error(res.error || "Failed to load signatories.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while loading signatories.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchSignatories();
    setIsRefreshing(false);
    toast.success("Signatories refreshed.");
  };

  const openAddDialog = () => {
    setEditingSignatory(null);
    setName("");
    setDesignation("City Treasurer");
    setOffice("Office of the City Treasurer");
    setSignatureUrl("");
    setIsHeadOfOffice(true);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: Signatory) => {
    setEditingSignatory(item);
    setName(item.name);
    setDesignation(item.designation);
    setOffice(item.office || "Office of the City Treasurer");
    setSignatureUrl(item.signatureUrl || "");
    setIsHeadOfOffice(item.isHeadOfOffice);
    setIsActive(item.isActive);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be under 5MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await uploadFile(formData);

      if (res.status === "success" && res.url) {
        setSignatureUrl(res.url);
        toast.success("Signature image uploaded successfully.");
      } else {
        toast.error(res.error || "Failed to upload signature image.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(msg);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Signatory name is required.");
      return;
    }
    if (!designation.trim()) {
      toast.error("Designation is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingSignatory) {
        const res = await updateSignatory(editingSignatory.id, {
          name,
          designation,
          office,
          signatureUrl,
          isHeadOfOffice,
          isActive,
        });
        if (!res.success) {
          throw new Error(res.error || "Failed to update signatory.");
        }
        toast.success("Signatory updated successfully.");
      } else {
        const res = await createSignatory({
          name,
          designation,
          office,
          signatureUrl,
          isHeadOfOffice,
          isActive,
        });
        if (!res.success) {
          throw new Error(res.error || "Failed to create signatory.");
        }
        toast.success("Signatory created successfully.");
      }

      setIsDialogOpen(false);
      await fetchSignatories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred while saving.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetActive = async (id: string, signatoryName: string) => {
    try {
      const res = await setActiveHeadOfOffice(id);
      if (!res.success) {
        throw new Error(res.error || "Failed to set active signatory.");
      }
      toast.success(`${signatoryName} is now the active Head of Office approver.`);
      await fetchSignatories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set active approver.";
      toast.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await deleteSignatory(deletingId);
      if (!res.success) {
        throw new Error(res.error || "Failed to delete signatory.");
      }
      toast.success("Signatory deleted successfully.");
      setDeletingId(null);
      await fetchSignatories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete signatory.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSeedDefault = async () => {
    try {
      const res = await seedDefaultHeadOfOffice();
      if (!res.success) {
        throw new Error(res.error || "Failed to seed default signatory.");
      }
      toast.success("Default City Treasurer signatory initialized.");
      await fetchSignatories();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to seed default signatory.";
      toast.error(msg);
    }
  };

  const activeApprover = signatories.find((s) => s.isHeadOfOffice && s.isActive);

  return (
    <div className="space-y-6">
      {/* Top Banner / Active Signatory Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-l-4 border-l-blue-600 bg-linear-to-r from-blue-50/50 via-white to-transparent dark:from-blue-950/20 dark:via-background dark:to-transparent">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-700 dark:text-blue-300">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Active Head of Office Approver</CardTitle>
                  <CardDescription>
                    Currently appearing on Transfer Tax Computation Sheets &amp; Official Reports
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live in Production
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card/60">
              <div className="space-y-1">
                <p className="text-xl font-extrabold text-foreground tracking-tight uppercase">
                  {activeApprover?.name || DEFAULT_HEAD_OF_OFFICE.name}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {activeApprover?.designation || DEFAULT_HEAD_OF_OFFICE.designation}
                  </span>
                  <span>•</span>
                  <span>{activeApprover?.office || DEFAULT_HEAD_OF_OFFICE.office}</span>
                </div>
              </div>

              {activeApprover?.signatureUrl ? (
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => setPreviewImageUrl(activeApprover.signatureUrl)}
                    className="group relative cursor-pointer border rounded-lg p-1.5 bg-white shadow-xs hover:border-blue-500 transition-colors"
                    title="Click to preview signature"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeApprover.signatureUrl}
                      alt="Signature Preview"
                      className="h-10 w-28 object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">Digital Signature attached</span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5 border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-3 py-2 rounded-lg">
                  <FileSignature className="w-4 h-4" />
                  <span>Physical/Printed line signature active</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Signatory Statistics</CardTitle>
            <CardDescription>System signatory records overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-muted-foreground">Total Configured</span>
              <span className="font-bold text-lg">{signatories.length}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-b pb-2">
              <span className="text-muted-foreground">Head of Office</span>
              <span className="font-semibold text-blue-600">
                {signatories.filter((s) => s.isHeadOfOffice).length}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">With Digital Signature</span>
              <span className="font-semibold text-emerald-600">
                {signatories.filter((s) => !!s.signatureUrl).length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-blue-600" />
              Signatories Directory
            </CardTitle>
            <CardDescription>
              Add and maintain authorized office signatories. Set which signatory serves as the active Head of Office approver.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              title="Refresh list"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            {signatories.length === 0 && !loading && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSeedDefault}
                className="text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                Initialize Default City Treasurer
              </Button>
            )}
            <Button
              onClick={openAddDialog}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Head of Office Signatory
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Loading signatories...</span>
            </div>
          ) : signatories.length === 0 ? (
            <div className="py-16 text-center border border-dashed rounded-xl space-y-3 bg-muted/20">
              <FileSignature className="w-12 h-12 mx-auto text-muted-foreground/60" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">No signatories registered yet</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Add a Head of Office signatory or click below to initialize the default City Treasurer (HUBERT M. INAS, CPA, BCLTE).
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2">
                <Button onClick={handleSeedDefault} variant="outline" className="text-blue-600">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Initialize Default Record
                </Button>
                <Button onClick={openAddDialog} className="bg-blue-600 text-white">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Create Signatory
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-semibold">Signatory / Approver</TableHead>
                    <TableHead className="font-semibold">Designation &amp; Office</TableHead>
                    <TableHead className="font-semibold text-center">Digital Signature</TableHead>
                    <TableHead className="font-semibold text-center">Status</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatories.map((sig) => {
                    const isLiveApprover = sig.isHeadOfOffice && sig.isActive;
                    return (
                      <TableRow key={sig.id} className={isLiveApprover ? "bg-blue-50/30 dark:bg-blue-950/10" : ""}>
                        <TableCell>
                          <div className="space-y-0.5">
                            <span className="font-bold text-base tracking-tight uppercase text-foreground">
                              {sig.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {sig.isHeadOfOffice ? (
                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                  Head of Office
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Officer
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-0.5">
                            <p className="font-medium text-sm text-foreground">{sig.designation}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {sig.office || "Office of the City Treasurer"}
                            </p>
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {sig.signatureUrl ? (
                            <div className="inline-flex items-center gap-2">
                              <div
                                onClick={() => setPreviewImageUrl(sig.signatureUrl)}
                                className="group relative cursor-pointer border rounded-md p-1 bg-white hover:border-blue-500 shadow-2xs transition-colors"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={sig.signatureUrl}
                                  alt={`${sig.name}'s signature`}
                                  className="h-8 w-20 object-contain"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white">
                                  <Eye className="w-3 h-3" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No image (printed line)</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          {isLiveApprover ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Active Approver
                            </Badge>
                          ) : sig.isActive ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-300">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isLiveApprover && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                onClick={() => handleSetActive(sig.id, sig.name)}
                                title="Set this signatory as the active Head of Office approver"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                                Set as Active
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={() => openEditDialog(sig)}
                              title="Edit signatory"
                            >
                              <Edit2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => setDeletingId(sig.id)}
                              title="Delete signatory"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-blue-600" />
              {editingSignatory ? "Edit Head of Office Signatory" : "Add Head of Office Signatory"}
            </DialogTitle>
            <DialogDescription>
              Configure the approver details that will appear on Transfer Tax Computation Sheets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="sig-name" className="text-sm font-semibold">
                Full Name with Honors / Titles <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sig-name"
                placeholder="e.g. HUBERT M. INAS, CPA, BCLTE"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="uppercase"
              />
              <p className="text-xs text-muted-foreground">
                This name will appear on the &quot;Approved by:&quot; signature line.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sig-desig" className="text-sm font-semibold">
                  Designation / Position <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="sig-desig"
                  placeholder="e.g. City Treasurer"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sig-office" className="text-sm font-semibold">
                  Office / Department
                </Label>
                <Input
                  id="sig-office"
                  placeholder="e.g. Office of the City Treasurer"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                />
              </div>
            </div>

            {/* Signature Image Upload Section */}
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-semibold flex items-center justify-between">
                <span>Digital Signature Image (Optional)</span>
                {signatureUrl && (
                  <button
                    type="button"
                    onClick={() => setSignatureUrl("")}
                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3 h-3" />
                    Remove Image
                  </button>
                )}
              </Label>

              {signatureUrl ? (
                <div className="relative border rounded-lg p-3 bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={signatureUrl}
                      alt="Signature"
                      className="h-12 w-32 object-contain bg-white rounded border p-1"
                    />
                    <div className="text-xs space-y-0.5">
                      <p className="font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Signature Attached
                      </p>
                      <p className="text-muted-foreground">Will render above the approval line in PDF</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all space-y-1.5"
                >
                  <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                  <p className="text-xs font-semibold text-foreground">
                    {uploadingImage ? "Uploading signature..." : "Click to upload signature image (PNG, JPG, WEBP)"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Transparent PNG recommended for best PDF appearance (max 5MB)
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {/* Checkboxes / Switches */}
            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="is-head"
                  checked={isHeadOfOffice}
                  onCheckedChange={(val) => setIsHeadOfOffice(Boolean(val))}
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="is-head" className="text-sm font-semibold cursor-pointer">
                    Head of Office Authority
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Designates this signatory as authorized Head of Office (e.g. City Treasurer / Acting Head).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Checkbox
                  id="is-active"
                  checked={isActive}
                  onCheckedChange={(val) => setIsActive(Boolean(val))}
                />
                <div className="grid gap-0.5 leading-none">
                  <Label htmlFor="is-active" className="text-sm font-semibold cursor-pointer">
                    Set as Active Approver
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    If checked, this signatory immediately becomes the active approver on ReportTransferTaxCompSheet.
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting || uploadingImage}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || uploadingImage}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? "Saving..." : editingSignatory ? "Update Signatory" : "Create Signatory"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Signatory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this signatory? If this is currently the active approver, the system will revert to the default City Treasurer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Signatory"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Signature Lightbox Dialog */}
      <Dialog open={!!previewImageUrl} onOpenChange={(open) => !open && setPreviewImageUrl(null)}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Signature Preview</DialogTitle>
          </DialogHeader>
          {previewImageUrl && (
            <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg flex items-center justify-center border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImageUrl}
                alt="Enlarged signature"
                className="max-h-48 max-w-full object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
