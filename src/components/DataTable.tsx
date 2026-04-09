import React, { useState, useMemo } from 'react';
import { 
  MagnifyingGlass as Search, 
  CaretUp, 
  CaretDown, 
  CaretLeft, 
  CaretRight, 
  Funnel 
} from '@phosphor-icons/react';

export interface Column<T> {
  header: string;
  accessor: keyof T | string;
  render?: (item: T) => React.ReactNode;
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
  emptyActionLabel
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | string | null; direction: 'ascending' | 'descending' }>({
    key: null,
    direction: 'ascending',
  });
  const [currentPage, setCurrentPage] = useState(1);

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
          return Object.values(item).some(val => 
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
  useMemo(() => { setCurrentPage(1); }, [searchTerm]);

  if (data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--color-text-muted)', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)' }}>
        {emptyIcon && <div style={{ opacity: 0.2, marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>{emptyIcon}</div>}
        <p style={{ marginBottom: '1.5rem', fontWeight: 600 }}>{emptyMessage}</p>
        {onEmptyAction && emptyActionLabel && (
          <button onClick={onEmptyAction} className="btn-primary" style={{ margin: '0 auto' }}>
            {emptyActionLabel}
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--glass-border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Table Header Controls */}
      <div style={{
        padding: '1.25rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--color-border)',
        gap: '1rem',
        flexWrap: 'wrap',
        background: 'rgba(255, 255, 255, 0.02)'
      }}>
        <div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '400px' }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.8rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-background)',
              color: 'var(--color-text)',
              fontSize: '0.9rem',
              transition: 'border-color var(--transition-fast)'
            }}
          />
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem'
        }}>
          <Funnel size={16} />
          <span>{processedData.length} resultados</span>
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--color-background)', borderBottom: '2px solid var(--color-border)' }}>
              {columns.map((col, i) => (
                <th key={i} style={{ 
                  padding: '1rem 1.25rem', 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase', 
                  fontWeight: 800, 
                  color: 'var(--color-text-muted)',
                  cursor: col.sortable ? 'pointer' : 'default',
                  whiteSpace: 'nowrap'
                }}
                onClick={() => col.sortable && requestSort(col.accessor)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {col.header}
                    {col.sortable && (
                      <div style={{ display: 'flex', flexDirection: 'column', opacity: sortConfig.key === col.accessor ? 1 : 0.3 }}>
                        <CaretUp size={10} weight={sortConfig.key === col.accessor && sortConfig.direction === 'ascending' ? 'bold' : 'regular'} color={sortConfig.key === col.accessor && sortConfig.direction === 'ascending' ? 'var(--color-primary)' : 'currentColor'} />
                        <CaretDown size={10} weight={sortConfig.key === col.accessor && sortConfig.direction === 'descending' ? 'bold' : 'regular'} color={sortConfig.key === col.accessor && sortConfig.direction === 'descending' ? 'var(--color-primary)' : 'currentColor'} style={{ marginTop: '-4px' }} />
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr key={rowIndex} style={{ borderBottom: '1px solid var(--color-border)', transition: 'background var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} style={{ padding: '1rem 1.25rem', color: 'var(--color-text)', fontSize: '0.9rem', verticalAlign: 'middle' }}>
                      {col.render ? col.render(row) : (row[col.accessor as keyof T] as unknown as string) || '—'}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No se encontraron coincidencias para "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, processedData.length)} de {processedData.length}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: currentPage === 1 ? 'transparent' : 'var(--color-surface)',
                color: currentPage === 1 ? 'var(--color-text-muted)' : 'var(--color-text)',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center'
              }}
            >
              <CaretLeft size={16} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '0.4rem 0.6rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: currentPage === totalPages ? 'transparent' : 'var(--color-surface)',
                color: currentPage === totalPages ? 'var(--color-text-muted)' : 'var(--color-text)',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center'
              }}
            >
              <CaretRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
