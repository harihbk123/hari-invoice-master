import { Card, CardContent } from '@/components/ui/card';
import { DollarSign, Users, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MetricsCardsProps {
  totalEarnings: number;
  totalClients: number;
  totalInvoices: number;
  monthlyAverage: number;
  previousMonthEarnings?: number;
}

export function MetricsCards({ 
  totalEarnings, 
  totalClients, 
  totalInvoices, 
  monthlyAverage,
  previousMonthEarnings = 0
}: MetricsCardsProps) {
  const growthPercentage = previousMonthEarnings > 0 
    ? ((totalEarnings - previousMonthEarnings) / previousMonthEarnings) * 100
    : 0;

  const metrics = [
    {
      title: 'Total Earnings',
      value: formatCurrency(totalEarnings),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      change: growthPercentage,
    },
    {
      title: 'Total Clients',
      value: totalClients.toString(),
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      icon: FileText,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Monthly Average',
      value: formatCurrency(monthlyAverage),
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{metric.title}</p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  {metric.change !== undefined && metric.change !== 0 && (
                    <div className="flex items-center gap-1 text-xs">
                      {metric.change > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-green-500">+{metric.change.toFixed(1)}%</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="h-3 w-3 text-red-500" />
                          <span className="text-red-500">{metric.change.toFixed(1)}%</span>
                        </>
                      )}
                      <span className="text-muted-foreground">from last month</span>
                    </div>
                  )}
                </div>
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}