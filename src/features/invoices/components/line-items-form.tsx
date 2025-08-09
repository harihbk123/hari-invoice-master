'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus } from 'lucide-react';
import { LineItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface LineItemsFormProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  taxRate: number;
}

export function LineItemsForm({ items, onChange, taxRate }: LineItemsFormProps) {
  const [lineItems, setLineItems] = useState<LineItem[]>(items);

  useEffect(() => {
    setLineItems(items);
  }, [items]);

  const handleAddItem = () => {
    const newItem: LineItem = {
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    const updatedItems = [...lineItems, newItem];
    setLineItems(updatedItems);
    onChange(updatedItems);
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = lineItems.filter((_, i) => i !== index);
    setLineItems(updatedItems);
    onChange(updatedItems);
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const updatedItems = [...lineItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Recalculate amount when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      updatedItems[index].amount = 
        parseFloat(updatedItems[index].quantity.toString()) * 
        parseFloat(updatedItems[index].rate.toString());
    }

    setLineItems(updatedItems);
    onChange(updatedItems);
  };

  const calculateSubtotal = () => {
    return lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Line Items</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="space-y-3">
        {lineItems.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 p-3 border rounded-lg">
            <div className="col-span-5">
              <Input
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                min="1"
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Rate"
                value={item.rate}
                onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Amount"
                value={item.amount}
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div className="col-span-1 flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveItem(index)}
                disabled={lineItems.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Tax ({taxRate}%):</span>
          <span className="font-medium">{formatCurrency(calculateTax())}</span>
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span>{formatCurrency(calculateTotal())}</span>
        </div>
      </div>
    </div>
  );
}