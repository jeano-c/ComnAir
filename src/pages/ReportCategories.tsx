import React, { useState } from "react";
import { FaPlus, FaPen, FaTrash } from "react-icons/fa6";
import { VscLoading } from "react-icons/vsc";
import { useCategory } from "../hooks/useCategory";
import Modal from "../components/Modal"; // Import the reusable Modal

export default function ReportCategories() {
  const {
    categories,
    isCategoriesLoading,
    removeCategory,
    isRemoving,
    createCategory,
    isCreating,
    updateCategory,
    isUpdating,
  } = useCategory();

  // --- States for Modals ---

  // Create State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCategoryType, setNewCategoryType] = useState("");

  // Edit State (Store the whole category object so we have the ID and the current name)
  const [categoryToEdit, setCategoryToEdit] = useState<{
    id: number;
    categoryType: string;
  } | null>(null);
  const [editCategoryType, setEditCategoryType] = useState("");

  // Delete State
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // Safely extract array
  const categoryArray = Array.isArray(categories)
    ? categories
    : categories?.data || [];

  // --- Handlers ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryType.trim()) return;

    try {
      await createCategory({ categoryType: newCategoryType });
      setNewCategoryType("");
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Failed to create category", error);
      alert("Failed to create category.");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryToEdit || !editCategoryType.trim()) return;

    try {
      await updateCategory({
        id: categoryToEdit.id,
        data: { categoryType: editCategoryType },
      });
      setCategoryToEdit(null); // Close modal
      setEditCategoryType("");
    } catch (error) {
      console.error("Failed to update category", error);
      alert("Failed to update category.");
    }
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await removeCategory(categoryToDelete);
      setCategoryToDelete(null); // Close modal on success
    } catch (error) {
      console.error("Failed to delete category", error);
      alert("Failed to delete category. It might be in use.");
    }
  };

  // --- Loading UI ---
  if (isCategoriesLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-[#fafafa]">
        <VscLoading className="animate-spin text-4xl text-[#1F8F22]" />
        <p className="text-gray-500 font-medium tracking-wide text-sm">
          Loading categories...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-12 h-full min-h-screen bg-[#fafafa] relative">
      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 py-3.5">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-2">
            Report Categories
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Manage and organize the primary classifications for environmental
            anomaly reports.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all duration-200 active:scale-95 bg-[#1F8F22] text-white shadow-lg shadow-[#1F8F22]/30 hover:bg-[#18751a] shrink-0"
        >
          <FaPlus /> Add New Category
        </button>
      </div>

      {/* --- Empty State --- */}
      {categoryArray.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200 border-dashed">
          <p className="text-center text-gray-500 font-medium">
            No categories found. Click "Add New Category" to get started.
          </p>
        </div>
      )}

      {/* --- Categories Grid --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {categoryArray.map((category: any) => (
          <div
            key={category.id}
            className="bg-white rounded-3xl p-6 border border-gray-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 relative flex flex-col h-48"
          >
            <div className="absolute top-5 right-5 flex items-center gap-4 text-gray-400">
              <button
                className="hover:text-gray-800 transition-colors"
                onClick={() => {
                  setCategoryToEdit(category);
                  setEditCategoryType(category.categoryType); // Pre-fill the input
                }}
              >
                <FaPen className="text-sm" />
              </button>
              <button
                className="hover:text-red-500 transition-colors disabled:opacity-50"
                onClick={() => setCategoryToDelete(category.id)}
                disabled={isRemoving}
              >
                <FaTrash className="text-sm" />
              </button>
            </div>

            <h3 className="text-xl font-bold text-gray-800 mt-6 pr-12 line-clamp-2 capitalize">
              {category.categoryType}
            </h3>

            <div className="mt-auto pt-4 border-t border-gray-50 flex flex-col">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Active Reports
              </span>
              <span className="text-3xl font-black text-[#1a1a1a]">
                {category.activeReports ?? 0}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================= */}
      {/* MODAL 1: ADD CATEGORY                     */}
      {/* ========================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setNewCategoryType("");
        }}
        title="Create New Category"
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="addCategoryType"
              className="text-sm font-bold text-gray-600"
            >
              Category Type Name
            </label>
            <input
              id="addCategoryType"
              type="text"
              placeholder="e.g. Water Contamination"
              value={newCategoryType}
              onChange={(e) => setNewCategoryType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F8F22]/50 focus:border-[#1F8F22] transition-all"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setNewCategoryType("");
              }}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || !newCategoryType.trim()}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-[#1F8F22] text-white hover:bg-[#18751a] disabled:opacity-50 transition-colors"
            >
              {isCreating ? (
                <VscLoading className="animate-spin text-xl" />
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================= */}
      {/* MODAL 2: EDIT CATEGORY                    */}
      {/* ========================================= */}
      <Modal
        isOpen={categoryToEdit !== null}
        onClose={() => setCategoryToEdit(null)}
        title="Edit Category"
      >
        <form onSubmit={handleEditSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="editCategoryType"
              className="text-sm font-bold text-gray-600"
            >
              Category Type Name
            </label>
            <input
              id="editCategoryType"
              type="text"
              value={editCategoryType}
              onChange={(e) => setEditCategoryType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1F8F22]/50 focus:border-[#1F8F22] transition-all"
              autoFocus
              required
            />
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setCategoryToEdit(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                isUpdating ||
                !editCategoryType.trim() ||
                editCategoryType === categoryToEdit?.categoryType
              }
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-[#1F8F22] text-white hover:bg-[#18751a] disabled:opacity-50 transition-colors"
            >
              {isUpdating ? (
                <VscLoading className="animate-spin text-xl" />
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================= */}
      {/* MODAL 3: DELETE CONFIRMATION              */}
      {/* ========================================= */}
      <Modal
        isOpen={categoryToDelete !== null}
        onClose={() => setCategoryToDelete(null)}
        title="Delete Category?"
      >
        <div className="flex flex-col gap-6">
          <p className="text-gray-600">
            Are you sure you want to delete this category? This action cannot be
            undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setCategoryToDelete(null)}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
              disabled={isRemoving}
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={isRemoving}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isRemoving ? (
                <VscLoading className="animate-spin text-xl" />
              ) : (
                "Yes, Delete"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
