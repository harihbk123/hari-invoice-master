// src/components/charts/ClientDistributionChart.tsx

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Pie, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ClientDistributionChartProps {
  data: {
    name: string;
    value: number;
    percentage?: number;
  }[];
  type?: 'pie' | 'doughnut';
  height?: number;
  showLegend?: boolean;
  showPercentage?: boolean;
}

const ClientDistributionChart: React.FC<ClientDistributionChartProps> = ({ 
  data, 
  type = 'doughnut',
  height = 300,
  showLegend = true,
  showPercentage = true
}) => {
  const chartRef = useRef<ChartJS<'pie' | 'doughnut'>>(null);

  // Calculate percentages if not provided
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const processedData = data.map(item => ({
    ...item,
    percentage: item.percentage || (total > 0 ? (item.value / total) * 100 : 0)
  }));

  // Color palette
  const colors = [
    'rgba(20, 184, 166, 0.8)',  // Teal
    'rgba(59, 130, 246, 0.8)',  // Blue
    'rgba(168, 85, 247, 0.8)',  // Purple
    'rgba(251, 146, 60, 0.8)',  // Orange
    'rgba(250, 204, 21, 0.8)',  // Yellow
    'rgba(236, 72, 153, 0.8)',  // Pink
    'rgba(34, 197, 94, 0.8)',   // Green
    'rgba(239, 68, 68, 0.8)',   // Red
    'rgba(107, 114, 128, 0.8)', // Gray
    'rgba(99, 102, 241, 0.8)',  // Indigo
  ];

  const borderColors = colors.map(color => color.replace('0.8', '1'));

  const chartData: ChartData<'pie' | 'doughnut'> = {
    labels: processedData.map(item => item.name),
    datasets: [
      {
        data: processedData.map(item => item.value),
        backgroundColor: colors.slice(0, processedData.length),
        borderColor: borderColors.slice(0, processedData.length),
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'pie' | 'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500',
          },
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            if (datasets.length === 0 || !datasets[0].data) return [];
            
            return chart.data.labels?.map((label, i) => {
              const value = datasets[0].data[i] as number;
              const percentage = processedData[i]?.percentage || 0;
              
              return {
                text: showPercentage 
                  ? `${label} (${percentage.toFixed(1)}%)`
                  : label as string,
                fillStyle: datasets[0].backgroundColor?.[i] as string,
                strokeStyle: datasets[0].borderColor?.[i] as string,
                lineWidth: 2,
                hidden: false,
                index: i,
              };
            }) || [];
          },
        },
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
            const label = context.label || '';
            const value = formatCurrency(context.parsed);
            const percentage = processedData[context.dataIndex]?.percentage || 0;
            return showPercentage 
              ? `${label}: ${value} (${percentage.toFixed(1)}%)`
              : `${label}: ${value}`;
          },
        },
      },
    },
    cutout: type === 'doughnut' ? '60%' : undefined,
  };

  const ChartComponent = type === 'pie' ? Pie : Doughnut;

  return (
    <div style={{ height: `${height}px`, position: 'relative' }}>
      <ChartComponent ref={chartRef} data={chartData} options={options} />
      {processedData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  );
};

export default ClientDistributionChart;