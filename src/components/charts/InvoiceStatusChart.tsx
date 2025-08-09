// src/components/charts/InvoiceStatusChart.tsx

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface InvoiceStatusChartProps {
  data: {
    status: string;
    count: number;
    amount: number;
  }[];
  type?: 'count' | 'amount';
  height?: number;
  horizontal?: boolean;
}

const InvoiceStatusChart: React.FC<InvoiceStatusChartProps> = ({ 
  data, 
  type = 'amount',
  height = 300,
  horizontal = false
}) => {
  const chartRef = useRef<ChartJS<'bar'>>(null);

  // Status colors
  const statusColors: Record<string, { bg: string; border: string }> = {
    'Paid': { bg: 'rgba(34, 197, 94, 0.8)', border: 'rgb(34, 197, 94)' },
    'Pending': { bg: 'rgba(251, 146, 60, 0.8)', border: 'rgb(251, 146, 60)' },
    'Overdue': { bg: 'rgba(239, 68, 68, 0.8)', border: 'rgb(239, 68, 68)' },
    'Draft': { bg: 'rgba(107, 114, 128, 0.8)', border: 'rgb(107, 114, 128)' },
    'Cancelled': { bg: 'rgba(156, 163, 175, 0.8)', border: 'rgb(156, 163, 175)' },
  };

  const chartData: ChartData<'bar'> = {
    labels: data.map(item => item.status),
    datasets: [
      {
        label: type === 'count' ? 'Number of Invoices' : 'Total Amount',
        data: data.map(item => type === 'count' ? item.count : item.amount),
        backgroundColor: data.map(item => statusColors[item.status]?.bg || 'rgba(107, 114, 128, 0.8)'),
        borderColor: data.map(item => statusColors[item.status]?.border || 'rgb(107, 114, 128)'),
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: '600',
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context) => {
            if (type === 'count') {
              return `${context.parsed.y} invoice${context.parsed.y !== 1 ? 's' : ''}`;
            } else {
              return formatCurrency(context.parsed.y);
            }
          },
          afterLabel: (context) => {
            const item = data[context.dataIndex];
            if (type === 'amount' && item.count > 0) {
              return `${item.count} invoice${item.count !== 1 ? 's' : ''}`;
            }
            if (type === 'count' && item.amount > 0) {
              return `Total: ${formatCurrency(item.amount)}`;
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: !horizontal,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 12,
            weight: '500',
          },
          color: '#6B7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: horizontal,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#6B7280',
          callback: function(value) {
            if (type === 'count') {
              return value;
            }
            return formatCurrency(value as number);
          },
        },
      },
    },
  };

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
};

export default InvoiceStatusChart;