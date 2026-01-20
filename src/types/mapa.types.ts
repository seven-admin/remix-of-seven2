import type { UnidadeStatus } from './empreendimentos.types';

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface PolygonCoords {
  points: PolygonPoint[];
  raio?: number; // Para marcadores circulares
}

// Tipo do item desenhado: polígono ou marcador (círculo)
export type MapaItemTipo = 'polygon' | 'marker';

export interface DrawnItem {
  id: string;
  tipo: MapaItemTipo;
  points: PolygonPoint[]; // Para polygon: array de pontos; Para marker: [centro]
  raio?: number; // Apenas para markers
  unidadeId?: string;
}

export const getPolygonColor = (status: UnidadeStatus): string => {
  switch (status) {
    case 'disponivel':
      return '#22c55e'; // Verde
    case 'reservada':
      return '#eab308'; // Amarelo
    case 'negociacao':
      return '#3b82f6'; // Azul
    case 'contrato':
      return '#a855f7'; // Roxo
    case 'vendida':
      return '#ef4444'; // Vermelho
    case 'bloqueada':
      return '#6b7280'; // Cinza
    default:
      return '#d1d5db'; // Cinza claro (sem vínculo)
  }
};

export const getPolygonColorWithOpacity = (status: UnidadeStatus, opacity: number = 0.6): string => {
  switch (status) {
    case 'disponivel':
      return `rgba(34, 197, 94, ${opacity})`; // Verde
    case 'reservada':
      return `rgba(234, 179, 8, ${opacity})`; // Amarelo
    case 'negociacao':
      return `rgba(59, 130, 246, ${opacity})`; // Azul
    case 'contrato':
      return `rgba(168, 85, 247, ${opacity})`; // Roxo
    case 'vendida':
      return `rgba(239, 68, 68, ${opacity})`; // Vermelho
    case 'bloqueada':
      return `rgba(107, 114, 128, ${opacity})`; // Cinza
    default:
      return `rgba(209, 213, 219, ${opacity})`; // Cinza claro
  }
};

export const STATUS_LEGEND = [
  { status: 'disponivel' as UnidadeStatus, label: 'Disponível', color: '#22c55e' },
  { status: 'reservada' as UnidadeStatus, label: 'Reservado', color: '#eab308' },
  { status: 'negociacao' as UnidadeStatus, label: 'Em Negociação', color: '#3b82f6' },
  { status: 'contrato' as UnidadeStatus, label: 'Em Contrato', color: '#a855f7' },
  { status: 'vendida' as UnidadeStatus, label: 'Vendido', color: '#ef4444' },
  { status: 'bloqueada' as UnidadeStatus, label: 'Bloqueado', color: '#6b7280' },
];
