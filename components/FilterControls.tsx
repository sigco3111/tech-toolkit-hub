import React from 'react';

interface FilterControlsProps {
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortOrder: string;
  onSortChange: (order: string) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  sortOrder,
  onSortChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md mb-8 sticky top-4 z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="search-input" className="block text-sm font-medium text-slate-700 mb-1">이름으로 검색</label>
          <input
            type="text"
            id="search-input"
            placeholder="예: ChatGPT, Suno..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="sort-select" className="block text-sm font-medium text-slate-700 mb-1">정렬 기준</label>
          <select
            id="sort-select"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition bg-white"
            value={sortOrder}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="rating_desc">별점 높은 순</option>
            <option value="rating_asc">별점 낮은 순</option>
            <option value="name_asc">이름 오름차순</option>
            <option value="name_desc">이름 내림차순</option>
          </select>
        </div>
      </div>
      <div className="mt-4">
         <label className="block text-sm font-medium text-slate-700 mb-2">카테고리 필터</label>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => onCategoryChange(category)}
              className={`px-4 py-2 text-sm font-medium rounded-full shadow-sm hover:bg-slate-100 transition-colors duration-200 border border-slate-200 ${
                selectedCategory === category
                  ? 'bg-sky-500 text-white font-bold shadow-md'
                  : 'text-slate-700 bg-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterControls;