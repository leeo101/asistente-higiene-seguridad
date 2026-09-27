import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Recycle, ArrowLeft, Save, Truck, ShieldAlert,
  Calendar, Building, FileText, CheckCircle2
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import {
  HazardousWasteRecord, HAZARDOUS_Y_STREAMS, HAZARD_R_CODES
} from '../data/hazardousWasteData';
import toast from 'react-hot-toast';

export default function HazardousWasteForm(): React.ReactElement | null {
  const navigate = useNavigate();
  const { activeCompany } = useCompany();

  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentY, setCurrentY] = useState('Y8');
  const [hazardR, setHazardR] = useState('R3');
  const [description, setDescription] = useState('');
  const [quantityKg, setQuantityKg] = useState<number>(200);
  const [containerType, setContainerType] = useState<any>('drum_200l');
  const [containerQuantity, setContainerQuantity] = useState<number>(1);
  const [physicalState, setPhysicalState] = useState<any>('liquido');
  const [generatorArea, setGeneratorArea] = useState('');
  const [storageLocation, setStorageLocation] = useState('Depósito Transitorio de Residuos');
  const [status, setStatus] = useState<any>('stored');

  // Despacho / Manifiesto
  const [manifestNumber, setManifestNumber] = useState('');
  const [transportDate, setTransportDate] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [transporterCuit, setTransporterCuit] = useState('');
  const [transporterRegistryNumber, setTransporterRegistryNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');

  // Disposición Final
  const [disposalCertificateNumber, setDisposalCertificateNumber] = useState('');
  const [disposalFacilityName, setDisposalFacilityName] = useState('');
  const [disposalMethod, setDisposalMethod] = useState<any>('reciclado_regeneracion');
  const [disposalDate, setDisposalDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !generatorArea.trim()) {
      toast.error('Completa la descripción del residuo y el sector generador.');
      return;
    }

    const newRecord: HazardousWasteRecord = {
      id: `hw_${Date.now()}`,
      companyId: activeCompany?.id,
      entryDate,
      currentY,
      hazardR,
      description,
      quantityKg,
      containerType,
      containerQuantity,
      physicalState,
      generatorArea,
      storageLocation,
      status,
      manifestNumber: manifestNumber.trim() || undefined,
      transportDate: transportDate || undefined,
      transporterName: transporterName.trim() || undefined,
      transporterCuit: transporterCuit.trim() || undefined,
      transporterRegistryNumber: transporterRegistryNumber.trim() || undefined,
      vehiclePlate: vehiclePlate.trim() || undefined,
      disposalCertificateNumber: disposalCertificateNumber.trim() || undefined,
      disposalFacilityName: disposalFacilityName.trim() || undefined,
      disposalMethod: status === 'disposed' ? disposalMethod : undefined,
      disposalDate: disposalDate || undefined,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    const raw = localStorage.getItem('hazardous_waste_db');
    let list: HazardousWasteRecord[] = [];
    if (raw) {
      try { list = JSON.parse(raw); } catch (e) {}
    }
    list.unshift(newRecord);
    localStorage.setItem('hazardous_waste_db', JSON.stringify(list));

    toast.success('Partida de residuo peligroso registrada con éxito');
    navigate('/hazardous-waste');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <PremiumHeader
        title="Registrar Residuo Peligroso / Especial"
        subtitle="Asignación de corriente Y, control de acopio transitorio y trazabilidad de Manifiesto"
        badge="Ley Nac. 24.051"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <button
          onClick={() => navigate('/hazardous-waste')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Volver al libro de residuos
        </button>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Bloque 1: Identificación y Corriente Y */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Recycle className="text-teal-600" size={20} />
              1. Identificación del Residuo y Corriente Normativa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Fecha de Generación *
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={e => setEntryDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Corriente de Desecho Sometida a Control (Anexo I Ley 24.051) *
                </label>
                <select
                  value={currentY}
                  onChange={e => setCurrentY(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {HAZARDOUS_Y_STREAMS.map(y => (
                    <option key={y.code} value={y.code}>{y.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Riesgo Principal (Código R)
                </label>
                <select
                  value={hazardR}
                  onChange={e => setHazardR(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  {HAZARD_R_CODES.map(r => (
                    <option key={r.code} value={r.code}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Descripción Comercial / Composición del Desecho *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Aceite usado de cárter de autoelevadores y prensas"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cantidad Estimada (kg) *
                </label>
                <input
                  type="number"
                  value={quantityKg}
                  onChange={e => setQuantityKg(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Tipo de Contenedor
                </label>
                <select
                  value={containerType}
                  onChange={e => setContainerType(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="drum_200l">Tambor metálico / plástico 200 Litros</option>
                  <option value="ibc_1000l">Contenedor IBC 1.000 Litros</option>
                  <option value="bag_bigbag">Bolsón Big Bag (Sólidos)</option>
                  <option value="bin_container">Batea / Volquete contenedor</option>
                  <option value="other">Bidones o cajas menores</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Cantidad de Contenedores
                </label>
                <input
                  type="number"
                  value={containerQuantity}
                  onChange={e => setContainerQuantity(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Estado Físico
                </label>
                <select
                  value={physicalState}
                  onChange={e => setPhysicalState(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="liquido">Líquido</option>
                  <option value="solido">Sólido</option>
                  <option value="semisolido">Semisólido / Lodo</option>
                  <option value="gaseoso">Gaseoso / Aerosol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Sector Generador *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Mantenimiento, Línea de Pintura"
                  value={generatorArea}
                  onChange={e => setGeneratorArea(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Lugar de Acopio Transitorio
                </label>
                <input
                  type="text"
                  value={storageLocation}
                  onChange={e => setStorageLocation(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Estado del Residuo y Despacho */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Truck className="text-teal-600" size={20} />
              2. Estado del Residuo y Trazabilidad de Manifiesto
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Condición Actual de la Partida
                </label>
                <div className="flex gap-4">
                  {[
                    { id: 'stored', label: 'En Acopio Transitorio en Planta' },
                    { id: 'in_transit', label: 'Despachado con Manifiesto (En Tránsito)' },
                    { id: 'disposed', label: 'Tratado y Dispuesto con Certificado' }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="radio"
                        name="status"
                        checked={status === opt.id}
                        onChange={() => setStatus(opt.id)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {status !== 'stored' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      N° de Manifiesto Oficial
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. MAN-2026-98124"
                      value={manifestNumber}
                      onChange={e => setManifestNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Fecha de Retiro / Transporte
                    </label>
                    <input
                      type="date"
                      value={transportDate}
                      onChange={e => setTransportDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Empresa Transportista Habilitada
                    </label>
                    <input
                      type="text"
                      placeholder="Razón Social del Transportista"
                      value={transporterName}
                      onChange={e => setTransporterName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      CUIT del Transportista
                    </label>
                    <input
                      type="text"
                      placeholder="XX-XXXXXXXX-X"
                      value={transporterCuit}
                      onChange={e => setTransporterCuit(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Patente / Dominio del Vehículo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. AB 123 CD"
                      value={vehiclePlate}
                      onChange={e => setVehiclePlate(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 uppercase"
                    />
                  </div>
                </>
              )}

              {status === 'disposed' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      N° Certificado de Disposición Final
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. CERT-DISP-4512"
                      value={disposalCertificateNumber}
                      onChange={e => setDisposalCertificateNumber(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Planta de Tratamiento / Operador
                    </label>
                    <input
                      type="text"
                      placeholder="Nombre del Operador Autorizado"
                      value={disposalFacilityName}
                      onChange={e => setDisposalFacilityName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                      Método de Eliminación / Tratamiento
                    </label>
                    <select
                      value={disposalMethod}
                      onChange={e => setDisposalMethod(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100"
                    >
                      <option value="reciclado_regeneracion">Reciclado / Regeneración de Aceites</option>
                      <option value="incineracion">Incineración Térmica Controlada</option>
                      <option value="tratamiento_fisicoquimico">Tratamiento Físico-Químico</option>
                      <option value="confinamiento_celda">Confinamiento en Celda de Seguridad</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/hazardous-waste')}
              className="px-5 py-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-colors"
            >
              <Save size={16} /> Guardar Registro en Libro Oficial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
