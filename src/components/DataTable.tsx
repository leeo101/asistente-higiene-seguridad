import React, { useState, useMemo } from 'react';
import {
  MagnifyingGlass as Search,
  CaretUp,
  CaretDown,
  CaretLeft,
  CaretRight,
  Funnel } from
'@phosphor-icons/react';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  itemsPerPage?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  onEmptyAction?: () => void;
  emptyActionLabel?: string;
  hideHeader?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = "Buscar...",
  searchFields,
  itemsPerPage = 10,
  emptyMessage = "No hay datos disponibles.",
  emptyIcon,
  onEmptyAction,
  emptyActionLabel,
  hideHeader = false
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{key: keyof T | string | null;direction: 'ascending' | 'descending';}>({
    key: null,
    direction: 'ascending'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sorting
  const requestSort = (key: keyof T | string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter & Sort Data
  const processedData = useMemo(() => {
    let sortableItems = [...data];

    // Filter
    if (searchTerm) {
      sortableItems = sortableItems.filter((item) => {
        if (searchFields && searchFields.length > 0) {
          return searchFields.some((field) => {
            const val = item[field];
            return val?.toString().toLowerCase().includes(searchTerm.toLowerCase());
          });
        } else {
          // generic search (fallback)
          return Object.values(item).some((val) =>
          val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      });
    }

    // Sort
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key!];
        const bVal = b[sortConfig.key!];

        if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return sortableItems;
  }, [data, searchTerm, sortConfig, searchFields]);

  // Pagination Compute
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIdx, startIdx + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Reset page when search changes
  useMemo(() => {setCurrentPage(1);}, [searchTerm]);

  if (data.length === 0) {
    return (
      <div style={{ padding: isMobile ? '2rem 1rem' : '4rem 2rem' }} className="text-center text-[var(--color-text-muted)] bg-[var(--color-surface)] rounded-[var(--radius-xl)] border-[1px_solid_var(--color-border)]">
        {emptyIcon && <div className="opacity-[0.2] mb-[1rem] flex justify-center">{emptyIcon}</div>}
        <p style={{ fontSize: isMobile ? '0.9rem' : '1rem' }} className="mb-[1.5rem] font-[600]">{emptyMessage}</p>
        {onEmptyAction && emptyActionLabel &&
        <button onClick={onEmptyAction} className="btn-primary m-[0_auto]">
            {emptyActionLabel}
          </button>
        }
      </div>);

  }

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-xl)] border-[1px_solid_var(--glass-border-subtle)] box-shadow-[var(--shadow-sm)] overflow-[hidden] flex flex-col">







      
      {/* Table Header Controls */}
      {!hideHeader && (
        <div style={{
          padding: isMobile ? '1rem' : '1.25rem',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center'
        }} className="flex justify-space-between border-bottom-[1px_solid_var(--color-border)] gap-[1rem] bg-[rgba(255,_255,_255,_0.02)]">
          <div style={{ maxWidth: isMobile ? 'none' : '400px' }} className="relative flex-[1_1_auto]">
            <Search size={18} color="var(--color-text-muted)" className="absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2.5 pr-4 pl-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm" />
          </div>
          <div style={{
            justifyContent: isMobile ? 'flex-end' : 'flex-start'
          }} className="flex items-center gap-[0.5rem] text-[var(--color-text-muted)] text-[0.8rem]">
            <Funnel size={16} />
            <span>{processedData.length} resultados</span>
          </div>
        </div>
      )}

      {/* Table Content */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table className="w-[100%] border-collapse-[collapse] text-left">
          <thead>
            <tr className="bg-[var(--color-background)] border-bottom-[2px_solid_var(--color-border)]">
              {columns.map((col, i) =>
              <th key={i} style={{





                cursor: col.sortable ? 'pointer' : 'default'

              }}
              onClick={() => col.sortable && requestSort(col.accessor)} className="p-[1rem_1.25rem] text-[0.75rem] uppercase font-[800] text-[var(--color-text-muted)] white-space-[nowrap]">
                
                  <div className="flex items-center gap-[0.4rem]">
                    {col.header}
                    {col.sortable &&
                  <div style={{ opacity: sortConfig.key === col.accessor ? 1 : 0.3 }} className="flex flex-col">
                        <CaretUp size={10} weight={sortConfig.key === col.accessor && sortConfig.direction === 'ascending' ? 'bold' : 'regular'} color={sortConfig.key === col.accessor && sortConfig.direction === 'ascending' ? 'var(--color-primary)' : 'currentColor'} />
                        <CaretDown size={10} weight={sortConfig.key === col.accessor && sortConfig.direction === 'descending' ? 'bold' : 'regular'} color={sortConfig.key === col.accessor && sortConfig.direction === 'descending' ? 'var(--color-primary)' : 'currentColor'} className="mt-[-4px]" />
                      </div>
                  }
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ?
            paginatedData.map((row, rowIndex) =>
            <tr key={rowIndex} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} className="border-bottom-[1px_solid_var(--color-border)] transition-[background_var(--transition-fast)]">
                  {columns.map((col, colIndex) =>
              <td key={colIndex} className="p-[1rem_1.25rem] text-[var(--color-text)] text-[0.9rem] vertical-align-[middle]">
                      {col.render ? col.render(row, (currentPage - 1) * itemsPerPage + rowIndex) : row[col.accessor as keyof T] as unknown as string || '—'}
                    </td>
              )}
                </tr>
            ) :

            <tr>
                <td colSpan={columns.length} className="p-[3rem] text-center text-[var(--color-text-muted)]">
                  No se encontraron coincidencias para "{searchTerm}"
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 &&
      <div style={{



        justifyContent: isMobile ? 'center' : 'space-between'




      }} className="p-[1rem_1.25rem] border-top-[1px_solid_var(--color-border)] flex items-center bg-[rgba(255,_255,_255,_0.02)] gap-[1rem] flex-wrap">
          {!isMobile &&
        <div className="text-[0.85rem] text-[var(--color-text-muted)]">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length}
            </div>
        }
          <div className="flex gap-[0.5rem] items-center">
            <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            style={{



              background: currentPage === 1 ? 'transparent' : 'var(--color-surface)',
              color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'

            }} className="p-[0.5rem] rounded-[var(--radius-md)] border-[1px_solid_var(--color-border)] flex items-center">
            
              <CaretLeft size={18} />
            </button>
            <div className="flex items-center p-[0_1rem] text-[0.85rem] font-[700] text-[white]">
              {currentPage} <span className="text-[var(--color-text-muted)] m-[0_0.4rem] font-[400]">de</span> {totalPages}
            </div>
            <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            style={{



              background: currentPage === totalPages ? 'transparent' : 'var(--color-surface)',
              color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'

            }} className="p-[0.5rem] rounded-[var(--radius-md)] border-[1px_solid_var(--color-border)] flex items-center">
            
              <CaretRight size={18} />
            </button>
          </div>
        </div>
      }
    </div>);

}