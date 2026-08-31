import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PaginationBar = ({ 
  totalItems, 
  currentPage, 
  pageSize, 
  onPageChange, 
  onPageSizeChange 
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startNum = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endNum = Math.min(currentPage * pageSize, totalItems);

  const renderPageNumbers = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      pages.push(
        <button 
          key={1} 
          onClick={() => onPageChange(1)} 
          className={`page-num ${currentPage === 1 ? 'active' : ''}`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="dots1" className="page-dots">...</span>);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      pages.push(
        <button 
          key={p} 
          onClick={() => onPageChange(p)} 
          className={`page-num ${currentPage === p ? 'active' : ''}`}
        >
          {p}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="page-dots">...</span>);
      }
      pages.push(
        <button 
          key={totalPages} 
          onClick={() => onPageChange(totalPages)} 
          className={`page-num ${currentPage === totalPages ? 'active' : ''}`}
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="pagination-bar">
      <div className="pagination-info">
        <span>Showing {startNum.toLocaleString()} to {endNum.toLocaleString()} of {totalItems.toLocaleString()} transactions</span>
        <div className="page-size-selector">
          <label htmlFor="pageSizeSelect">Per page:</label>
          <select 
            id="pageSizeSelect" 
            value={pageSize} 
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
            className="select-filter-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="pagination-buttons">
        <button 
          onClick={() => onPageChange(currentPage - 1)} 
          disabled={currentPage <= 1}
          className="btn-page"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Prev</span>
        </button>

        <div className="page-numbers">
          {renderPageNumbers()}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages}
          className="btn-page"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
