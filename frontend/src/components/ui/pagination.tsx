'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showItemCount?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  showItemCount = true,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems || 0);

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
      {/* Item count */}
      {showItemCount && totalItems !== undefined && (
        <p className="text-xs text-zinc-500">
          Showing {startItem}-{endItem} of {totalItems}
        </p>
      )}

      {/* Page controls */}
      <div className="flex items-center gap-1 ml-auto">
        {/* First page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {getVisiblePages().map((page, idx) => (
            page === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-zinc-600 text-xs">...</span>
            ) : (
              <Button
                key={page}
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page as number)}
                className={`h-8 w-8 p-0 text-xs ${
                  currentPage === page
                    ? 'bg-white text-black hover:bg-zinc-200'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {page}
              </Button>
            )
          ))}
        </div>

        {/* Next page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
