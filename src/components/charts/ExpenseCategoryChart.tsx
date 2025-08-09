// src/components/charts/ExpenseCategoryChart.tsx

import React, { useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ExpenseCategoryChartProps {
  data: {
    name: string;
    amount: number;
    count: number;
    percentage: number;
    icon: string;
    color: string;
  }[];
  type?: 'bar' | 'doughnut';
  height?: number;
  showTop?: number;
}

const ExpenseCategoryChart: React.FC<ExpenseCategoryChartProps> = ({ 
  data, 
  type = 'bar',
  height = 300,
  showTop = 10
}) => {
  const chartRef = useRef<ChartJS<'bar' | 'doughnut'>>(null);

  // Limit to top categories
  const chartDataSliced = data.slice(0, showTop);

  if (type === 'bar') {
    const barData: ChartData<'bar'> = {
      labels: chartDataSliced.map(item => item.name),
      datasets: [
        {
          label: 'Expense Amount',
          data: chartDataSliced.map(item => item.amount),
          backgroundColor: chartDataSliced.map(item => item.color + '99'), // Add transparency
          borderColor: chartDataSliced.map(item => item.color),
          borderWidth: 2,
          borderRadius: 8,
        },
      ],
    };

    const barOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
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
            title: (context) => {
              const item = chartDataSliced[context[0].dataIndex];
              return `${item.icon} ${item.name}`;
            },
            label: (context) => {
              const item = chartDataSliced[context.dataIndex];
              return [
                `Amount: ${formatCurrency(context.parsed.y)}`,
                `Transactions: ${item.count}`,
                `Percentage: ${item.percentage.toFixed(1)}%`
              ];
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            font: {
              size: 11,
            },
            color: '#6B7280',
            maxRotation: 45,
            minRotation: 0,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)',
          },
          ticks: {
            font: {
              size: 11,
            },
            color: '#6B7280',
            callback: function(value) {
              return formatCurrency(value as number);
            },
          },
        },
      },
    };

    return (
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Bar ref={chartRef} data={barData} options={barOptions} />
      </div>
    );
  } else {
    const doughnutData: ChartData<'doughnut'> = {
      labels: chartDataSliced.map(item => `${item.icon} ${item.name}`),
      datasets: [
        {
          data: chartDataSliced.map(item => item.amount),
          backgroundColor: chartDataSliced.map(item => item.color + '99'),
          borderColor: chartDataSliced.map(item => item.color),
          borderWidth: 2,
        },
      ],
    };

    const doughnutOptions: ChartOptions<'doughnut'> = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            padding: 15,
            usePointStyle: true,
            font: {
              size: 11,
              weight: '500',
            },
            generateLabels: (chart) => {
              const datasets = chart.data.datasets;
              if (datasets.length === 0 || !datasets[0].data) return [];
              
              return chart.data.labels?.map((label, i) => {
                const value = datasets[0].data[i] as number;
                const item = chartDataSliced[i];
                
                return {
                  text: `${label} (${item.percentage.toFixed(1)}%)`,
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
              const item = chartDataSliced[context.dataIndex];
              return [
                `Amount: ${formatCurrency(context.parsed)}`,
                `Transactions: ${item.count}`,
                `Percentage: ${item.percentage.toFixed(1)}%`
              ];
            },
          },
        },
      },
    };

    return (
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Doughnut ref={chartRef} data={doughnutData} options={doughnutOptions} />
      </div>
    );
  }
};

export default ExpenseCategoryChart;