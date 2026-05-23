"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  createFundType,
  getFundTypes,
  createCollectionCategory,
  getCollectionCategories,
  editFundType,
  deleteFundType,
  editCollectionCategory,
  deleteCollectionCategory
} from "@/lib/actions/cashier";

export function FundCategoryManager({ isAdmin = false }: { isAdmin?: boolean }) {
  const [fundTypes, setFundTypes] = useState<any[]>([]);
  const [collectionCategories, setCollectionCategories] = useState<any[]>([]);
  
  // Create Forms state
  const [fundTypeName, setFundTypeName] = useState("");
  const [fundTypeCode, setFundTypeCode] = useState("");
  const [isSubmittingFundType, setIsSubmittingFundType] = useState(false);

  const [categoryName, setCategoryName] = useState("");
  const [categoryCode, setCategoryCode] = useState("");
  const [selectedFundTypeId, setSelectedFundTypeId] = useState("");
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Edit Forms state
  const [editingFundType, setEditingFundType] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [fundRes, catRes] = await Promise.all([
        getFundTypes(),
        getCollectionCategories(),
      ]);
      
      if (fundRes.success) setFundTypes(fundRes.data || []);
      if (catRes.success) setCollectionCategories(catRes.data || []);
    } catch (error) {
      console.error("Error loading data", error);
      toast.error("Failed to load data.");
    }
  };

  const handleCreateFundType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundTypeName || !fundTypeCode) return;

    setIsSubmittingFundType(true);
    const result = await createFundType({ name: fundTypeName, code: fundTypeCode });
    
    if (result.success) {
      toast.success("Fund Type created successfully.");
      setFundTypeName("");
      setFundTypeCode("");
      fetchData();
    } else {
      toast.error(result.error || "Failed to create Fund Type.");
    }
    setIsSubmittingFundType(false);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !categoryCode || !selectedFundTypeId) return;

    setIsSubmittingCategory(true);
    const result = await createCollectionCategory({
      name: categoryName,
      code: categoryCode,
      fundTypeId: selectedFundTypeId,
    });
    
    if (result.success) {
      toast.success("Collection Category created successfully.");
      setCategoryName("");
      setCategoryCode("");
      setSelectedFundTypeId("");
      fetchData();
    } else {
      toast.error(result.error || "Failed to create Collection Category.");
    }
    setIsSubmittingCategory(false);
  };

  // Fund Type Admin Actions
  const handleEditFundType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFundType) return;
    setIsUpdating(true);
    const result = await editFundType(editingFundType.id, {
      name: editingFundType.name,
      code: editingFundType.code,
    });
    if (result.success) {
      toast.success("Fund Type updated.");
      setEditingFundType(null);
      fetchData();
    } else {
      toast.error(result.error || "Failed to update Fund Type.");
    }
    setIsUpdating(false);
  };

  const handleDeleteFundType = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Fund Type?")) return;
    const result = await deleteFundType(id);
    if (result.success) {
      toast.success("Fund Type deleted.");
      fetchData();
    } else {
      toast.error(result.error || "Failed to delete Fund Type.");
    }
  };

  // Category Admin Actions
  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsUpdating(true);
    const result = await editCollectionCategory(editingCategory.id, {
      name: editingCategory.name,
      code: editingCategory.code,
      fundTypeId: editingCategory.fundTypeId,
    });
    if (result.success) {
      toast.success("Collection Category updated.");
      setEditingCategory(null);
      fetchData();
    } else {
      toast.error(result.error || "Failed to update Collection Category.");
    }
    setIsUpdating(false);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure you want to delete this Collection Category?")) return;
    const result = await deleteCollectionCategory(id);
    if (result.success) {
      toast.success("Collection Category deleted.");
      fetchData();
    } else {
      toast.error(result.error || "Failed to delete Collection Category.");
    }
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="fund-types" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
          <TabsTrigger value="fund-types">Fund Types</TabsTrigger>
          <TabsTrigger value="categories">Collection Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="fund-types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Fund Type</CardTitle>
              <CardDescription>
                Create a new fund type to categorize collections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFundType} className="flex gap-4 items-end">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="fund-name">Name</Label>
                  <Input 
                    id="fund-name" 
                    placeholder="e.g. General Fund" 
                    value={fundTypeName}
                    onChange={(e) => setFundTypeName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="fund-code">Code</Label>
                  <Input 
                    id="fund-code" 
                    placeholder="e.g. GF" 
                    value={fundTypeCode}
                    onChange={(e) => setFundTypeCode(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" disabled={isSubmittingFundType}>
                  {isSubmittingFundType ? "Saving..." : "Add Fund Type"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fund Types</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fundTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 3 : 2} className="text-center text-muted-foreground">
                        No fund types found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    fundTypes.map((fund) => (
                      <TableRow key={fund.id}>
                        <TableCell className="font-medium">{fund.code}</TableCell>
                        <TableCell>{fund.name}</TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingFundType(fund)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteFundType(fund.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Add New Collection Category</CardTitle>
              <CardDescription>
                Create a new collection category and assign it to a fund type.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCategory} className="flex flex-col gap-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cat-name">Name</Label>
                    <Input 
                      id="cat-name" 
                      placeholder="e.g. Real Property Tax" 
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="cat-code">Code</Label>
                    <Input 
                      id="cat-code" 
                      placeholder="e.g. RPT" 
                      value={categoryCode}
                      onChange={(e) => setCategoryCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="grid w-full items-center gap-1.5 max-w-xs">
                  <Label htmlFor="cat-fund">Fund Type</Label>
                  <Select 
                    value={selectedFundTypeId} 
                    onValueChange={setSelectedFundTypeId}
                    required
                  >
                    <SelectTrigger id="cat-fund">
                      <SelectValue placeholder="Select a fund type" />
                    </SelectTrigger>
                    <SelectContent>
                      {fundTypes.map((fund) => (
                        <SelectItem key={fund.id} value={fund.id}>
                          {fund.name} ({fund.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button type="submit" disabled={isSubmittingCategory}>
                    {isSubmittingCategory ? "Saving..." : "Add Category"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Collection Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Fund Type</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {collectionCategories.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-muted-foreground">
                        No collection categories found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    collectionCategories.map((cat) => (
                      <TableRow key={cat.id}>
                        <TableCell className="font-medium">{cat.code}</TableCell>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>
                          {cat.fundType?.name} ({cat.fundType?.code})
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingCategory(cat)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteCategory(cat.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Fund Type Dialog */}
      <Dialog open={!!editingFundType} onOpenChange={(open) => !open && setEditingFundType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Fund Type</DialogTitle>
            <DialogDescription>Modify the fund type details below.</DialogDescription>
          </DialogHeader>
          {editingFundType && (
            <form onSubmit={handleEditFundType} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-fund-name">Name</Label>
                <Input 
                  id="edit-fund-name" 
                  value={editingFundType.name}
                  onChange={(e) => setEditingFundType({ ...editingFundType, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-fund-code">Code</Label>
                <Input 
                  id="edit-fund-code" 
                  value={editingFundType.code}
                  onChange={(e) => setEditingFundType({ ...editingFundType, code: e.target.value })}
                  required
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingFundType(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collection Category</DialogTitle>
            <DialogDescription>Modify the collection category details below.</DialogDescription>
          </DialogHeader>
          {editingCategory && (
            <form onSubmit={handleEditCategory} className="space-y-4 pt-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-cat-name">Name</Label>
                <Input 
                  id="edit-cat-name" 
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cat-code">Code</Label>
                <Input 
                  id="edit-cat-code" 
                  value={editingCategory.code}
                  onChange={(e) => setEditingCategory({ ...editingCategory, code: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cat-fund">Fund Type</Label>
                <Select 
                  value={editingCategory.fundTypeId} 
                  onValueChange={(val) => setEditingCategory({ ...editingCategory, fundTypeId: val })}
                  required
                >
                  <SelectTrigger id="edit-cat-fund">
                    <SelectValue placeholder="Select a fund type" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundTypes.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name} ({fund.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating}>{isUpdating ? "Saving..." : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
