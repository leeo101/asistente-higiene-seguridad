import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Company {
  id: string;
  name: string;
  cuit?: string;
  address?: string;
  establishment?: string;
  activity?: string;
  art?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  logo?: string;
  createdAt: string;
  updatedAt?: string;
}

interface CompanyContextType {
  companies: Company[];
  activeCompany: Company | null;
  activeCompanyId: string | 'all';
  setActiveCompanyId: (id: string | 'all') => void;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  isAllCompanies: boolean;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

const STORAGE_KEY = 'hys_companies_list';
const ACTIVE_COMPANY_KEY = 'hys_active_company_id';

const DEFAULT_SAMPLE_COMPANIES: Company[] = [
  {
    id: 'comp_sample_1',
    name: 'Logística & Almacenes Centrales S.A.',
    cuit: '30-71458920-4',
    address: 'Ruta Panamericana Km 38.5, Tortuguitas',
    establishment: 'Centro Logístico Tortuguitas',
    activity: 'Almacenamiento y distribución logística',
    art: 'Provincia ART',
    contactPerson: 'Ing. Martín Soler',
    createdAt: new Date().toISOString()
  },
  {
    id: 'comp_sample_2',
    name: 'Metalúrgica del Plata S.R.L.',
    cuit: '30-68945123-8',
    address: 'Parque Industrial Pilar, Calle 4 Nº 250',
    establishment: 'Planta de Mecanizado Nº 1',
    activity: 'Fabricación de piezas y estructuras metálicas',
    art: 'La Segunda ART',
    contactPerson: 'Lic. Carla Fernández',
    createdAt: new Date().toISOString()
  }
];

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<Company[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Error reading companies from storage:', e);
    }
    return DEFAULT_SAMPLE_COMPANIES;
  });

  const [activeCompanyId, setActiveCompanyIdState] = useState<string | 'all'>(() => {
    try {
      const storedActive = localStorage.getItem(ACTIVE_COMPANY_KEY);
      return storedActive || 'all';
    } catch {
      return 'all';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch (e) {
      console.warn('Error saving companies to storage:', e);
    }
  }, [companies]);

  const setActiveCompanyId = (id: string | 'all') => {
    setActiveCompanyIdState(id);
    try {
      localStorage.setItem(ACTIVE_COMPANY_KEY, id);
    } catch (e) {
      console.warn('Error saving active company id:', e);
    }
  };

  const activeCompany = activeCompanyId === 'all'
    ? null
    : companies.find(c => c.id === activeCompanyId) || null;

  const addCompany = (data: Omit<Company, 'id' | 'createdAt'>): Company => {
    const newCompany: Company = {
      ...data,
      id: `comp_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCompanies(prev => [newCompany, ...prev]);
    setActiveCompanyId(newCompany.id);
    return newCompany;
  };

  const updateCompany = (id: string, updates: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c))
    );
  };

  const deleteCompany = (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    if (activeCompanyId === id) {
      setActiveCompanyId('all');
    }
  };

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompany,
        activeCompanyId,
        setActiveCompanyId,
        addCompany,
        updateCompany,
        deleteCompany,
        isAllCompanies: activeCompanyId === 'all'
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = (): CompanyContextType => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe ser utilizado dentro de un CompanyProvider');
  }
  return context;
};
