import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Invoice, Client, Settings } from '@/types';
import { formatDate } from '@/lib/utils';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

export function downloadInvoicePDF(invoice: Invoice, client: Client, settings: Settings) {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    putOnlyUsedFonts: true,
  });

  // Use built-in helvetica font
  doc.setFont('helvetica');

  // Title and Invoice Details
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 40, 60);

  // Invoice info box (top right)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice: ${invoice.id}`, 400, 40);
  doc.text(`Date: ${formatDate(invoice.date_issued)}`, 400, 55);
  doc.text(`Due: ${formatDate(invoice.due_date)}`, 400, 70);

  // FROM section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM:', 40, 100);
  
  let yPos = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(settings.profile_name || 'Your Company', 40, yPos);
  yPos += 15;
  
  if (settings.profile_address) {
    doc.setFontSize(9);
    const addressLines = doc.splitTextToSize(settings.profile_address, 200);
    addressLines.forEach((line: string) => {
      doc.text(line, 40, yPos);
      yPos += 12;
    });
  }
  
  doc.setFontSize(9);
  if (settings.profile_gstin) {
    doc.text(`GSTIN: ${settings.profile_gstin}`, 40, yPos);
    yPos += 12;
  }
  if (settings.profile_phone) {
    doc.text(`Phone: ${settings.profile_phone}`, 40, yPos);
    yPos += 12;
  }
  if (settings.profile_email) {
    doc.text(`Email: ${settings.profile_email}`, 40, yPos);
    yPos += 12;
  }

  // TO section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILLED TO:', 320, 100);
  
  let toYPos = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  doc.text(client.name, 320, toYPos);
  toYPos += 15;
  
  if (client.address) {
    doc.setFontSize(9);
    const clientAddressLines = doc.splitTextToSize(client.address, 200);
    clientAddressLines.forEach((line: string) => {
      doc.text(line, 320, toYPos);
      toYPos += 12;
    });
  }
  
  if (client.email) {
    doc.text(`Email: ${client.email}`, 320, toYPos);
    toYPos += 12;
  }
  
  if (client.phone) {
    doc.text(`Phone: ${client.phone}`, 320, toYPos);
    toYPos += 12;
  }

  // Items table
  const tableY = Math.max(yPos, toYPos) + 30;
  const tableData = invoice.items.map(item => {
    const rate = parseFloat(item.rate?.toString() || '0');
    const amount = parseFloat(item.amount?.toString() || '0');
    const qty = parseInt(item.quantity?.toString() || '1');
    return [
      item.description || '',
      qty.toString(),
      `INR ${rate.toFixed(2)}`,
      `INR ${amount.toFixed(2)}`
    ];
  });

  doc.autoTable({
    head: [['Description', 'Qty', 'Unit Cost', 'Amount']],
    body: tableData,
    startY: tableY,
    styles: { 
      fontSize: 9, 
      cellPadding: 6,
      overflow: 'linebreak'
    },
    headStyles: { 
      fillColor: [52, 73, 94], 
      textColor: [255, 255, 255], 
      fontSize: 10,
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 250, halign: 'left' },    // Description
      1: { cellWidth: 50, halign: 'center' },   // Qty
      2: { cellWidth: 90, halign: 'right' },    // Unit Cost
      3: { cellWidth: 90, halign: 'right' }     // Amount
    },
    margin: { left: 40, right: 40 }
  });

  // Totals section
  const totalsY = doc.lastAutoTable.finalY + 30;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  const subtotal = parseFloat(invoice.subtotal?.toString() || '0');
  const tax = parseFloat(invoice.tax?.toString() || '0');
  const total = parseFloat(invoice.amount?.toString() || '0');
  const taxRate = parseFloat(settings.tax_rate?.toString() || '0');

  // Subtotal
  doc.text('Subtotal:', 380, totalsY);
  doc.text(`INR ${subtotal.toFixed(2)}`, 520, totalsY, { align: 'right' });

  // Tax
  doc.text(`Tax (${taxRate}%):`, 380, totalsY + 20);
  doc.text(`INR ${tax.toFixed(2)}`, 520, totalsY + 20, { align: 'right' });

  // Total (bold)
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 380, totalsY + 55);
  doc.text(`INR ${total.toFixed(2)}`, 520, totalsY + 55, { align: 'right' });

  // Bank Details Section
  const bankY = totalsY + 80;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('BANK ACCOUNT DETAILS', 40, bankY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // All bank details in left column
  let leftY = bankY + 20;
  doc.text('Account Name:', 40, leftY);
  doc.text(settings.bank_account_name || settings.profile_name || 'Your Name', 150, leftY);
  leftY += 15;
  
  doc.text('Account Type:', 40, leftY);
  doc.text(settings.account_type || 'Current Account', 150, leftY);
  leftY += 15;
  
  doc.text('Account Number:', 40, leftY);
  doc.text(settings.bank_account || '', 150, leftY);
  leftY += 15;
  
  doc.text('Bank Name:', 40, leftY);
  doc.text(settings.bank_name || '', 150, leftY);
  leftY += 15;
  
  doc.text('Branch Name:', 40, leftY);
  doc.text(settings.bank_branch || '', 150, leftY);
  leftY += 15;
  
  doc.text('IFSC Code:', 40, leftY);
  doc.text(settings.bank_ifsc || '', 150, leftY);
  leftY += 15;
  
  doc.text('SWIFT Code:', 40, leftY);
  doc.text(settings.bank_swift || '', 150, leftY);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', 40, 750);

  // Save with clean filename
  const cleanInvoiceId = invoice.id.replace(/[^a-zA-Z0-9-_]/g, '_');
  doc.save(`Invoice_${cleanInvoiceId}.pdf`);
}